import { describe, expect, it } from "vitest";

import {
  estimateReadingMinutes,
  inferLanguages,
  inferTopic,
  parseFeed,
  parseJsonFeed,
  stableHash,
  toDiscoverItems,
  toPlainText,
} from "@/lib/discover/ingest";
import {
  preferredDiscoverLanguages,
  rankDiscoverItems,
} from "@/lib/discover/rank";
import type { DiscoverItem } from "@/lib/data/types";

const RSS = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Test Feed</title>
  <item>
    <title>Mobile money changes small trade</title>
    <link>https://example.org/mobile-money</link>
    <description>How mobile money changed trade in Kenya.</description>
    <pubDate>Mon, 03 Nov 2026 09:00:00 GMT</pubDate>
    <category>kiswahili</category>
  </item>
  <item>
    <title>Ten Kikuyu proverbs about farming and rain</title>
    <link>https://example.org/proverbs</link>
    <description>Weather wisdom passed down in Gĩkũyũ.</description>
    <pubDate>Sun, 02 Nov 2026 09:00:00 GMT</pubDate>
    <category>kikuyu</category>
  </item>
</channel></rss>`;

describe("feed parsing", () => {
  it("reads the items out of an RSS feed", () => {
    const entries = parseFeed(RSS);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.title).toBe("Mobile money changes small trade");
    expect(entries[0]?.link).toBe("https://example.org/mobile-money");
  });

  it("reads categories as language hints", () => {
    const entries = parseFeed(RSS);
    expect(entries[0]?.categories).toEqual(["kiswahili"]);
  });

  it("parses the published date", () => {
    const entries = parseFeed(RSS);
    expect(entries[0]?.publishedAt).toBe(Date.parse("2026-11-03T09:00:00Z"));
  });

  it("reads Atom entries too", () => {
    const atom = `<feed><entry><title>Hello</title><link href="https://x.test/a"/>
      <summary>Body</summary><updated>2026-01-01T00:00:00Z</updated></entry></feed>`;
    const entries = parseFeed(atom);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.title).toBe("Hello");
    expect(entries[0]?.link).toBe("https://x.test/a");
  });

  it("ignores an entry with no title", () => {
    const feed = `<rss><channel><item><description>orphan</description></item></channel></rss>`;
    expect(parseFeed(feed)).toHaveLength(0);
  });

  it("strips HTML from descriptions", () => {
    expect(toPlainText("<p>Hello <b>world</b></p>")).toBe("Hello world");
    expect(toPlainText("a &amp; b")).toBe("a & b");
  });

  it("preserves non-ASCII characters", () => {
    const entries = parseFeed(RSS);
    expect(entries[1]?.summary).toContain("Gĩkũyũ");
  });
});

describe("topic inference", () => {
  it("matches whole words, not substrings", () => {
    // "rain" contains "ai", which is a technology keyword.
    expect(inferTopic("Ten proverbs about farming and rain")).not.toBe(
      "technology",
    );
    expect(inferTopic("Ten proverbs about farming and rain")).toBe("culture");
  });

  it("detects a technology story", () => {
    expect(inferTopic("A new software and internet startup")).toBe("technology");
  });

  it("detects an education story", () => {
    expect(inferTopic("School and university teachers celebrate")).toBe(
      "education",
    );
  });

  it("defaults to news when nothing matches", () => {
    expect(inferTopic("Something entirely unrelated")).toBe("news");
  });
});

describe("language inference", () => {
  it("uses the feed's language tags and drops non-languages", () => {
    // "technology" is a topic, not a language, so it is filtered out.
    expect(inferLanguages(["kiswahili", "technology"])).toEqual(["kiswahili"]);
  });

  it("keeps only known language ids", () => {
    expect(inferLanguages(["kiswahili", "not-a-language"])).toEqual([
      "kiswahili",
    ]);
  });

  it("falls back to English when there are no tags", () => {
    expect(inferLanguages(undefined)).toEqual(["en"]);
    expect(inferLanguages([])).toEqual(["en"]);
  });
});

describe("discover items", () => {
  it("derives a stable id from the link", () => {
    const items = toDiscoverItems(parseFeed(RSS), { source: "Test" });
    const again = toDiscoverItems(parseFeed(RSS), { source: "Test" });
    expect(items[0]?.id).toBe(again[0]?.id);
    expect(items[0]?.id).toBe(`discover-${stableHash("https://example.org/mobile-money")}`);
  });

  it("carries the source, link and reading time", () => {
    const items = toDiscoverItems(parseFeed(RSS), { source: "Test" });
    expect(items[0]?.source).toBe("Test");
    expect(items[0]?.sourceUrl).toBe("https://example.org/mobile-money");
    expect(items[0]?.readingMinutes).toBeGreaterThan(0);
  });

  it("estimates reading time at 200 words a minute", () => {
    expect(estimateReadingMinutes("one two three four")).toBe(1);
    expect(estimateReadingMinutes(Array(400).fill("word").join(" "))).toBe(2);
  });

  it("parses a JSON feed", () => {
    const json = JSON.stringify({
      source: "JSON Feed",
      items: [
        {
          title: "A story",
          summary: "About something",
          url: "https://example.org/a",
          languages: ["somali"],
          topic: "news",
          publishedAt: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const items = parseJsonFeed(json);
    expect(items).toHaveLength(1);
    expect(items[0]?.languages).toEqual(["somali"]);
    expect(items[0]?.topic).toBe("news");
    expect(items[0]?.source).toBe("JSON Feed");
  });

  it("drops JSON items without a title", () => {
    const items = parseJsonFeed(JSON.stringify({ items: [{ summary: "x" }] }));
    expect(items).toHaveLength(0);
  });
});

describe("discover ranking", () => {
  const now = Date.parse("2026-11-07T00:00:00Z");

  const item = (id: string, overrides: Partial<DiscoverItem> = {}): DiscoverItem => ({
    id,
    title: id,
    summary: "Summary",
    topic: "news",
    languages: ["en"],
    source: "Test",
    publishedAt: now - 1000 * 60 * 60,
    readingMinutes: 5,
    saved: false,
    ...overrides,
  });

  it("puts a story in the reader's language first", () => {
    const ranked = rankDiscoverItems(
      [item("english"), item("swahili", { languages: ["kiswahili"] })],
      { languageIds: ["kiswahili"], savedIds: [], now },
    );
    expect(ranked[0]?.item.id).toBe("swahili");
    expect(ranked[0]?.reasons.join(" ")).toContain("kiswahili");
  });

  it("prefers a language the reader prefers first", () => {
    const ranked = rankDiscoverItems(
      [
        item("second", { languages: ["kikuyu"] }),
        item("first", { languages: ["kiswahili"] }),
      ],
      { languageIds: ["kiswahili", "kikuyu"], savedIds: [], now },
    );
    expect(ranked[0]?.item.id).toBe("first");
  });

  it("raises a saved item", () => {
    const ranked = rankDiscoverItems(
      [item("a"), item("b", { saved: true })],
      { languageIds: [], savedIds: ["b"], now },
    );
    expect(ranked[0]?.item.id).toBe("b");
    expect(ranked[0]?.reasons).toContain("saved");
  });

  it("raises a recent item", () => {
    const ranked = rankDiscoverItems(
      [item("old", { publishedAt: now - 1000 * 60 * 60 * 24 * 30 }), item("new")],
      { languageIds: [], savedIds: [], now },
    );
    expect(ranked[0]?.item.id).toBe("new");
  });

  it("gives every result a reason", () => {
    const ranked = rankDiscoverItems([item("a")], {
      languageIds: ["en"],
      savedIds: [],
      now,
    });
    expect(ranked[0]?.reasons.length).toBeGreaterThan(0);
  });

  it("orders the reader's languages by preference", () => {
    const ordered = preferredDiscoverLanguages(["en", "kiswahili"], ["kiswahili"]);
    expect(ordered[0]).toBe("kiswahili");
    expect(ordered).toContain("en");
  });
});
