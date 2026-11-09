#!/usr/bin/env python
"""
Scrape Sheng-dense social/news text (monolingual) — no logins, no API keys.

Sources (credential-free):
  1. YouTube: ytsearch for Gengetone artists -> video comments + auto-subs
     (yt_dlp, no API key needed).
  2. News: Tuko.co.ke entertainment articles -> body paragraphs most likely
     to contain Sheng quotes (filtered by lexicon hit).
  3. Telegram: public channel web preview (t.me/s/CHANNEL) — opt-in via
     --tg-channels with REAL channel names you know. Name-guessing returns
     empty previews, so defaults are empty (skips gracefully).

Output: data/raw/sheng_mono_social.txt (one text per line) + CSV provenance
  data/raw/sheng_social_provenance.csv (text,source,source_url)

All rows carry source_url. Respect ToS: read-only, 1 req/s, public content
only. Do NOT bulk re-upload raw comments to public HF if platform ToS
forbids — our collection uploads the cleaned mono parquet with provenance
and drops pure-English/noise lines.

Usage:
  pip install yt-dlp requests beautifulsoup4 lxml pandas
  python scripts/scrape_sheng_social.py --no-youtube --max-articles 30
  python scripts/scrape_sheng_social.py --max-videos 3 --comments-per-video 200 --max-articles 30
  python scripts/scrape_sheng_social.py --tg-channels mychannel1,mychannel2 --tg-limit 100
"""
from __future__ import annotations

import argparse
import json
import re
import time
from pathlib import Path

import pandas as pd

OUT_TXT = Path("data/raw/sheng_mono_social.txt")
OUT_CSV = Path("data/raw/sheng_social_provenance.csv")

YT_QUERIES = [
    "Ethic Gengetone",
    "Ethic Lamba Lolo",
    "Sailors Gengetone",
    "Sailors Wamlambez",
    "Boondocks Gang",
    "Mejja Gengetone",
    "Nonini Sheng",
    "Jua Cali Sheng",
    "Mbogi Genje",
    "Gengetone mix 2024",
    "Sheng freestyle Nairobi",
    "Ghafla gossip Kenya",
]

NEWS_SITES = [
    ("https://www.tuko.co.ke/entertainment/", "/entertainment/"),
    ("https://www.ghafla.co.ke/", None),
    ("https://mpasho.co.ke/", None),
    ("https://www.kenyans.co.ke/entertainment", None),
    ("https://nairobiwire.com/", None),
]

# Sheng/Swahili markers: keep a news line only if it hits one of these
# (built from data/raw/sheng_dictionary_upstream.json top keys + common sw).
MARKERS = {
    "fiti", "noma", "poa", "chapaa", "doo", "dem", "manzi", "boi", "mse",
    "msee", "mbogi", "wase", "niaje", "sema", "tao", "kanairo", "genje",
    "dunda", "sapa", "noma", "buda", "mdosi", "karao", "hustle", "wametucheka",
    "sana", "sasa", "bado", "kabisa", "pole", "kwanza", "tena", "tu",
    "wakenya", "mazee", "mbona", "sasa", "form", "tuko", "kuja", "enda",
}


def clean_line(s: str) -> str:
    s = re.sub(r"\s+", " ", s or "").strip()
    return s


def has_marker(s: str) -> bool:
    low = " " + s.lower() + " "
    return any(f" {m} " in low or low.startswith(f" {m} ") for m in MARKERS)


