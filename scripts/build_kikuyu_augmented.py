#!/usr/bin/env python
"""
Build + upload BlakHasan/kikuyu-augmented-collection.

What it does (matches your choice: new combined repo, manifests-only for audio):
  MT (text, actually merged + uploaded):
    - michsethowusu/english-kikuyu_sentence-pairs (2.2M, NLLB-mined, noisy -> filtered)
    - KnoxDevelopers/english_kikuyu_sentence_pair_dataset (~30k Bible, cc-by-nc-4.0)
    - CGIAR/KikuyuEnglish_translation (agri, apache-2.0)
    - KevinKibe/kikuyu-sentence-pairs (420 coffee-domain)
    - Biatus/afrinllb-kikuyu-kalenjin-dataset (sw/en->kik subset)
    - gateremark/english-kikuyu-translations (~30k, gated -> tried, skipped if no access)
    - karanjaxyz/kikuyu_monolingual_sentences (119k, for back-translation)
  ASR/TTS (audio ~200GB -> NOT re-uploaded, manifests + recipes only):
    - Anv-ke/kikuyu (754h canonical, CC-BY-4.0, gated)
    - Professor/kikuyu-speech-data (185.8h clean 16kHz repack)
    - google/WaxalNLP:kik_tts (2k studio single-speaker)
    - gateremark/kikuyu-tts-training (48.5k curated for TTS)
    - facebook/mms-tts-kik (baseline model, CC-BY-NC-4.0)
    - masakhane-io/bibleTTS Kikuyu (90h studio, needs alignment)

Output layout (uploaded to HF):
  data/mt/train.parquet, data/mt/test.parquet
  data/monolingual/train.parquet
  data/manifests/asr_sources.csv, data/manifests/tts_sources.csv
  data/manifests/tts_filter_recipe.yaml
  README.md (dataset card with licenses + attribution)

Usage:
  pip install datasets huggingface_hub pandas pyarrow pyyaml
  # HF_TOKEN needs write access; gated sets (Anv-ke, gateremark) need you to
  # accept conditions on their HF pages first.
  set HF_TOKEN=hf_xxx
  python scripts/build_kikuyu_augmented.py --repo-id BlakHasan/kikuyu-augmented-collection --push

  # Dry run (no upload, just builds ./output_kikuyu):
  python scripts/build_kikuyu_augmented.py --no-push --mt-max-rows 50000
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import pandas as pd

try:
    from datasets import load_dataset, get_dataset_config_names
except ImportError:
    print("Missing 'datasets'. Run: pip install datasets huggingface_hub pandas pyarrow pyyaml")
    sys.exit(1)


OUT = Path("output_kikuyu")
MT_SOURCES = [
    # (hf_id, note) — loader handles column-name differences
    ("michsethowusu/english-kikuyu_sentence-pairs", "nllb-mined 2.2M, noisy"),
    ("KnoxDevelopers/english_kikuyu_sentence_pair_dataset", "bible ~30k, cc-by-nc-4.0"),
    ("CGIAR/KikuyuEnglish_translation", "agri apache-2.0"),
    ("KevinKibe/kikuyu-sentence-pairs", "coffee 420"),
    ("Biatus/afrinllb-kikuyu-kalenjin-dataset", "multilingual, filter kik_Latn"),
    ("gateremark/english-kikuyu-translations", "community 30k, gated"),
]

AUDIO_MANIFEST = [
    {
        "task": "ASR",
        "dataset": "Anv-ke/kikuyu",
        "why": "Canonical base: 183h scripted + 571h unscripted, 1331 speakers, 5 dialects. Train ASR here.",
        "license": "CC-BY-4.0 (gated, accept terms)",
        "use": "datasets.load_dataset('Anv-ke/kikuyu', split='train', streaming=True) then filter scripted first",
        "hours": "~564h transcribed",
    },
    {
        "task": "ASR",
        "dataset": "Professor/kikuyu-speech-data",
        "why": "Cleanest ready-to-train ANV repack: 116k clips, 185.8h, 16kHz FLAC 1-30s, fixed mojibake.",
        "license": "CC-BY-4.0",
        "use": "Start fine-tuning Whisper/w2v-bert here before full ANV.",
        "hours": "185.8h",
    },
    {
        "task": "ASR-domain",
        "dataset": "NjeriKahoro/anv-kikuyu-banking-subset",
        "why": "1060-row banking filter of ANV for finance eval/adaptation.",
        "license": "CC-BY-4.0",
        "use": "Eval-only or few-shot domain adapter.",
        "hours": "~1-2h",
    },
    {
        "task": "ASR-domain",
        "dataset": "CGIAR/KikuyuASR_trainingdataset",
        "why": "Agriculture scripted read (Digital Green/Karya). Packaging broken — inspect CSV/audio links.",
        "license": "Apache-2.0",
        "use": "Agri adaptation after fixing audio paths.",
        "hours": "unknown (5MB metadata)",
    },
    {
        "task": "TTS",
        "dataset": "google/WaxalNLP:kik_tts",
        "why": "Best studio single-speaker seed (~2k utt). Primary voice for Orpheus/VITS fine-tune.",
        "license": "CC-BY-SA-4.0 (share-alike)",
        "use": "datasets.load_dataset('google/WaxalNLP', 'kik_tts')",
        "hours": "~8-12h est.",
    },
    {
        "task": "TTS",
        "dataset": "gateremark/kikuyu-tts-training",
        "why": "48,538 utt 16kHz curated for gateremark/kikuyu-tts-v1 (ANV+WAXAL). Cluster speakers, keep top 1-2.",
        "license": "inherits ANV CC-BY-4.0 + WaxAL SA — verify",
        "use": "Filter: DNSMOS>=3.8, 3-15s, single speaker_id.",
        "hours": "~75-80h est.",
    },
    {
        "task": "TTS",
        "dataset": "masakhane-io/bibleTTS (Kikuyu)",
        "why": "90.6h unaligned studio 48kHz single-speaker. Best raw volume for 24-48kHz Orpheus.",
        "license": "CC-BY-SA",
        "use": "Align with MMS-CTC (bookbot-hive/OpenBible-TTS scripts) then filter.",
        "hours": "90.6h raw",
    },
    {
        "task": "TTS-baseline",
        "dataset": "facebook/mms-tts-kik",
        "why": "VITS 36M baseline to init fine-tune. Non-commercial.",
        "license": "CC-BY-NC-4.0",
        "use": "Model, not data: use as --base for VITS/Orpheus adaptation.",
        "hours": "model",
    },
]


def normalize_pair_df(df: pd.DataFrame, origin: str) -> pd.DataFrame:
    """Map any en<->ki bitext columns to a common schema."""
    cols = {c.lower().strip(): c for c in df.columns}
    # Biatus style: translation dict {eng_Latn, swh_Latn, kik_Latn, ...}
    if "translation" in cols:
        def pick(t):
            if not isinstance(t, dict):
                return None, None, None, None
            kik = t.get("kik_Latn") or t.get("kik") or t.get("ki")
            for sl, tl in [("eng_Latn", "kik_Latn"), ("swh_Latn", "kik_Latn"),
                           ("eng_Latn", "kik"), ("swh_Latn", "kik")]:
                if t.get(sl) and (t.get(tl)):
                    return t[sl], t[tl], sl.split("_")[0], "kik"
            return None, kik, None, "kik"
        picks = df[cols["translation"]].map(pick)
        out = pd.DataFrame(picks.tolist(), columns=["src", "tgt", "src_lang", "tgt_lang"])
        out["origin_dataset"] = origin
        return out
    # Common variants: English/Kikuyu, en/ki, text pairs, premise/hypothesis
    en_c = next((cols[k] for k in cols if k in ("english", "en", "eng", "source", "src", "premise")), None)
    ki_c = next((cols[k] for k in cols if k in ("kikuyu", "kik", "ki", "gikuyu", "target", "tgt", "hypothesis")), None)
    # Knox CSV sometimes uses whole verses as headers + pyarrow string dtype,
    # so fall back to first two columns regardless of dtype.
    if en_c is None or ki_c is None:
        if len(df.columns) >= 2:
            en_c, ki_c = list(df.columns)[:2]
        else:
            return pd.DataFrame(columns=["src", "tgt", "src_lang", "tgt_lang", "origin_dataset"])
    out = pd.DataFrame({
        "src": df[en_c].astype(str),
        "tgt": df[ki_c].astype(str),
        "src_lang": "en",
        "tgt_lang": "kik",
        "origin_dataset": origin,
    })
    if "similarity" in cols:
        out["similarity"] = pd.to_numeric(df[cols["similarity"]], errors="coerce")
    return out


def clean_mt(df: pd.DataFrame, min_sim: float = 1.0) -> pd.DataFrame:
    if df.empty:
        return df
    df = df.dropna(subset=["src", "tgt"])
    df["src"] = df["src"].str.strip()
    df["tgt"] = df["tgt"].str.strip()
    df = df[(df["src"].str.len() >= 3) & (df["tgt"].str.len() >= 3)]
    df = df[(df["src"].str.len() < 2000) & (df["tgt"].str.len() < 2000)]
    if "similarity" in df.columns and min_sim > 0:
        df = df[df["similarity"].fillna(99) >= min_sim]
    # drop obvious wrong-language noise seen in NLLB-mined preview
    df = df[~df["tgt"].str.contains("maaf ya ndo kalo|Saradhi|Vet du vem", na=False)]
    df = df.drop_duplicates(subset=["src", "tgt"])
    return df.reset_index(drop=True)


def load_mt_source(hf_id: str, max_rows: int | None) -> pd.DataFrame:
    try:
        ds = load_dataset(hf_id, split="train", streaming=False)
        if max_rows:
            ds = ds.select(range(min(max_rows, len(ds))))
        return normalize_pair_df(ds.to_pandas(), hf_id)
    except Exception as e:
        # try streaming / first config (e.g. WaxAL-style, Biatus json)
        try:
            ds = load_dataset(hf_id, split="train", streaming=True)
            rows = []
            for i, r in enumerate(ds):
                if max_rows and i >= max_rows:
                    break
                rows.append(r)
            return normalize_pair_df(pd.DataFrame(rows), hf_id)
        except Exception as e2:
            print(f"[skip] {hf_id}: {str(e)[:150]} / {str(e2)[:120]}")
            return pd.DataFrame(columns=["src", "tgt", "src_lang", "tgt_lang", "origin_dataset"])


def build_mt(mt_max_rows: int | None, min_sim: float) -> pd.DataFrame:
    frames = []
    per_source_cap = mt_max_rows  # cap applied per noisy source; small clean sets load fully
    for hf_id, note in MT_SOURCES:
        cap = None if hf_id != "michsethowusu/english-kikuyu_sentence-pairs" else per_source_cap
        print(f"Loading MT: {hf_id} ({note}) cap={cap}")
        frames.append(load_mt_source(hf_id, cap))
    mt = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    mt = clean_mt(mt, min_sim)
    return mt


def build_monomt(max_rows: int | None = 120000) -> pd.DataFrame:
    try:
        ds = load_dataset("karanjaxyz/kikuyu_monolingual_sentences", split="train")
        df = ds.to_pandas()
        col = "text" if "text" in df.columns else df.columns[0]
        s = df[col].astype(str).str.strip().drop_duplicates()
        s = s[(s.str.len() >= 10) & (s.str.len() < 2000)]
        if max_rows:
            s = s.head(max_rows)
        return pd.DataFrame({"text": s.values, "lang": "kik"})
    except Exception as e:
        print(f"[skip] monolingual: {e}")
        return pd.DataFrame(columns=["text", "lang"])


CARD = """---
language: [ki]
language: [ki, kik]
tags: [translation, automatic-speech-recognition, text-to-speech, kikuyu, gikuyu, kenya, low-resource]
task_categories: [translation, automatic-speech-recognition, text-to-speech]
size_categories: [1M<n<10M]
license: [cc-by-4.0, cc-by-sa-4.0, cc-by-nc-4.0, apache-2.0]
---

