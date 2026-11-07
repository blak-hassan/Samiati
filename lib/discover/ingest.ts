/**
 * Discover ingestion.
 *
 * Samiati does not scrape the web. It reads a feed that has been configured
 * for it — a publication's own RSS/Atom output, or a JSON feed — and turns it
 * into Discover items.
 *
 * This keeps the licensing position clean: the publisher chooses to publish
 * a feed, and Samiati reads it.
 *
 * The parsing here is pure and works on a string, so it can be tested without
 * a network and reused by the ingestion script.
 */

import type { DiscoverItem, DiscoverTopic } from "@/lib/data/types";

const TOPIC_KEYWORDS: ReadonlyArray<{ topic: DiscoverTopic; words: string[] }> = [
  {
    topic: "technology",
    words: [
      "tech", "technology", "software", "internet", "mobile", "ai", "digital",
      "computer", "startup", "innovation", "app", "data",
    ],
  },
  {
    topic: "culture",
    words: [
      "culture", "music", "film", "art", "festival", "food", "language",
      "tradition", "diaspora", "book", "literature", "proverbs", "wisdom",
      "folklore", "saying", "idiom", "storytelling",
    ],
  },
  {
    topic: "history",
    words: [
      "history", "heritage", "ancient", "colonial", "archive", "century",
      "civilisation", "civilization", "tradition",
    ],
  },
  {
    topic: "education",
    words: [
      "school", "university", "education", "student", "teacher", "learning",
      "classroom", "exam", "scholarship",
    ],
  },
  {
    topic: "news",
    words: [
      "news", "report", "announcement", "election", "government", "council",
      "president", "minister", "launched", "opens", "warns",
    ],
  },
  {
    topic: "community",
    words: [
      "community", "residents", "village", "town", "youth", "women", "farmers",
      "market", "clinic", "farming", "harvest", "crops",
      "livestock", "pastoral",
    ],
  },
];

/**
 * Guesses a topic from a title and summary.
 *
 * Matching is on whole words. Substring matching would be wrong in a way
 * that matters here: "rain" contains "ai", and "happen" contains "app", so a
 * story about farming would be filed under technology.
 */
export function inferTopic(text: string): DiscoverTopic {
  const words = text.toLowerCase().split(/[^a-z]+/);
  const wordSet = new Set(words);

  let best: DiscoverTopic = "news";
  let bestScore = 0;

  for (const entry of TOPIC_KEYWORDS) {
    let score = 0;
    for (const word of entry.words) {
      if (wordSet.has(word)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry.topic;
    }
  }

  return best;
}

/**
 * Infers which Samiati languages an item is about.
 *
 * The feed is expected to carry language tags; when it does not, the item is
 * treated as English-only, which is the honest default.
 */
export function inferLanguages(raw: string[] | undefined): string[] {
  if (!raw || raw.length === 0) return ["en"];
  const known = new Set([
    "en", "kiswahili", "sheng", "kikuyu", "luhya", "dholuo", "somali",
    "kamba", "kalenjin", "gusii", "meru", "maasai",
  ]);
  const matched = raw
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => known.has(tag));
  return matched.length > 0 ? matched : ["en"];
}

/** Strips HTML tags and collapses whitespace. */
export function toPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** A single entry from an RSS or Atom feed. */
export interface RawFeedEntry {
  title: string;
  link?: string;
  summary?: string;
  content?: string;
  publishedAt?: number;
  categories?: string[];
  readingMinutes?: number;
}

/**
 * Parses an RSS 2.0 or Atom feed.
 *
 * A regular expression is used rather than a full XML parser on purpose: the
 * input is a small, well-formed feed, and Samiati should not ship a
 * dependency that parses untrusted XML in a way that has had CVEs.
 */