# ---------------------------------------------------------------- YouTube
def scrape_youtube(max_videos: int, comments_per_video: int, subs: bool,
                   delay: float = 1.0, search_per_query: int = 10,
                   video_offset: int = 0) -> list[dict]:
    """ytsearch queries -> comments (+ auto-subs optionally). No API key."""
    try:
        import yt_dlp
    except ImportError:
        print("[youtube] pip install yt-dlp")
        return []
    rows: list[dict] = []
    ydl_search = {"quiet": True, "no_warnings": True, "extract_flat": True,
                  "skip_download": True}
    video_ids: list[str] = []
    import yt_dlp as y
    with y.YoutubeDL(ydl_search) as ydl:
        for q in YT_QUERIES:
            try:
                info = ydl.extract_info(f"ytsearch{search_per_query}:{q}", download=False)
                for e in (info.get("entries") or []):
                    vid = e.get("id")
                    if vid and vid not in video_ids:
                        video_ids.append(vid)
                time.sleep(delay)
            except Exception as e:
                print(f"[youtube] search skip '{q}': {str(e)[:120]}")
    print(f"[youtube] discovered: {len(video_ids)}, offset={video_offset}, taking {max_videos}")
    video_ids = video_ids[video_offset:video_offset + max_videos]
    ydl_get = {"quiet": True, "no_warnings": True, "skip_download": True,
               "getcomments": True, "extractor_args": {"youtube": {"max_comments": [str(comments_per_video)]}}}
    with y.YoutubeDL(ydl_get) as ydl:
        for vid in video_ids[:max_videos]:
            url = f"https://www.youtube.com/watch?v={vid}"
            try:
                info = ydl.extract_info(url, download=False)
                title = info.get("title", "")
                for c in (info.get("comments") or [])[:comments_per_video]:
                    txt = clean_line(c.get("text", ""))
                    if 10 <= len(txt) <= 500:
                        rows.append({"text": txt, "source": "youtube-comment",
                                     "source_url": url, "video_title": title})
                if subs:
                    for lang in ("en", "sw"):
                        try:
                            sub = ydl.extract_info(
                                url + f"&sub_lang={lang}", download=False)  # subtitles via auto
                        except Exception:
                            pass
                time.sleep(delay)
            except Exception as e:
                print(f"[youtube] skip {url}: {str(e)[:120]}")
    print(f"[youtube] comment rows: {len(rows)}")
    return rows


# ---------------------------------------------------------------- Telegram (opt-in, real names only)
def scrape_telegram(channels: list[str], limit: int, delay: float = 1.0) -> list[dict]:
    """Public t.me/s/ preview, no login. Unknown names yield 0 msgs (skipped)."""
    import requests
    from bs4 import BeautifulSoup
    rows: list[dict] = []
    for ch in channels:
        ch = ch.strip().lstrip("@")
        if not ch:
            continue
        try:
            r = requests.get(f"https://t.me/s/{ch}", timeout=30,
                             headers={"User-Agent": "SamiatiResearch/1.0"})
            s = BeautifulSoup(r.text, "lxml")
            msgs = s.select("div.tgme_widget_message_text")[:limit]
            print(f"[telegram] @{ch}: {len(msgs)} msgs")
            for m in msgs:
                txt = clean_line(m.get_text(" ", strip=True))
                if 10 <= len(txt) <= 1000:
                    rows.append({"text": txt, "source": "telegram",
                                 "source_url": f"https://t.me/s/{ch}", "video_title": ""})
            time.sleep(delay)
        except Exception as e:
            print(f"[telegram] skip @{ch}: {str(e)[:120]}")
    return rows


