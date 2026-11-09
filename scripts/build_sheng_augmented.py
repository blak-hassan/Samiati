#!/usr/bin/env python
"""
Build + upload BlakHasan/sheng-augmented-collection.

Sheng is code-switched Nairobi slang (sw+en+local). Almost no clean bitext
exists, so this merges everything open + scrapes Shengilia (Sheng Bible)
+ leaves recipes for lyrics/social mono.

What it does (mirrors build_kikuyu_augmented.py):
  MT (text, actually merged + uploaded):
    - EgesaWO/Eng2sheng (~600 seed, check license)
    - EgesaWO/Sheng_sml (~1k)
    - BlakHasan/Eng2sheng_v4 (your prior merge, if exists)
    - BlakHasan/Sheng_sml_v4 (your prior merge, if exists)
    - BlakHasan/sheng-all (~88k merged Eng2sheng+LughaGen, if exists)
    - LughaGen-Organization/LughaGen-Multilingual-African-Corpus:sheng
      (~189k synthetic sheng, NVIDIA JHUB — biggest source)
    - local Shengilia scrape CSV (en,sheng pairs from shengilia.blogspot.com)
  MONO (sheng-only, for back-translation / LM):
    - local data/raw/sheng_mono_*.txt (Genius lyrics, tweets, YT comments you scrape)
    - LughaGen sheng 'text' column overflow (if MT loader finds mono-only rows)
  MANIFESTS ONLY (no audio re-upload):
    - ASR: no native Sheng ASR — transfer from Swahili + Whisper-transcribe
      recipe (SEPC paper method: yt-dlp + Whisper on YouTube/TikTok/FB/X)
    - Non-HF: Shengilia blog, Genius lyrics, Ghafla/Pulse comments, r/Kenya

Output layout (uploaded to HF):
  data/mt/train.parquet, data/mt/test.parquet
  data/monolingual/train.parquet
  data/manifests/asr_sources.csv, data/manifests/nonhf_sources.csv
  data/manifests/sheng_lexicon_seed.csv
  data/raw/shengilia_pairs.csv (scraped, kept for provenance)
  README.md

Usage:
  pip install datasets huggingface_hub pandas pyarrow requests beautifulsoup4 lxml
  set HF_TOKEN=hf_xxx   (powershell: $env:HF_TOKEN="hf_xxx"; never commit it)

  # 1. Scrape Shengilia only (no HF needed, ~106 posts 2009-2010):
  python scripts/build_sheng_augmented.py --no-push --scrape-shengilia --shengilia-max-posts 120

  # 2. Full merge (HF + local scrape):
  python scripts/build_sheng_augmented.py --no-push --mt-max-rows 200000

  # 3. Publish:
  python scripts/build_sheng_augmented.py --repo-id BlakHasan/sheng-augmented-collection --push

Shengilia page pattern (verified 2026-10-08):
  English in <b>...</b>, Sheng translation in <i>...</i> immediately after,
  inside div.post-body. Archive has ~106 posts (95 in 2009 + 11 in 2010).
  Example: https://shengilia.blogspot.com/2010/10/acts-91-15.html
"""
from __future__ import annotations

import argparse
import os
import re
import sys
import time
from pathlib import Path

import pandas as pd

try:
    from datasets import load_dataset
except ImportError:
    print("Missing 'datasets'. Run: pip install datasets huggingface_hub pandas pyarrow")
    sys.exit(1)


OUT = Path("output_sheng")
BLOG_ROOT = "https://shengilia.blogspot.com"

# (hf_id, note). "hf_id:config" means dataset config/subset (e.g. LughaGen sheng).
# Missing/gated ids are skipped with a warning, not fatal.
MT_SOURCES = [
    ("EgesaWO/Eng2sheng", "seed ~600 en-sheng, community"),
    ("EgesaWO/Sheng_sml", "seed ~1k sml"),
    ("BlakHasan/Eng2sheng_v4", "prior merge, skip if missing"),
    ("BlakHasan/Sheng_sml_v4", "prior merge, skip if missing"),
    ("BlakHasan/sheng-all", "~88k merged Eng2sheng+LughaGen, skip if missing"),
    ("LughaGen-Organization/LughaGen-Multilingual-African-Corpus:sheng",
     "big: ~189k synthetic sheng, cap with --mt-max-rows"),
]

