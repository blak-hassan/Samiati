#!/usr/bin/env python
"""
Build + upload augmented collections for Kenyan languages to BlakHasan/*.

Covers (Tier 1+2+3): swa, luo, kln, mas, som, luhya, kam, guz, kik,
plus small: meru, embu, kisii, taita, turkana, giriama.

Strategy per language (same as Kikuyu build):
  MT text  -> actually merged, cleaned, uploaded as data/mt/{train,test}.parquet
  Audio    -> NOT re-uploaded (100s of GB). Manifests + recipes only:
              data/manifests/asr_sources.csv, tts_sources.csv
  Non-HF   -> documented as recipes in README + data/manifests/nonhf_sources.csv
              (OPUS NLLB/CCAligned/bible-uedin, FLORES/FLEURS, KenCorpus Dataverse,
               Open.Bible/BibleTTS, Common Voice MDC). Re-upload only if license
              allows (CC0/BY/BY-SA yes; JW300/MDC-reshare/Kasahorow no).

Usage:
  pip install datasets huggingface_hub pandas pyarrow
  set HF_TOKEN=hf_xxx
  python scripts/build_kenyan_languages.py --langs guz meru --no-push --mt-max-rows 5000
  python scripts/build_kenyan_languages.py --langs swa luo kln mas som luhya kam guz kik --push
  python scripts/build_kenyan_languages.py --all --push --repo-prefix BlakHasan
"""
from __future__ import annotations
import argparse, os, sys
from pathlib import Path
import pandas as pd
try:
    from datasets import load_dataset
except ImportError:
    print("pip install datasets huggingface_hub pandas pyarrow"); sys.exit(1)

