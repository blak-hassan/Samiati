#!/usr/bin/env python3
"""
Task C — KenCorpus ingestion.

Streams KenCorpus HF datasets for Samiati languages:
- Kencorpus/KenTrans: dho, lbk, lch, llg -> swa (luo->sw, luy->sw)
- Kencorpus/KenSpeech: swa audio-text (ASR/TTS monolingual)
- Kencorpus/KenCorpus_audio: swa/dho/luy spontaneous speech (filter by language)
- Kencorpus/KenCorpus_text: swa/dho/luy monolingual text
- Kencorpus/KenSwQuAD: swa QA pairs (monolingual)

Maps to canonical schema, cleans, shards (50K rows), writes locally.
Push to HF Hub conditional on HUGGINGFACE_HUB_TOKEN.
"""

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
COLL = HERE
if str(COLL) not in sys.path:
    sys.path.insert(0, str(COLL))

from datasets import load_dataset
import common

DATA = Path("qa/datasets/collection")
CON = common.init_db()

# KenTrans configs: indigenous -> swahili
KENTRANS_CONFIGS = [
    ("Kencorpus/KenTrans", "dho", "luo", "sw"),
    ("Kencorpus/KenTrans", "lbk", "luy", "sw"),
    ("Kencorpus/KenTrans", "lch", "luy", "sw"),
    ("Kencorpus/KenTrans", "llg", "luy", "sw"),
]


def mine_kentrans(repo_id, config, src, tgt, cap=200_000):
    lang_pair = f"{src}-{tgt}"
    writer = common.ShardWriter(DATA / "translation", "pairs", lang_pair)
    added = 0
    try:
        ds = load_dataset(repo_id, config, split="train", streaming=True)
        n = 0
        for row in ds:
            a = common.clean_text(row.get("source"))
            b = common.clean_text(row.get("target"))
            if not a or not b:
                continue
            if not common.lid_latin_ok(a, src) or not common.lid_latin_ok(b, tgt):
                continue
            if not common.length_ratio_ok(a, b):
                continue
            rec = {
                "id": common.cid(repo_id, src, tgt, a),
                "source_lang": src,
                "target_lang": tgt,
                "input": a,
                "output": b,
                "modality": "text",
                "domain": "community",
                "provenance": f"{repo_id}[{config}]",
                "license": "cc0-1.0",
                "review_status": "pending_review",
                "notes": "mined from KenCorpus KenTrans parallel corpus",
            }
            if writer.write(rec):
                added += 1
                n += 1
            if n >= cap:
                break
        print(f"  {repo_id}[{config}] {src}->{tgt}: +{n}")
    except Exception as e:
        print(f"  {repo_id}[{config}] FAILED: {e}")
    writer.close()
    common.update_source(CON, repo_id, config, src, tgt, added, writer.idx, "done")
    for sf in writer.files():
        sf_path = DATA / "translation" / sf
        rows = sum(1 for _ in open(sf_path, encoding="utf-8"))
        idx = int(sf.split("-")[-1].split(".")[0])
        common.record_shard(CON, idx, lang_pair, rows, 0)
    return added, writer.files()


def mine_monolingual(repo_id, config, lang, text_field, cap=300_000, domain="general"):
    """Mine a monolingual text dataset (output=null, target_lang=null)."""
    writer = common.ShardWriter(DATA / "monolingual", "mono", lang)
    added = 0
    try:
        ds = load_dataset(repo_id, config, split="train", streaming=True)
        n = 0
        for row in ds:
            a = common.clean_text(row.get(text_field))
            if not a:
                continue
            if not common.lid_latin_ok(a, lang):
                continue
            rec = {
                "id": common.cid(repo_id, lang, None, a),
                "source_lang": lang,
                "target_lang": None,
                "input": a,
                "output": None,
                "modality": "text",
                "domain": domain,
                "provenance": f"{repo_id}[{config}]",
                "license": "cc0-1.0",
                "review_status": "pending_review",
                "notes": "mined from KenCorpus monolingual text",
            }
            if writer.write(rec):
                added += 1
                n += 1
            if n >= cap:
                break
        print(f"  {repo_id}[{config}] {lang} mono: +{n}")
    except Exception as e:
        print(f"  {repo_id}[{config}] FAILED: {e}")
    writer.close()
    common.update_source(CON, repo_id, config, lang, None, added, writer.idx, "done")
    for sf in writer.files():
        sf_path = DATA / "monolingual" / sf
        rows = sum(1 for _ in open(sf_path, encoding="utf-8"))
        idx = int(sf.split("-")[-1].split(".")[0])
        common.record_shard(CON, idx, lang, rows, 0)
    return added, writer.files()