# Minimal seed lexicon — extend from okech-christopher/sheng-sentiment-base
# data/dictionaries/sheng_dictionary.json (75+ entries) + Zenodo Sheng Mental
# Health Dataset lexicon. Kept tiny here so the recipe runs offline.
SHENG_LEXICON_SEED = [
    ("chapaa", "pesa/money"), ("doo", "pesa/money"),
    ("dem", "msichana/girl"), ("manzi", "msichana/girl"),
    ("boi", "mvulana/boy"), ("mse", "mtu/person"),
    ("fiti", "poa/good"), ("noma", "mbaya/bad OR intensifier/very"),
    ("poa", "good"), ("tao", "town"),
    ("mbogi", "crew/group"), ("wase", "people/guys"),
    ("mada", "kill"), ("doiya", "do harm"),
    ("grao", "ground"), ("mblind", "blind"),
    ("rauka", "get up"), ("shoiwa", "be told/shown"),
    ("niaje", "how are you/what's up"), ("sema", "say/tell"),
    ("jela", "jail"), ("wokovu", "salvation"),
    ("sir godi", "Lord God"), ("tao", "town/city"),
]

ASR_MANIFEST = [
    {"task": "ASR-transfer", "dataset": "Kencorpus/KenSpeech",
     "why": "Closest clean read speech (Swahili side) for Sheng transfer; Sheng has no native ASR set.",
     "license": "check source", "hours": "varies"},
    {"task": "ASR-transfer", "dataset": "Professor/swahili-speech-data",
     "why": "Clean 16kHz Swahili repack — fine-tune Whisper then adapt with Sheng mono.",
     "license": "CC-BY-4.0", "hours": "~100h+"},
    {"task": "ASR-recipe", "dataset": "SEPC-method: yt-dlp + Whisper on YouTube/TikTok/FB/X Sheng videos",
     "why": "SEPC Sheng-English Phishing Corpus (9,970 samples, 2025) built this way: transcribe Sheng video, keep text+label.",
     "license": "keep URL+date, respect platform ToS, do NOT bulk re-upload raw audio",
     "hours": "you collect"},
]

NONHF_SOURCES = [
    "Shengilia blog shengilia.blogspot.com (~106 posts 2009-2010, en **bold** + sheng *italic*) — scrape recipe in this script, keep source_url per row, check site terms before re-upload",
    "Genius.com Gengetone lyrics (Ethic, Sailors, Boondocks Gang, Mejja, Nonini, Jua Cali) via lyricsgenius API — monolingual Sheng, back-translate to en",
    "X/Twitter hashtags sheng,nairobian,mbogigenje,254,shengword via X API — respect ToS/rate limits, store as recipe unless ToS allows re-upload",
    "YouTube/TikTok Sheng comments + auto-subs via yt-dlp --write-subs + Whisper — SEPC method",
    "Ghafla/Pulse Kenya/Mpasho/NairobiWire article comments — Sheng in comments, Scrapy + robots.txt",
    "Reddit r/Kenya threads — PRAW, en-sw-sheng triplets",
    "okech-christopher/sheng-sentiment-base data/dictionaries/sheng_dictionary.json (75+ slang mappings, MIT) — lexicon seed",
    "Zenodo Sheng Mental Health Dataset — lexicon source cited by LughaGen",
    "Samiati Changa app contributions languageCode=sheng (convex/changa/seedSheng.ts) — highest quality, nightly export back to HF",
]