# Kikuyu Augmented Collection (MT + ASR/TTS manifests)

Combined, cleaned Kikuyu resource built to **augment small text-only collections**
(e.g. Sheng/Eng2sheng-style 1K-10K sets and Luo text corpora) with large-scale
Kikuyu MT bitext + pointers/recipes for Kikuyu speech.

## What is actually in this repo (and why)

| Split | Contents | How it enhances existing data |
|---|---|---|
| `data/mt/train.parquet` + `test.parquet` | Filtered en/sw->kik bitext merged from NLLB-mined 2.2M + Bible 30k + agri + coffee + AfrinLLB, normalized to `src,tgt,src_lang,tgt_lang,origin_dataset[,similarity]` | Gives scale for MT pre-training/fine-tune; `origin_dataset` lets you ablate noisy vs clean; test split is held-out for quick BLEU/chrF |
| `data/monolingual/train.parquet` | 119k Kikuyu-only sentences | LM pre-training, tokenizer training, back-translation |
| `data/manifests/asr_sources.csv` | 4 ASR sources with license/hours/use | Audio (~200GB) is NOT duplicated — stream from source instead (saves storage/cost) |
| `data/manifests/tts_sources.csv` | 4 TTS sources + baseline model | Studio single-speaker recipe for Orpheus-3B/VITS fine-tune |
| `data/manifests/tts_filter_recipe.yaml` | DNSMOS/speaker/duration filters | Turns noisy multi-speaker ANV into TTS-usable single-speaker data |