# ---------------------------------------------------------------- Telegram FULL (Telethon, needs api_id/hash + login)
def scrape_telegram_full(channels: list[str], limit_per_channel: int) -> list[dict]:
    """Full channel history via Telethon. Needs TG_API_ID + TG_API_HASH env.
    First run needs interactive login (see --tg-login); afterwards set
    TG_SESSION_STRING to run headless. Public + private channels you joined."""
    import asyncio
    import os
    try:
        from telethon import TelegramClient
        from telethon.sessions import StringSession
    except ImportError:
        print("[telegram-full] pip install telethon")
        return []
    api_id = os.environ.get("TG_API_ID", "").strip()
    api_hash = os.environ.get("TG_API_HASH", "").strip()
    if not api_id or not api_hash:
        print("[telegram-full] skipped: set $env:TG_API_ID + $env:TG_API_HASH "
              "(get them at https://my.telegram.org -> API development tools).")
        return []
    sess = os.environ.get("TG_SESSION_STRING", "").strip()

    async def _pull() -> list[dict]:
        client = TelegramClient(StringSession(sess) if sess else "tg_samiati",
                                int(api_id), api_hash)
        await client.start()  # first time: prompts phone + code + 2FA in YOUR terminal
        me = await client.get_me()
        print(f"[telegram-full] logged in as {getattr(me, 'username', '?')}")
        rows: list[dict] = []
        for ch in channels:
            ch = ch.strip().lstrip("@")
            if not ch:
                continue
            try:
                ent = await client.get_entity(ch)
                uname = getattr(ent, "username", ch) or ch
                n = 0
                async for m in client.iter_messages(ent, limit=limit_per_channel):
                    txt = clean_line(m.text or "")
                    if 10 <= len(txt) <= 1000:
                        rows.append({"text": txt, "source": "telegram-full",
                                     "source_url": f"https://t.me/{uname}/{m.id}",
                                     "video_title": ""})
                        n += 1
                print(f"[telegram-full] @{uname}: {n} msgs")
            except Exception as e:
                print(f"[telegram-full] skip @{ch}: {str(e)[:150]}")
        await client.disconnect()
        return rows

    try:
        return asyncio.run(_pull())
    except RuntimeError:  # already-running loop (rare): use new loop
        import asyncio as _a
        loop = _a.new_event_loop()
        try:
            return loop.run_until_complete(_pull())
        finally:
            loop.close()


def tg_login() -> None:
    """One-time interactive login. Run in YOUR OWN terminal (prompts phone/code).
    Prints a session string -> save as $env:TG_SESSION_STRING for headless runs."""
    import os
    try:
        from telethon import TelegramClient
        from telethon.sessions import StringSession
    except ImportError:
        print("pip install telethon"); return
    api_id = os.environ.get("TG_API_ID", "").strip()
    api_hash = os.environ.get("TG_API_HASH", "").strip()
    if not api_id or not api_hash:
        print("Set $env:TG_API_ID + $env:TG_API_HASH first (https://my.telegram.org).")
        return

    async def _go():
        async with TelegramClient(StringSession(), int(api_id), api_hash) as client:
            print("Logged in. Paste this into future shells (keep secret!):")
            print(f'$env:TG_SESSION_STRING="{client.session.save()}"')
    import asyncio
    asyncio.run(_go())