# ---------------------------------------------------------------- normalize
def normalize_pair_df(df: pd.DataFrame, origin: str) -> pd.DataFrame:
    """Map any en<->sheng bitext columns to src,tgt,src_lang,tgt_lang,origin_dataset."""
    if df is None or df.empty:
        return pd.DataFrame(columns=["src", "tgt", "src_lang", "tgt_lang", "origin_dataset"])
    cols = {str(c).lower().strip(): c for c in df.columns}

    # HuggingFace translation-dict style: {'en':..,'English':..,'Sheng':..} or eng_Latn/sheng_Latn
    if "translation" in cols:
        def pick(t):
            if not isinstance(t, dict):
                return None, None, None, None
            low = {str(k).lower(): k for k in t.keys()}
            # find sheng side: any key containing 'sheng'
            tgt_key = next((low[k] for k in low if "sheng" in k), None)
            src_key = next((low[k] for k in low if k in (
                "eng_latn", "eng", "en", "english", "swh_latn", "sw", "swahili")), None)
            if tgt_key and src_key and t.get(src_key) and t.get(tgt_key):
                return t[src_key], t[tgt_key], "en", "sheng"
            # LughaGen AfrinLLB style with kik/kln/etc + sheng fallback: first two strings
            vals = [v for v in t.values() if isinstance(v, str) and v.strip()]
            if len(vals) >= 2:
                return vals[0], vals[1], "src", "sheng"
            return None, None, None, None
        picks = df[cols["translation"]].map(pick)
        out = pd.DataFrame(picks.tolist(), columns=["src", "tgt", "src_lang", "tgt_lang"])
        out["origin_dataset"] = origin
        return out

    en_c = next((cols[k] for k in cols if k in (
        "english", "en", "eng", "source", "src", "premise", "source_text")), None)
    sh_c = next((cols[k] for k in cols if k in (
        "sheng", "sheng_text", "shengilia", "target", "tgt", "target_text",
        "hypothesis", "translation", "sheng_translation")), None)
    # EgesaWO files use capitalized "English"/"Sheng"
    if en_c is None or sh_c is None:
        if len(df.columns) >= 2:
            en_c, sh_c = list(df.columns)[:2]
        else:
            return pd.DataFrame(columns=["src", "tgt", "src_lang", "tgt_lang", "origin_dataset"])
    out = pd.DataFrame({
        "src": df[en_c].astype(str),
        "tgt": df[sh_c].astype(str),
        "src_lang": "en",
        "tgt_lang": "sheng",
        "origin_dataset": origin,
    })
    if "similarity" in cols:
        out["similarity"] = pd.to_numeric(df[cols["similarity"]], errors="coerce")
    if "source_url" in cols:
        out["source_url"] = df[cols["source_url"]].astype(str)
    return out


def clean_mt(df: pd.DataFrame, min_sim: float = 1.0) -> pd.DataFrame:
    if df.empty:
        return df
    df = df.dropna(subset=["src", "tgt"])
    df["src"] = df["src"].astype(str).str.strip()
    df["tgt"] = df["tgt"].astype(str).str.strip()
    df = df[(df["src"].str.len() >= 3) & (df["tgt"].str.len() >= 3)]
    df = df[(df["src"].str.len() < 2000) & (df["tgt"].str.len() < 2000)]
    # drop placeholder / empty-scrape artefacts
    df = df[~df["src"].str.lower().isin(["none", "nan", ""])]
    df = df[~df["tgt"].str.lower().isin(["none", "nan", ""])]
    if "similarity" in df.columns and min_sim > 0:
        df = df[df["similarity"].fillna(99) >= min_sim]
    subset = ["src", "tgt"]
    df = df.drop_duplicates(subset=subset)
    return df.reset_index(drop=True)


def load_mt_source(hf_id: str, max_rows: int | None) -> pd.DataFrame:
    """Load one HF source. Supports 'dataset_id:config' form. Streams when capped."""
    base, conf = (hf_id.split(":", 1) + [None])[:2] if ":" in hf_id else (hf_id, None)
    # Capped -> streaming first (LughaGen sheng is ~190k+)
    if max_rows:
        try:
            kw = {"split": "train", "streaming": True}
            ds = load_dataset(base, conf, **kw) if conf else load_dataset(base, **kw)
            rows = []
            for i, r in enumerate(ds):
                if i >= max_rows:
                    break
                rows.append(r)
            if not rows:
                return pd.DataFrame(columns=["src", "tgt", "src_lang", "tgt_lang", "origin_dataset"])
            return normalize_pair_df(pd.DataFrame(rows), hf_id)
        except Exception as e:
            print(f"[skip MT streaming] {hf_id}: {str(e)[:160]}")
            return pd.DataFrame(columns=["src", "tgt", "src_lang", "tgt_lang", "origin_dataset"])
    try:
        ds = load_dataset(base, conf, split="train") if conf else load_dataset(hf_id, split="train")
        return normalize_pair_df(ds.to_pandas(), hf_id)
    except Exception as e:
        print(f"[skip MT] {hf_id}: {str(e)[:160]}")
        return pd.DataFrame(columns=["src", "tgt", "src_lang", "tgt_lang", "origin_dataset"])