# ---------------------------------------------------------------- registry
# mt: list of (hf_id, cap_group). cap_group 'big' gets --mt-max-rows cap, else full.
REGISTRY = {
 "swa": {"name": "Swahili", "iso": "swh",
  "mt": [("michsethowusu/english-swahili_sentence-pairs","big"), ("Rogendo/English-Swahili-Sentence-Pairs",None), ("Kencorpus/KenTrans",None)],
  "mono": "LughaGen-Organization/LughaGen-Multilingual-African-Corpus",
  "asr": ["Kencorpus/KenSpeech", "Kencorpus/KenCorpus_audio", "Professor/swahili-speech-data"],
  "tts": ["google/WaxalNLP:swa_tts", "facebook/mms-tts-swh"],
  "nonhf": ["OPUS NLLB en-sw (opus_get --corpus NLLB)", "OPUS CCAligned/CCMatrix en-sw", "OPUS bible-uedin (CC0)", "FLORES-200 swh_Latn eval-only", "FLEURS sw_ke eval", "KenCorpus Dataverse doi:10.7910/DVN/KLCKL5 (CC-BY-4.0)", "Open.Bible Kiswahili Contemporary (CC-BY-SA)", "Common Voice sw via Mozilla Data Collective (CC0, no-reshare)"]},
 "luo": {"name": "Dholuo", "iso": "luo",
  "mt": [("michsethowusu/english-dholuo_sentence-pairs_mt560","big"), ("KnoxDevelopers/english_luo_sentence_pair_dataset",None), ("Kencorpus/KenTrans",None), ("samptah/kenyan-languages-corpus-engine",None)],
  "mono": "LughaGen-Organization/LughaGen-Multilingual-African-Corpus",
  "asr": ["Anv-ke/Dholuo (723h: 195 scripted+528 unscripted, gated CC-BY-4.0)", "Professor/dholuo-speech-data (191.5h)", "Kencorpus/KenCorpus_audio (99h Dholuo)"],
  "tts": ["google/WaxalNLP:luo_tts (1.99k studio, CC-BY-SA-4.0)", "masakhane-io/bibleTTS Luo 80.4h unaligned (CC-BY-SA, OpenSLR 129)"],
  "nonhf": ["OPUS NLLB en-luo", "OPUS bible-uedin luo (CC0)", "FLORES-200 luo_Latn eval-only", "FLEURS luo_ke eval", "KenCorpus Dataverse (CC-BY-4.0)", "Open.Bible Luo (CC-BY-SA)"]},
 "kln": {"name": "Kalenjin", "iso": "kln",
  "mt": [("Biatus/afrinllb-kikuyu-kalenjin-dataset","big"), ("mutaician/english-kalenjin-dataset",None), ("KnoxDevelopers/english_kalenjin_pair_sentences",None), ("samptah/kenyan-languages-corpus-engine",None)],
  "mono": None,
  "asr": ["Anv-ke/Kalenjin (521h: 122+399, Nandi/Kipsigis, gated)", "Professor/kalenjin-speech-data (153.2h)", "mozilla-foundation/common_voice:kln (~88h, CC0) / kln001/kalenjin-asr-data mirror"],
  "tts": ["(no studio TTS found — use ASR scripted single-speaker filtering)"],
  "nonhf": ["FLORES: no kln — do not substitute", "Common Voice MDC kln (CC0, no-reshare)"]},
 "mas": {"name": "Maasai", "iso": "mas",
  "mt": [("KnoxDevelopers/english_maasai_pair_sentences",None), ("NorthernTribe-Research/maasai-translation-corpus",None)],
  "mono": None,
  "asr": ["Anv-ke/Maasai (505h: 51+454, 100% transcribed, gated)", "Professor/maasai-speech-data (83.7h)"],
  "tts": ["(no studio TTS — filter ANV scripted; note Waxal mas_asr is Masaaba/myx, NOT Maasai)"],
  "nonhf": ["Open.Bible Maasai (CC-BY-SA, check coverage)", "OPUS bible-uedin mas if present (CC0)"]},
 "som": {"name": "Somali", "iso": "som",
  "mt": [("michsethowusu/english-somali_sentence-pairs","big"), ("thiomi/thiomi-5k:som_Latn",None)],
  "mono": None,
  "asr": ["Anv-ke/Somali (502h Maxatire, 100% transcribed, gated)", "Professor/somali-speech-data (103.2h)", "Digital-Divide-Data/Somali-ASR-Subset-68H"],
  "tts": ["(no studio TTS — filter scripted single-speaker)"],
  "nonhf": ["OPUS NLLB/CCAligned en-so", "FLORES-200 som_Latn eval-only", "FLEURS so (eval)", "Common Voice so via MDC"]},
 "luhya": {"name": "Luhya", "iso": "luy",
  "mt": [("Kencorpus/KenTrans:lbk",None), ("Kencorpus/KenTrans:lch",None), ("Kencorpus/KenTrans:llg",None), ("Kencorpus/KenTrans:dho",None)],
  "mono": "Kencorpus/KenCorpus_text",
  "asr": ["Digital-Divide-Data/Luhya-ASR-Data-subset-642H (top pick, CC-BY-4.0)", "Digital-Divide-Data/Luhya-ASR-Data-subset-50h + CA/LW/LA/TO dialects", "Kencorpus/KenCorpus_audio (58h Luhya: Bukusu/Lumarachi/Logooli)"],
  "tts": ["(no studio TTS — filter Luhya scripted)"],
  "nonhf": ["KenCorpus Dataverse (CC-BY-4.0): 449 Marachi + 247 Logooli texts, 93k Luhya POS", "Open.Bible Luhya (CC-BY-SA)"]},
 "kam": {"name": "Kamba", "iso": "kam",
  "mt": [("michsethowusu/english-kamba_sentence-pairs","big"), ("samptah/kenyan-languages-corpus-engine",None), ("KnoxDevelopers/english_kikamba_pair_sentences",None)],
  "mono": "LughaGen-Organization/LughaGen-Multilingual-African-Corpus",
  "asr": ["Digital-Divide-Data/Kamba-ASR-Data-Subset-484H (top pick)", "lawmaluki/KambaBench-ASR"],
  "tts": ["(no studio TTS — filter scripted)"],
  "nonhf": ["OPUS NLLB en-kam", "FLORES-200 kam_Latn eval-only", "FLEURS kam_ke eval", "Open.Bible Kamba (CC-BY-SA)"]},
 "guz": {"name": "Gusii", "iso": "guz",
  "mt": [("KnoxDevelopers/english_kisii_pair_sentences",None)],
  "mono": None,
  "asr": ["Digital-Divide-Data/Gusii-ASR-Data-Subset-470H (top pick)", "Odhuso/ddd-kenya-gusii-asr-v1"],
  "tts": ["(no studio TTS — filter scripted)"],
  "nonhf": ["Open.Bible Gusii (CC-BY-SA, check coverage)", "OPUS bible-uedin guz if present (CC0)"]},
 "kik": {"name": "Kikuyu", "iso": "kik",
  "mt": [("michsethowusu/english-kikuyu_sentence-pairs","big"), ("KnoxDevelopers/english_kikuyu_sentence_pair_dataset",None), ("Biatus/afrinllb-kikuyu-kalenjin-dataset","big"), ("KevinKibe/kikuyu-sentence-pairs",None)],
  "mono": "karanjaxyz/kikuyu_monolingual_sentences",
  "asr": ["Anv-ke/kikuyu (754h, gated)", "Professor/kikuyu-speech-data (185.8h)"],
  "tts": ["google/WaxalNLP:kik_tts (2.03k studio)", "gateremark/kikuyu-tts-training (48.5k)", "masakhane-io/bibleTTS Kikuyu 90.6h unaligned"],
  "nonhf": ["OPUS NLLB en-kik", "FLORES-200 kik_Latn eval-only", "Open.Bible Kikuyu (CC-BY-SA)"]},
 "meru": {"name": "Meru", "iso": "mer",
  "mt": [("KnoxDevelopers/english_meru_pair_sentences",None), ("thiomi/thiomi-5k:mer_Latn",None)],
  "mono": None, "asr": ["(none found — collect or transfer from Kikuyu/Kamba)"],
  "tts": ["(none)"], "nonhf": ["Open.Bible Meru if present (CC-BY-SA)"]},
 "embu": {"name": "Embu", "iso": "ebu",
  "mt": [("KnoxDevelopers/english_embu_pair_sentences",None)],
  "mono": None, "asr": ["(none found)"], "tts": ["(none)"], "nonhf": ["Open.Bible Embu if present"]},
 "kisii": {"name": "Kisii", "iso": "guz",
  "mt": [("KnoxDevelopers/english_kisii_pair_sentences",None)],
  "mono": None, "asr": ["Digital-Divide-Data/Gusii-ASR-Data-Subset-470H"],
  "tts": ["(none)"], "nonhf": []},
 "taita": {"name": "Taita", "iso": "dav",
  "mt": [("KnoxDevelopers/english_taita_pair_sentences",None)],
  "mono": None, "asr": ["(none found)"], "tts": ["(none)"], "nonhf": []},
 "turkana": {"name": "Turkana", "iso": "tuv",
  "mt": [], "mono": None,
  "asr": ["speedykom-group/turkana-speech-dataset (5k segs, CC-BY-NC-4.0)", "speedykom-group/turkana-2.0-dataset"],
  "tts": ["(GRN Bible single-speaker — usable with NC restriction)"],
  "nonhf": []},
 "giriama": {"name": "Giriama", "iso": "nyf",
  "mt": [("Lingua-Connect/English-Giriama-Dataset",None)],
  "mono": None, "asr": ["(none found)"], "tts": ["(none)"], "nonhf": ["Open.Bible Giriama if present"]},
}

