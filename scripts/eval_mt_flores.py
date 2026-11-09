#!/usr/bin/env python
"""
chrF eval for Kikuyu MT on FLORES-200 devtest (eval-only, never train).

Both directions:
  en-kik: source=openlanguagedata/flores_plus eng_Latn, ref=kik_Latn
  kik-en: reversed.

Backends:
  --backend hf-inference : calls your deployed model URL (default: Sunflower endpoint)
  --backend local        : loads a local/HF checkpoint with transformers (needs GPU)

Usage:
  pip install datasets sacrebleu requests
  set HF_TOKEN=hf_xxx   # for gated FLORES + inference
  python scripts/eval_mt_flores.py --direction en-kik --limit 200
  python scripts/eval_mt_flores.py --direction kik-en --limit 200 --model-url https://router.huggingface.co/BlakHasan/sunflower-mt-kik-en
"""
from __future__ import annotations
import argparse, os

def load_flores(limit: int):
    from datasets import load_dataset
    # try HF mirrors first (both gated — accept terms on the dataset page)
    try:
        ds = load_dataset("openlanguagedata/flores_plus", "kik_Latn", split="devtest")
        en = load_dataset("openlanguagedata/flores_plus", "eng_Latn", split="devtest")
        ek = [(e["text"], k["text"]) for e, k in zip(en, ds)]
        return ek[:limit] if limit else ek
    except Exception as e1:
        print(f"flores_plus unavailable ({str(e1)[:100]}), trying facebook/flores ...")
    try:
        fb = load_dataset("facebook/flores", "kik_Latn", split="devtest")
        ek = [(r["sentence_eng_Latn"], r["sentence_kik_Latn"]) for r in fb]
        return ek[:limit] if limit else ek
    except Exception as e2:
        print(f"facebook/flores unavailable ({str(e2)[:100]}), falling back to direct tarball ...")
    # ungated fallback: original FLORES-200 tarball (no HF login needed)
    import tarfile, tempfile, urllib.request
    from pathlib import Path
    url = "https://tinyurl.com/flores200dataset"
    tmp = Path(tempfile.mkdtemp(prefix="flores200_"))
    tgz = tmp / "flores200.tar.gz"
    urllib.request.urlretrieve(url, tgz)
    with tarfile.open(tgz) as tf:
        tf.extractall(tmp)
    base = next(tmp.glob("**/flores200_dataset/devtest"))
    en_lines = (base / "eng_Latn.devtest").read_text(encoding="utf-8").splitlines()
    ki_lines = (base / "kik_Latn.devtest").read_text(encoding="utf-8").splitlines()
    ek = list(zip(en_lines, ki_lines))
    return ek[:limit] if limit else ek

def translate_inference(texts, src_name, tgt_name, model_url, token, temp=0.0):
    import requests
    out = []
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    model_id = model_url.rstrip("/").split("/")[-1]
    for t in texts:
        body = {"model": model_id,
                "messages": [
                    {"role": "system", "content": "You are Sunflower, a helpful assistant made by Sunbird AI who knows many African languages."},
                    {"role": "user", "content": f"Translate from {src_name} to {tgt_name}: {t}"}],
                "max_tokens": 256, "temperature": temp, "do_sample": False}
        r = requests.post(model_url, headers=headers, json=body, timeout=120)
        r.raise_for_status()
        out.append(r.json()["choices"][0]["message"]["content"].strip())
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--direction", default="en-kik", choices=["en-kik", "kik-en"])
    ap.add_argument("--limit", type=int, default=200)
    ap.add_argument("--model-url", default="https://router.huggingface.co/BlakHasan/Sunflower-Gemma4-E2B")
    args = ap.parse_args()
    import sacrebleu
    pairs = load_flores(args.limit)
    print(f"FLORES kik devtest pairs: {len(pairs)}")
    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
    if not token:
        print("Set HF_TOKEN for gated FLORES + inference."); raise SystemExit(2)
    if args.direction == "en-kik":
        srcs = [e for e, _ in pairs]; refs = [[k for _, k in pairs]]
        preds = translate_inference(srcs, "English", "Kikuyu", args.model_url, token)
    else:
        srcs = [k for _, k in pairs]; refs = [[e for e, _ in pairs]]
        preds = translate_inference(srcs, "Kikuyu", "English", args.model_url, token)
    print("chrF:", round(sacrebleu.corpus_chrf(preds, refs).score, 2))
    print("BLEU:", round(sacrebleu.corpus_bleu(preds, refs).score, 2))
    for s, p, r in list(zip(srcs, preds, refs[0]))[:3]:
        print("SRC:", s[:120]); print("PRED:", p[:120]); print("REF:", r[:120]); print("---")

if __name__ == "__main__":
    main()