export function parseFeed(xml: string): RawFeedEntry[] {
  const items: RawFeedEntry[] = [];

  const itemBlocks = [
    ...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi),
    ...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi),
  ];

  for (const match of itemBlocks) {
    const block = match[0];

    const title = firstTag(block, "title");
    if (!title) continue;

    const link =
      firstTag(block, "link") ??
      firstAttribute(block, "link", "href") ??
      undefined;

    const summary =
      firstTag(block, "description") ??
      firstTag(block, "summary") ??
      firstTag(block, "content") ??
      "";

    const publishedRaw =
      firstTag(block, "pubDate") ??
      firstTag(block, "published") ??
      firstTag(block, "updated") ??
      undefined;

    const categories = [...block.matchAll(/<category\b[^>]*>([\s\S]*?)<\/category>/gi)]
      .map((category) => toPlainText(category[1] ?? ""))
      .filter(Boolean);

    items.push({
      title: toPlainText(title),
      link,
      summary: toPlainText(summary),
      publishedAt: publishedRaw ? Date.parse(publishedRaw) : undefined,
      categories,
    });
  }

  return items;
}

function firstTag(block: string, tag: string): string | undefined {
  const match = block.match(
    new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
  );
  return match?.[1];
}

function firstAttribute(
  block: string,
  tag: string,
  attribute: string,
): string | undefined {
  const match = block.match(
    new RegExp(`<${tag}\\b[^>]*\\b${attribute}=["']([^"']+)["']`, "i"),
  );
  return match?.[1];
}

/**
 * Converts raw feed entries into Discover items.
 *
 * The id is derived from the link so that re-running the ingestion updates
 * the same item rather than creating a duplicate.
 */
export function toDiscoverItems(
  entries: RawFeedEntry[],
  options: { source: string; now?: number } = { source: "Samiati Feed" },
): DiscoverItem[] {
  const now = options.now ?? Date.now();

  return entries.map((entry, index) => {
    const summary = entry.summary || entry.title;
    const id = entry.link
      ? `discover-${stableHash(entry.link)}`
      : `discover-${stableHash(`${entry.title}-${index}`)}`;

    return {
      id,
      title: entry.title,
      summary: summary.length > 400 ? `${summary.slice(0, 397)}…` : summary,
      topic: inferTopic(`${entry.title} ${summary}`),
      languages: inferLanguages(entry.categories),
      source: options.source,
      publishedAt: entry.publishedAt ?? now,
      readingMinutes: estimateReadingMinutes(summary),
      saved: false,
      sourceUrl: entry.link,
    };
  });
}

/** A rough reading-time estimate at 200 words per minute. */
export function estimateReadingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** A small, stable string hash. */
export function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Parses a JSON feed.
 *
 * The expected shape is `{ "items": [{ "title", "summary", "url", "languages", "topic", "publishedAt" }] }`.
 */
export function parseJsonFeed(json: string): DiscoverItem[] {
  const parsed = JSON.parse(json) as {
    source?: string;
    items?: Array<{
      title?: string;
      summary?: string;
      url?: string;
      languages?: string[];
      topic?: DiscoverTopic;
      publishedAt?: string | number;
      readingMinutes?: number;
    }>;
  };

  const source = parsed.source ?? "Samiati Feed";
  const items = parsed.items ?? [];

  return items
    .filter(
      (item): item is typeof item & { title: string } =>
        typeof item.title === "string" && item.title.length > 0,
    )
    .map((item, index) => {
      const summary = item.summary ?? "";
      const publishedAt =
        typeof item.publishedAt === "number"
          ? item.publishedAt
          : item.publishedAt
            ? Date.parse(item.publishedAt)
            : Date.now();

      return {
        id: item.url
          ? `discover-${stableHash(item.url)}`
          : `discover-${stableHash(`${item.title}-${index}`)}`,
        title: item.title,
        summary: summary.length > 400 ? `${summary.slice(0, 397)}…` : summary,
        topic: item.topic ?? inferTopic(`${item.title} ${summary}`),
        languages: inferLanguages(item.languages),
        source,
        publishedAt: Number.isNaN(publishedAt) ? Date.now() : publishedAt,
        readingMinutes:
          item.readingMinutes ?? estimateReadingMinutes(summary),
        saved: false,
        sourceUrl: item.url,
      };
    });
}