## MT sources & licenses (must retain attribution)
- michsethowusu/english-kikuyu_sentence-pairs — NLLB/OPUS-derived, no explicit license, filtered by similarity + dedupe
- KnoxDevelopers/english_kikuyu_sentence_pair_dataset — CC-BY-NC-4.0 (non-commercial)
- CGIAR/KikuyuEnglish_translation — Apache-2.0
- KevinKibe/kikuyu-sentence-pairs — unspecified (tiny, eval/adapt only)
- Biatus/afrinllb-kikuyu-kalenjin-dataset — unspecified, filter kik_Latn
- gateremark/english-kikuyu-translations — gated, included only if accessible
- karanjaxyz/kikuyu_monolingual_sentences — unknown, monolingual only

FLORES-200 kik_Latn (997+1012) is **eval-only, do NOT train on it**.

## ASR recipe (Whisper fine-tune)
1. Start: `Professor/kikuyu-speech-data` (185h, 16kHz, clean).
2. Scale: `Anv-ke/kikuyu` full scripted, then transcribed unscripted.
3. Domain: banking subset for finance eval, CGIAR agri after fixing audio links.

## TTS recipe (Orpheus-3B / VITS, cf. BlakHasan/orpheus-3b-tts-multilingual)
1. Primary voice: `google/WaxalNLP:kik_tts` single speaker + aligned BibleTTS Kikuyu (90h studio).
2. Augment: `gateremark/kikuyu-tts-training` filtered to top speaker(s), DNSMOS>=3.8, 3-15s.
3. Pre-train (optional): ANV scripted multi-speaker, then adapt to single speaker.
4. Avoid unscripted spontaneous (45-65s, disfluencies) for acoustic model.