def normalize_pair_df(df, origin):
    cols = {c.lower().strip(): c for c in df.columns}
    if "translation" in cols:
        def pick(t):
            if not isinstance(t, dict): return (None,None,None,None)
            for sl in ("eng_Latn","swh_Latn","eng","swh","en","sw"):
                tgt = t.get("kik_Latn") or t.get("kln_Latn") or t.get("luo_Latn") or t.get("mas_Latn") or t.get("som_Latn") or t.get("kam_Latn") or t.get("swh_Latn")
                alt = None
                for k in ("kik_Latn","kln_Latn","luo_Latn","mas_Latn","som_Latn","kam_Latn","kik","kln","luo","mas","som","kam","guz","mer","embu","taita"):
                    if t.get(k): alt = t[k]; break
                if t.get(sl) and alt: return (t[sl], alt, sl.split("_")[0], "tgt")
            # generic: first non-source as target
            vals = [v for v in t.values() if isinstance(v,str) and v.strip()]
            return (vals[0] if len(vals)>0 else None, vals[1] if len(vals)>1 else None, "src", "tgt") if len(vals)>=2 else (None,None,None,None)
        picks = df[cols["translation"]].map(pick)
        out = pd.DataFrame(picks.tolist(), columns=["src","tgt","src_lang","tgt_lang"])
        out["origin_dataset"] = origin
        return out
    en_c = next((cols[k] for k in cols if k in ("english","en","eng","source","src","premise","swahili","sw")), None)
    # target = any non-english column: be permissive
    tgt_candidates = [c for c in df.columns if c != en_c]
    ki_c = None
    for cand in ["kikuyu","kik","kalenjin","kln","dholuo","luo","maasai","mas","somali","som","luhya","kamba","kam","gusii","kisii","meru","embu","taita","turkana","giriama","target","tgt","hypothesis","translation","text"]:
        if cand in cols: ki_c = cols[cand]; break
    if en_c is None or ki_c is None:
        # Knox Bible CSVs have whole verses as headers and pyarrow string dtype
        # (not object), so fall back to first two columns regardless of dtype.
        if len(df.columns) >= 2: en_c, ki_c = list(df.columns)[:2]
        else: return pd.DataFrame(columns=["src","tgt","src_lang","tgt_lang","origin_dataset"])
    out = pd.DataFrame({"src": df[en_c].astype(str), "tgt": df[ki_c].astype(str),
                        "src_lang": "src", "tgt_lang": "tgt", "origin_dataset": origin})
    if "similarity" in cols:
        out["similarity"] = pd.to_numeric(df[cols["similarity"]], errors="coerce")
    return out