# ---------------------------------------------------------------- Shengilia scraper
def _extract_pairs_from_soup(soup, url: str) -> list[dict]:
    """English in <b>, Sheng in <i> inside div.post-body. Pair sequentially."""
    body = soup.select_one("div.post-body") or soup.select_one("div.post") or soup
    pairs: list[dict] = []
    # Walk b/i tags in document order. Consecutive <b> tags accumulate
    # (verses split across bold runs, e.g. "...to" + "Jerusalem.") until
    # the following <i> closes the pair.
    tags = body.find_all(["b", "i"]) if hasattr(body, "find_all") else []
    pending_parts: list[str] = []

    def flush_pending(url: str):
        if not pending_parts:
            return
        # joined English side; actual Sheng attached by caller
        return " ".join(pending_parts).strip()

    for t in tags:
        txt = re.sub(r"\s+", " ", t.get_text(" ", strip=True)).strip()
        # strip leading verse numbers stuck to text ("1Meanwhile" -> "Meanwhile")
        txt = re.sub(r"^[0-9]{1,3}\s*(?=[A-Za-z])", "", txt)
        txt = re.sub(r"^(\d{1,3}:\d{1,3}\s*)+", "", txt).strip()
        if not txt or len(txt) < 2:
            continue
        if t.name == "b":
            if len(txt) < 10 and not pending_parts:
                continue  # nav noise with no open pair
            pending_parts.append(txt)
        elif t.name == "i" and pending_parts:
            en = " ".join(pending_parts).strip()
            pending_parts = []
            if len(en) >= 10:
                pairs.append({"src": en, "tgt": txt, "source_url": url})
    return pairs


def _crawl_archive_urls(blog_root: str, max_posts: int, delay: float = 1.0) -> list[str]:
    """Collect post URLs via Blogger JSON feed first (1 request), archive crawl fallback."""
    import requests
    from bs4 import BeautifulSoup

    # 1) Fast path: Blogger feeds give all post URLs in 1-2 requests
    try:
        feed_urls: list[str] = []
        start = 1
        while len(feed_urls) < max_posts:
            fu = (f"{blog_root}/feeds/posts/default?alt=json&max-results=150"
                  f"&start-index={start}")
            r = requests.get(fu, timeout=30, headers={"User-Agent": "SamiatiResearch/1.0"})
            if r.status_code != 200:
                break
            data = r.json()
            entries = data.get("feed", {}).get("entry", [])
            if not entries:
                break
            for e in entries:
                for l in e.get("link", []):
                    if l.get("rel") == "alternate" and l.get("href", "").endswith(".html"):
                        feed_urls.append(l["href"])
                        break
            if len(entries) < 150:
                break
            start += 150
        feed_urls = list(dict.fromkeys(feed_urls))[:max_posts]
        if feed_urls:
            print(f"[shengilia] feed discovery: {len(feed_urls)} posts")
            return feed_urls
    except Exception as e:
        print(f"[shengilia] feed discovery failed, falling back to archive crawl: {str(e)[:120]}")

    urls: list[str] = []
    seen: set[str] = set()
    # 1) Try monthly archives discovered from homepage (robust to pagination)
    try:
        r = requests.get(blog_root, timeout=30, headers={"User-Agent": "SamiatiResearch/1.0"})
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "lxml")
        for a in soup.select('a[href*="blogspot"][href*="/20"]'):
            href = a.get("href", "")
            m = re.search(r"/(\d{4})/(\d{2})/?$", href.rstrip("/"))
            if m and href not in seen:
                seen.add(href)
                urls.append(href)
    except Exception as e:
        print(f"[shengilia] archive discovery failed: {e}")
    # Known-good fallback (verified 2009-2010 structure)
    if not urls:
        urls = [f"{blog_root}/{y}/{m:02d}/" for y in (2009, 2010) for m in range(1, 13)]

    post_urls: list[str] = []
    seen_posts: set[str] = set()
    import requests as rq
    from bs4 import BeautifulSoup as BS
    for arch in urls:
        if len(post_urls) >= max_posts:
            break
        try:
            r = rq.get(arch, timeout=30, headers={"User-Agent": "SamiatiResearch/1.0"})
            if r.status_code != 200:
                continue
            s = BS(r.text, "lxml")
            for a in s.select('h3 a[href], h2 a[href], a[href*=".html"]'):
                href = a.get("href", "")
                if "shengilia.blogspot.com" in href and href.endswith(".html") and href not in seen_posts:
                    seen_posts.add(href)
                    post_urls.append(href)
                    if len(post_urls) >= max_posts:
                        break
            time.sleep(delay)
        except Exception as e:
            print(f"[shengilia] archive skip {arch}: {str(e)[:120]}")
            continue
    return post_urls[:max_posts]