## Load
```python
from datasets import load_dataset
mt = load_dataset("{repo_id}", data_files="data/mt/train.parquet", split="train")
mono = load_dataset("{repo_id}", data_files="data/monolingual/train.parquet", split="train")
# audio: stream from source, do not re-download from here
from datasets import load_dataset as ld
anv = ld("Anv-ke/kikuyu", split="train", streaming=True)  # gated: accept terms + HF_TOKEN
wax = ld("google/WaxalNLP", "kik_tts", split="train")
```
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-id", default="BlakHasan/kikuyu-augmented-collection")
    ap.add_argument("--push", action="store_true", help="Upload to HF Hub (needs HF_TOKEN)")
    ap.add_argument("--no-push", action="store_true", help="Build only, no upload")
    ap.add_argument("--mt-max-rows", type=int, default=300000, help="Cap for noisy 2.2M source")
    ap.add_argument("--min-sim", type=float, default=1.0, help="Min NLLB similarity score")
    ap.add_argument("--private", action="store_true")
    args = ap.parse_args()

    do_push = args.push and not args.no_push
    OUT.mkdir(exist_ok=True)
    (OUT / "data" / "mt").mkdir(parents=True, exist_ok=True)
    (OUT / "data" / "monolingual").mkdir(parents=True, exist_ok=True)
    (OUT / "data" / "manifests").mkdir(parents=True, exist_ok=True)

    print("== MT merge ==")
    mt = build_mt(args.mt_max_rows, args.min_sim)
    print(f"Merged MT rows after clean: {len(mt)}")
    if mt.empty:
        print("WARNING: MT empty (offline or all sources gated?). Manifests still written.")
        mt = pd.DataFrame(columns=["src", "tgt", "src_lang", "tgt_lang", "origin_dataset"])
    test = mt.sample(frac=0.02, random_state=42) if len(mt) > 500 else mt.head(0)
    train = mt.drop(test.index) if len(test) else mt
    train.to_parquet(OUT / "data" / "mt" / "train.parquet", index=False)
    test.to_parquet(OUT / "data" / "mt" / "test.parquet", index=False)
    print(f"train={len(train)} test={len(test)}")

    print("== Monolingual ==")
    mono = build_monomt()
    mono.to_parquet(OUT / "data" / "monolingual" / "train.parquet", index=False)
    print(f"monolingual rows: {len(mono)}")

    print("== Manifests ==")
    man = pd.DataFrame(AUDIO_MANIFEST)
    man[man.task.str.contains("ASR")].to_csv(OUT / "data" / "manifests" / "asr_sources.csv", index=False)
    man[man.task.str.contains("TTS")].to_csv(OUT / "data" / "manifests" / "tts_sources.csv", index=False)
    (OUT / "data" / "manifests" / "tts_filter_recipe.yaml").write_text(
        "target: single-speaker 16kHz (upsample to 24k for Orpheus)\n"
        "steps:\n"
        "  - cluster_by: speaker_id  # keep top 1-2 speakers by utterance count\n"
        "  - duration_s: [3, 15]\n"
        "  - dnsmos_min: 3.8\n"
        "  - sil_ratio_max: 0.2\n"
        "  - text_fix: latin-1->utf-8 mojibake (unscripted transcripts)\n"
        "  - normalize: numbers, degrees, abbreviations for kik diacritics (ĩ ũ)\n",
        encoding="utf-8",
    )
    (OUT / "README.md").write_text(CARD.format(repo_id=args.repo_id), encoding="utf-8")
    print(f"Built in ./{OUT}")

    if do_push:
        from huggingface_hub import HfApi
        token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
        api = HfApi(token=token) if token else HfApi()  # falls back to hf cache login
        api.create_repo(args.repo_id, repo_type="dataset", exist_ok=True, private=args.private)
        api.upload_folder(repo_id=args.repo_id, repo_type="dataset", folder_path=str(OUT))
        print(f"Pushed to https://huggingface.co/datasets/{args.repo_id}")
    else:
        print("Dry run — no upload. Re-run with --push to publish.")


if __name__ == "__main__":
    main()