def clean_mt(df, min_sim=1.0):
    if df.empty: return df
    df = df.dropna(subset=["src","tgt"])
    df["src"] = df["src"].str.strip(); df["tgt"] = df["tgt"].str.strip()
    df = df[(df["src"].str.len()>=3)&(df["tgt"].str.len()>=3)]
    df = df[(df["src"].str.len()<2000)&(df["tgt"].str.len()<2000)]
    if "similarity" in df.columns and min_sim>0:
        df = df[df["similarity"].fillna(99)>=min_sim]
    df = df.drop_duplicates(subset=["src","tgt"])
    return df.reset_index(drop=True)

def load_mt_source(hf_id, max_rows=None):
    # config-style ids like thiomi/thiomi-5k:som_Latn
    base, conf = (hf_id.split(":",1) + [None])[:2] if ":" in hf_id else (hf_id, None)
    # streaming-first when capped (avoids GB downloads for 10-23M sources)
    if max_rows:
        try:
            kw = {"split": "train", "streaming": True}
            ds = load_dataset(base, conf, **kw) if conf else load_dataset(base, **kw)
            rows = []
            for i, r in enumerate(ds):
                if i >= max_rows: break
                rows.append(r)
            return normalize_pair_df(pd.DataFrame(rows), hf_id)
        except Exception as e:
            print(f"[skip MT streaming] {hf_id}: {str(e)[:160]}")
            return pd.DataFrame(columns=["src","tgt","src_lang","tgt_lang","origin_dataset"])
    try:
        ds = load_dataset(base, conf, split="train") if conf else load_dataset(hf_id, split="train")
        return normalize_pair_df(ds.to_pandas(), hf_id)
    except Exception as e:
        print(f"[skip MT] {hf_id}: {str(e)[:160]}")
        return pd.DataFrame(columns=["src","tgt","src_lang","tgt_lang","origin_dataset"])

def card_for(lang, info, repo_id, mt_n, mono_n):
    src_lines = "\n".join([f"- {s}" for s in info["mt"]]) if info["mt"] else "- (no MT pairs found — transfer from Swahili/English)"
    asr_lines = "\n".join([f"- {s}" for s in info["asr"]])
    tts_lines = "\n".join([f"- {s}" for s in info["tts"]])
    nonhf_lines = "\n".join([f"- {s}" for s in info["nonhf"]]) if info["nonhf"] else "- (none documented)"
    return f"""---
language: [{info['iso']}]
tags: [translation, automatic-speech-recognition, text-to-speech, {info['iso']}, kenya, low-resource]
task_categories: [translation, automatic-speech-recognition, text-to-speech]
---

# {info['name']} Augmented Collection (MT + ASR/TTS manifests)

MT rows merged here: {mt_n} | Monolingual rows: {mono_n}

## MT merged from (text actually in repo)
{src_lines}

Knox * Bible sets are CC-BY-NC-4.0 (non-commercial, noisy/unverified).
michsethowusu * NLLB-mined sets need similarity filtering + dedupe.
Kencorpus sets are CC-BY-4.0. FLORES (OPUS/FLORES-200) is eval-only.

## ASR — audio NOT re-uploaded, stream from source
{asr_lines}

## TTS — audio NOT re-uploaded
{tts_lines}

## Non-HF open sources (recipes, redistribution notes)
{nonhf_lines}

Re-upload to HF allowed: KenCorpus (BY), FLORES-200/+, bible-uedin (CC0), Open.Bible/BibleTTS (BY-SA), OPUS NLLB/CCAligned (attribute), FLEURS (BY), Zenodo CC0/BY.
Do NOT bulk re-upload: JW300, new Common Voice MDC (no-reshare request), Kasahorow, CLARIN restricted.

## Load
```python
from datasets import load_dataset
mt = load_dataset("{repo_id}", data_files="data/mt/train.parquet", split="train")
```
"""