# ---------------------------------------------------------------- News
def scrape_news(max_articles: int, delay: float = 1.0) -> list[dict]:
    """Site indexes -> article bodies, keep marker-hit lines only."""
    import requests
    from bs4 import BeautifulSoup
    from urllib.parse import urlparse
    UA = {"User-Agent": "SamiatiResearch/1.0"}
    links: list[str] = []
    for sec, must in NEWS_SITES:
        if len(links) >= max_articles * 3:
            break
        try:
            host = urlparse(sec).netloc
            r = requests.get(sec, timeout=30, headers=UA)
            s = BeautifulSoup(r.text, "lxml")
            for a in s.select('a[href]'):
                href = (a.get("href") or "").strip()
                if not href or href.startswith("#"):
                    continue
                if href.startswith("/"):
                    href = f"https://{host}" + href
                if host not in href:
                    continue
                if must and must not in href:
                    continue
                low = href.lower()
                if any(x in low for x in ("/tag/", "/author/", "/category/",
                                          "/page/", ".png", ".jpg", "whatsapp")):
                    continue
                if len(href) > 60 and href not in links:
                    links.append(href)
                if len(links) >= max_articles * 3:
                    break
            time.sleep(delay)
        except Exception as e:
            print(f"[news] index skip {sec}: {str(e)[:120]}")
    links = links[:max_articles]
    print(f"[news] articles: {len(links)}")
    rows: list[dict] = []
    for url in links:
        try:
            r = requests.get(url, timeout=30, headers=UA)
            s = BeautifulSoup(r.text, "lxml")
            art = s.select_one("article") or s
            kept = 0
            for p in art.select("p, blockquote, h2"):
                txt = clean_line(p.get_text(" ", strip=True))
                if 20 <= len(txt) <= 600 and has_marker(txt):
                    rows.append({"text": txt, "source": "news-quote",
                                 "source_url": url, "video_title": ""})
                    kept += 1
            if kept:
                print(f"  {kept} lines <- {url[:80]}")
            time.sleep(delay)
        except Exception as e:
            print(f"[news] skip {url[:80]}: {str(e)[:120]}")
    print(f"[news] quote rows: {len(rows)}")
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-videos", type=int, default=6)
    ap.add_argument("--comments-per-video", type=int, default=200)
    ap.add_argument("--search-per-query", type=int, default=10)
    ap.add_argument("--video-offset", type=int, default=0)
    ap.add_argument("--no-youtube", action="store_true")
    ap.add_argument("--subs", action="store_true", help="also try auto-subs (slow)")
    ap.add_argument("--max-articles", type=int, default=30)
    ap.add_argument("--no-news", action="store_true")
    ap.add_argument("--tg-channels", default="", help="comma-separated REAL public channel names")
    ap.add_argument("--tg-limit", type=int, default=100)
    ap.add_argument("--tg-full", action="store_true",
                    help="full history via Telethon (needs TG_API_ID/HASH + login)")
    ap.add_argument("--tg-full-limit", type=int, default=2000,
                    help="messages per channel for --tg-full")
    ap.add_argument("--tg-login", action="store_true",
                    help="one-time interactive login; prints TG_SESSION_STRING")
    ap.add_argument("--delay", type=float, default=1.0)
    args = ap.parse_args()

    if args.tg_login:
        tg_login()
        return

    all_rows: list[dict] = []
    if not args.no_youtube:
        all_rows += scrape_youtube(args.max_videos, args.comments_per_video,
                                   args.subs, args.delay, args.search_per_query,
                                   args.video_offset)
    if not args.no_news:
        all_rows += scrape_news(args.max_articles, args.delay)
    tg = [c for c in args.tg_channels.split(",") if c.strip()]
    if tg:
        if args.tg_full:
            all_rows += scrape_telegram_full(tg, args.tg_full_limit)
        else:
            all_rows += scrape_telegram(tg, args.tg_limit, args.delay)
    else:
        print("[telegram] no channels given — skipped (guessed names return empty)")

    if not all_rows:
        print("No rows scraped. Nothing written.")
        return
    df = pd.DataFrame(all_rows)
    df["text"] = df["text"].astype(str).str.strip()
    df = df[(df["text"].str.len() >= 10) & (df["text"].str.len() <= 1000)]
    df = df.drop_duplicates(subset=["text"]).reset_index(drop=True)
    OUT_TXT.parent.mkdir(parents=True, exist_ok=True)
    # append-merge with existing social mono (dedupe)
    existing: set[str] = set()
    if OUT_TXT.exists():
        existing = set(OUT_TXT.read_text(encoding="utf-8", errors="ignore").splitlines())
    new_lines = [t for t in df["text"].tolist() if t not in existing]
    with OUT_TXT.open("a", encoding="utf-8") as f:
        for t in new_lines:
            f.write(t + "\n")
    df.to_csv(OUT_CSV, index=False)
    print(f"scraped={len(df)} new_lines={len(new_lines)} total_file={len(existing) + len(new_lines)}")
    print(f"wrote {OUT_TXT} + {OUT_CSV}")
    print("Next: python scripts/build_sheng_augmented.py --no-push  (picks up sheng_mono_*.txt)")


if __name__ == "__main__":
    main()