def scrape_shengilia(max_posts: int = 120, delay: float = 1.0,
                     out_csv: Path | None = None) -> pd.DataFrame:
    """Crawl Shengilia blog -> en/sheng pairs. Polite: 1 req/s default."""
    try:
        import requests
        from bs4 import BeautifulSoup
    except ImportError:
        print("pip install requests beautifulsoup4 lxml  (for --scrape-shengilia)")
        return pd.DataFrame(columns=["src", "tgt", "source_url"])

    post_urls = _crawl_archive_urls(BLOG_ROOT, max_posts, delay)
    print(f"[shengilia] found {len(post_urls)} posts, scraping (delay={delay}s) ...")
    all_pairs: list[dict] = []
    for i, url in enumerate(post_urls, 1):
        try:
            r = requests.get(url, timeout=30, headers={"User-Agent": "SamiatiResearch/1.0"})
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "lxml")
            pairs = _extract_pairs_from_soup(soup, url)
            all_pairs.extend(pairs)
            if i % 10 == 0:
                print(f"  {i}/{len(post_urls)} posts -> {len(all_pairs)} pairs")
            time.sleep(delay)
        except Exception as e:
            print(f"  [skip post] {url}: {str(e)[:120]}")
            continue
    df = pd.DataFrame(all_pairs, columns=["src", "tgt", "source_url"])
    if not df.empty:
        df["src"] = df["src"].astype(str).str.strip()
        df["tgt"] = df["tgt"].astype(str).str.strip()
        df = df[(df["src"].str.len() >= 3) & (df["tgt"].str.len() >= 3)]
        df = df.drop_duplicates(subset=["src", "tgt"]).reset_index(drop=True)
    print(f"[shengilia] done: {len(df)} pairs from {len(post_urls)} posts")
    if out_csv is not None and not df.empty:
        out_csv.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out_csv, index=False)
        print(f"[shengilia] saved -> {out_csv}")
    return df


# ---------------------------------------------------------------- builders
def build_mt(mt_max_rows: int | None, min_sim: float,
             shengilia_csv: Path | None) -> pd.DataFrame:
    frames = []
    for hf_id, note in MT_SOURCES:
        # Cap only the big synthetic source; small seeds load fully
        cap = mt_max_rows if ("LughaGen" in hf_id or "sheng-all" in hf_id) else None
        print(f"Loading MT: {hf_id} ({note}) cap={cap}")
        frames.append(load_mt_source(hf_id, cap))
    # Local Shengilia CSV (from --scrape-shengilia or hand-curated)
    if shengilia_csv is not None and shengilia_csv.exists():
        try:
            loc = pd.read_csv(shengilia_csv)
            frames.append(normalize_pair_df(loc, f"local:{shengilia_csv.name}"))
            print(f"Loaded local scrape: {shengilia_csv} ({len(loc)} rows)")
        except Exception as e:
            print(f"[skip local] {shengilia_csv}: {e}")
    mt = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()
    mt = clean_mt(mt, min_sim)
    return mt