def build_lang(lang, args):
    info = REGISTRY[lang]
    repo_id = f"{args.repo_prefix}/{lang}-augmented-collection"
    out = Path(f"output_{lang}"); (out/"data"/"mt").mkdir(parents=True, exist_ok=True)
    (out/"data"/"manifests").mkdir(parents=True, exist_ok=True)
    frames = []
    for hf_id, grp in info["mt"]:
        if ":" in hf_id and grp is None: cap = None
        else: cap = args.mt_max_rows if grp=="big" else None
        print(f"[{lang}] MT: {hf_id} cap={cap}")
        frames.append(load_mt_source(hf_id, cap))
    mt = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame(columns=["src","tgt","src_lang","tgt_lang","origin_dataset"])
    mt = clean_mt(mt, args.min_sim)
    test = mt.sample(frac=0.02, random_state=42) if len(mt)>500 else mt.head(0)
    train = mt.drop(test.index) if len(test) else mt
    train.to_parquet(out/"data"/"mt"/"train.parquet", index=False)
    test.to_parquet(out/"data"/"mt"/"test.parquet", index=False)
    mono_n = 0
    if info.get("mono"):
        try:
            ds = load_dataset(info["mono"], split="train", streaming=True)
            rows = []
            for i,r in enumerate(ds):
                if i>=20000: break
                rows.append(str(list(r.values())[0])[:1000])
            pd.DataFrame({"text": rows}).to_parquet(out/"data"/"monolingual_train.parquet", index=False)
            mono_n = len(rows)
        except Exception as e:
            print(f"[{lang}] skip mono: {e}")
    man = pd.DataFrame([{"task":"ASR","source":s} for s in info["asr"]] + [{"task":"TTS","source":s} for s in info["tts"]])
    man.to_csv(out/"data"/"manifests"/"sources.csv", index=False)
    pd.DataFrame([{"source":s} for s in info["nonhf"]]).to_csv(out/"data"/"manifests"/"nonhf_sources.csv", index=False)
    (out/"README.md").write_text(card_for(lang, {"mt":[h for h,_ in info["mt"]],"asr":info["asr"],"tts":info["tts"],"nonhf":info["nonhf"],"iso":info["iso"],"name":info["name"]}, repo_id, len(mt), mono_n), encoding="utf-8")
    print(f"[{lang}] built: mt={len(mt)} (train {len(train)}/test {len(test)}) mono_sample={mono_n} -> ./{out}")
    if args.push:
        from huggingface_hub import HfApi
        token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
        api = HfApi(token=token) if token else HfApi()  # falls back to hf cache login
        api.create_repo(repo_id, repo_type="dataset", exist_ok=True, private=args.private)
        api.upload_folder(repo_id=repo_id, repo_type="dataset", folder_path=str(out))
        print(f"[{lang}] pushed https://huggingface.co/datasets/{repo_id}")
    return {"lang":lang, "repo":repo_id, "mt":len(mt), "train":len(train), "test":len(test)}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--langs", nargs="*", default=["guz"])
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--repo-prefix", default="BlakHasan")
    ap.add_argument("--push", action="store_true"); ap.add_argument("--no-push", action="store_true")
    ap.add_argument("--mt-max-rows", type=int, default=5000)
    ap.add_argument("--min-sim", type=float, default=1.0)
    ap.add_argument("--private", action="store_true")
    args = ap.parse_args()
    langs = list(REGISTRY.keys()) if args.all else args.langs
    if args.push: args.no_push = False
    results = []
    for l in langs:
        if l not in REGISTRY: print(f"unknown lang {l}, choices: {list(REGISTRY)}"); continue
        results.append(build_lang(l, args))
    print("\n== SUMMARY ==")
    for r in results:
        print(r['lang'], 'mt=', r['mt'], 'train=', r['train'], 'test=', r['test'], '->', r['repo'])

if __name__ == "__main__":
    main()