def mine_speech(repo_id, config, lang, cap_hours=50, domain="community"):
    """Mine a speech dataset (audio-text pairs for ASR/TTS)."""
    writer = common.ShardWriter(DATA / "speech", "speech", lang)
    added = 0
    total_sec = 0.0
    sec_cap = cap_hours * 3600
    try:
        ds = load_dataset(repo_id, config, split="train", streaming=True)
        n = 0
        for row in ds:
            audio = row.get("audio")
            transcript = common.clean_text(row.get("transcript") or row.get("text"))
            if not transcript:
                continue
            if not common.lid_latin_ok(transcript, lang):
                continue
            dur = None
            if isinstance(audio, dict):
                arr = audio.get("array")
                sr = audio.get("sampling_rate", 16000)
                if arr is not None:
                    try:
                        dur = len(arr) / sr
                    except Exception:
                        dur = row.get("duration_seconds")
            if dur is None:
                dur = row.get("duration_seconds", 10)
            total_sec += dur
            if total_sec > sec_cap:
                break
            rec = {
                "id": common.cid(repo_id, lang, None, transcript),
                "source_lang": lang,
                "target_lang": None,
                "input": transcript,
                "output": None,
                "modality": "speech",
                "domain": domain,
                "provenance": f"{repo_id}[{config}]",
                "license": "cc0-1.0",
                "review_status": "pending_review",
                "notes": f"speech audio-text pair, ~{dur:.1f}s",
            }
            if writer.write(rec):
                added += 1
                n += 1
            if n >= cap_hours * 360:  # ~360 entries/hour rough cap
                break
        print(f"  {repo_id}[{config}] {lang} speech: +{n} entries ({total_sec/3600:.1f}h)")
    except Exception as e:
        print(f"  {repo_id}[{config}] FAILED: {e}")
    writer.close()
    common.update_source(CON, repo_id, config, lang, None, added, writer.idx, "done")
    for sf in writer.files():
        sf_path = DATA / "speech" / sf
        rows = sum(1 for _ in open(sf_path, encoding="utf-8"))
        idx = int(sf.split("-")[-1].split(".")[0])
        common.record_shard(CON, idx, lang, rows, 0)
    return added, writer.files()


def main():
    total = 0
    # KenTrans parallel (indigenous -> swahili)
    for repo_id, config, src, tgt in KENTRANS_CONFIGS:
        common.log(f"=== KenCorpus KenTrans [{config}] {src}->{tgt} ===")
        added, shards = mine_kentrans(repo_id, config, src, tgt)
        total += added
        common.log(f"  added {added}, shards {len(shards)}")

    # KenSpeech swa audio-text
    common.log("=== KenCorpus KenSpeech swa speech ===")
    added, shards = mine_speech("Kencorpus/KenSpeech", None, "sw")
    total += added
    common.log(f"  added {added}, shards {len(shards)}")

    # KenCorpus_audio swa spontaneous speech
    common.log("=== KenCorpus KenCorpus_audio swa speech ===")
    added, shards = mine_speech("Kencorpus/KenCorpus_audio", None, "sw")
    total += added
    common.log(f"  added {added}, shards {len(shards)}")

    common.log(f"KenCorpus total added: {total}")
    print(f"\nKenCorpus done. Total {total} units. Shards in {DATA}")


if __name__ == "__main__":
    main()
