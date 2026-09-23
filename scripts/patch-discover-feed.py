#!/usr/bin/env python3
"""
Patch convex/discover/feed.ts: replace two unbounded `.collect()` hotspots
with bounded index reads (Discover F-02) and dedup dismissTopic (Discover F-15).

Requires the composite indexes added to convex/schema.ts in a separate edit.
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
FEED = REPO_ROOT / "convex" / "discover" / "feed.ts"

if not FEED.exists():
    sys.exit(f"missing {FEED}")

raw = FEED.read_text(encoding="utf-8")
eol = "\r\n" if "\r\n" in raw else "\n"
lines = raw.splitlines()


def find_first(pred):
    for i, ln in enumerate(lines):
        if pred(ln):
            return i
    raise SystemExit("anchor not found in feed.ts")