def build_monolingual(max_rows: int = 50000) -> pd.DataFrame:
    """Collect sheng-only texts from local raw dir (lyrics/tweets you add)."""
    raws: list[str] = []
    for pat in ("data/raw/sheng_mono_*.txt", "data/raw/*sheng*.txt",
                "output_sheng/data/raw/*.txt"):
        for p in Path(".").glob(pat):
            try:
                for line in p.read_text(encoding="utf-8", errors="ignore").splitlines():
                    line = line.strip()
                    if len(line) >= 10:
                        raws.append(line[:1000])
            except Exception as e:
                print(f"[skip mono file] {p}: {e}")
    s = pd.Series(raws).drop_duplicates()
    s = s[(s.str.len() >= 10) & (s.str.len() < 2000)]
    if max_rows:
        s = s.head(max_rows)
    out = pd.DataFrame({"text": s.values, "lang": "sheng"})
    print(f"monolingual rows (local raw): {len(out)} — add Genius lyrics/tweets to data/raw/sheng_mono_*.txt to grow")
    return out


def card_for(repo_id: str, mt_n: int, mono_n: int, shengilia_n: int) -> str:
    src_lines = "\n".join([f"- {h} ({n})" for h, n in MT_SOURCES])
    asr_lines = "\n".join([f"- {m['dataset']} — {m['why']} [{m['license']}]" for m in ASR_MANIFEST])
    nonhf_lines = "\n".join([f"- {s}" for s in NONHF_SOURCES])
    return f"""---
language: [swh]
tags: [translation, sheng, code-switching, kenya, low-resource, swahili, english]
task_categories: [translation]
---

# Sheng Augmented Collection (MT + mono + recipes)

Nairobi Sheng en<->sheng bitext merged from open seeds + synthetic + Shengilia scrape.

MT rows merged here: {mt_n} | Monolingual rows: {mono_n} | Shengilia pairs in merge: {shengilia_n}

Schema: `src,tgt,src_lang,tgt_lang,origin_dataset[,similarity][,source_url]`
- `src` = English, `tgt` = Sheng. `origin_dataset` lets you ablate noisy vs clean.
- Shengilia rows carry `source_url` for attribution.

## MT merged from (text actually in repo)
{src_lines}
- local Shengilia scrape data/raw/shengilia_pairs.csv (en **bold** + sheng *italic*, ~106 posts)

Small EgesaWO seeds: check per-file license before commercial use.
LughaGen sheng (~189k) is rule-based synthetic: good for pre-training, fine-tune finally on human Shengilia + Changa contributions.

## Monolingual (`data/monolingual/train.parquet`, sheng-only)
Back-translation / LM pre-training / tokenizer training. Add your own:
`data/raw/sheng_mono_lyrics.txt`, `data/raw/sheng_mono_tweets.txt` then re-run.

## ASR — audio NOT re-uploaded, stream from source or transcribe yourself
{asr_lines}

## Non-HF open sources (recipes, redistribution notes)
{nonhf_lines}

Re-upload allowed: CC0/BY/BY-SA sets, your own Changa contributions, your own transcriptions.
Do NOT bulk re-upload: X/TikTok/YouTube raw (ToS), Genius lyrics (copyright — mono-derived pairs only with care), Common Voice MDC (no-reshare request), JW300.

## Load
```python
from datasets import load_dataset
mt = load_dataset("{repo_id}", data_files="data/mt/train.parquet", split="train")
mono = load_dataset("{repo_id}", data_files="data/monolingual/train.parquet", split="train")
```

## Grow it (Sheng playbook)
1. `python scripts/build_sheng_augmented.py --scrape-shengilia --no-push` (refresh Shengilia CSV)
2. Add Genius lyrics: `pip install lyricsgenius`, save to `data/raw/sheng_mono_lyrics.txt`
3. Lexicon-augment en-sw -> sheng with `data/manifests/sheng_lexicon_seed.csv` (extend from sheng-sentiment-base dict)
4. Back-translate mono with Gemma/NLLB, human-QC top 2k in Changa app, re-run `--push`
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-id", default="BlakHasan/sheng-augmented-collection")
    ap.add_argument("--push", action="store_true", help="Upload to HF Hub (needs HF_TOKEN)")
    ap.add_argument("--no-push", action="store_true", help="Build only, no upload")
    ap.add_argument("--mt-max-rows", type=int, default=200000,
                    help="Cap for big synthetic sources (LughaGen sheng / sheng-all)")
    ap.add_argument("--min-sim", type=float, default=1.0, help="Min NLLB similarity score")
    ap.add_argument("--scrape-shengilia", action="store_true", help="Crawl shengilia.blogspot.com first")
    ap.add_argument("--shengilia-max-posts", type=int, default=120)
    ap.add_argument("--shengilia-delay", type=float, default=1.0, help="Seconds between requests")
    ap.add_argument("--shengilia-csv", default="data/raw/shengilia_pairs.csv",
                    help="Local CSV cache for scraped pairs (src,tgt,source_url)")
    ap.add_argument("--mono-max-rows", type=int, default=250000)
    ap.add_argument("--private", action="store_true")
    args = ap.parse_args()

    do_push = args.push and not args.no_push
    (OUT / "data" / "mt").mkdir(parents=True, exist_ok=True)
    (OUT / "data" / "monolingual").mkdir(parents=True, exist_ok=True)
    (OUT / "data" / "manifests").mkdir(parents=True, exist_ok=True)
    (OUT / "data" / "raw").mkdir(parents=True, exist_ok=True)

    shengilia_csv = Path(args.shengilia_csv)
    shengilia_n = 0
    if args.scrape_shengilia:
        df_s = scrape_shengilia(args.shengilia_max_posts, args.shengilia_delay, shengilia_csv)
        # also stage a copy inside OUT for upload provenance
        if not df_s.empty:
            df_s.to_csv(OUT / "data" / "raw" / "shengilia_pairs.csv", index=False)
            shengilia_n = len(df_s)
    elif shengilia_csv.exists():
        # reuse cache without re-crawling
        try:
            shengilia_n = len(pd.read_csv(shengilia_csv))
        except Exception:
            pass

    print("== MT merge ==")
    mt = build_mt(args.mt_max_rows, args.min_sim, shengilia_csv if shengilia_csv.exists() else None)
    # recount shengilia contribution actually in merge
    if not mt.empty and "origin_dataset" in mt.columns:
        shengilia_n = int(mt["origin_dataset"].astype(str).str.contains("shengilia", case=False).sum())
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
    mono = build_monolingual(args.mono_max_rows)
    mono.to_parquet(OUT / "data" / "monolingual" / "train.parquet", index=False)

    print("== Manifests ==")
    pd.DataFrame(ASR_MANIFEST).to_csv(OUT / "data" / "manifests" / "asr_sources.csv", index=False)
    pd.DataFrame([{"source": s} for s in NONHF_SOURCES]).to_csv(
        OUT / "data" / "manifests" / "nonhf_sources.csv", index=False)
    # Merge hardcoded seed + upstream sheng-sentiment-base dict (168 entries) if present
    lex_rows = list(SHENG_LEXICON_SEED)
    seen_lex = {s.lower() for s, _ in lex_rows}
    for cand in (Path("data/raw/sheng_dictionary_upstream.json"), Path("data/raw/sheng_dictionary.json")):
        if cand.exists():
            try:
                import json as _json
                _d = _json.loads(cand.read_text(encoding="utf-8"))
                for k, v in (_d.get("slang_mappings") or {}).items():
                    if str(k).lower() not in seen_lex:
                        seen_lex.add(str(k).lower())
                        lex_rows.append((str(k), str(v)))
                print(f"[lexicon] extended from {cand}: {len(lex_rows)} total")
                break
            except Exception as e:
                print(f"[lexicon] skip {cand}: {e}")
    pd.DataFrame(lex_rows, columns=["sheng", "gloss"]).to_csv(
        OUT / "data" / "manifests" / "sheng_lexicon_seed.csv", index=False)
    (OUT / "README.md").write_text(card_for(args.repo_id, len(mt), len(mono), shengilia_n), encoding="utf-8")
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
