import { v } from "convex/values";
import { query, internalQuery, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

// =============================================================================
// CONTENT SOURCES — RSS Feeds, GDELT, and Source Reputation
// =============================================================================

// Kenyan publisher RSS feeds
const KENYAN_RSS_FEEDS = [
  { name: "Nation Africa", url: "https://nation.africa/kenya/rss.xml", domain: "nation.africa" },
  { name: "The Standard", url: "https://www.standardmedia.co.ke/rss/headlines.php", domain: "standardmedia.co.ke" },
  { name: "The Star Kenya", url: "https://www.the-star.co.ke/feed/", domain: "the-star.co.ke" },
  { name: "Business Daily", url: "https://www.businessdailyafrica.com/feed", domain: "businessdailyafrica.com" },
  { name: "Capital FM", url: "https://www.capitalfm.co.ke/feed/", domain: "capitalfm.co.ke" },
  { name: "The East African", url: "https://www.theeastafrican.co.ke/tea/rss", domain: "theeastafrican.co.ke" },
  { name: "KBC", url: "https://www.kbc.co.ke/feed/", domain: "kbc.co.ke" },
  { name: "Taifa Leo", url: "https://taifaleo.nation.co.ke/feed/", domain: "taifaleo.nation.co.ke" },
];

// GDELT DOC 2.0 API for Kenya/Africa events
const GDELT_BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc";

// Category keywords for classification
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  kenya: ["kenya", "nairobi", "kenyan", "kiambu", "mombasa", "kisumu", "nakuru", "eldoret", "uhuru", "ruto", "parliament", "county"],
  africa: ["africa", "african union", "au", "afctfa", "sadc", "ecowas", "east africa", "uganda", "tanzania", "ethiopia", "nigeria", "south africa", "congo", "sudan"],
  tech: ["ai", "artificial intelligence", "technology", "startup", "fintech", "m-pesa", "mobile money", "tech", "digital", "innovation", "software", "data"],
  culture: ["culture", "language", "tradition", "music", "art", "film", "festival", "food", "dance", "proverb", "folklore", "heritage"],
  world: ["global", "international", "united states", "china", "europe", "united nations", "world", "diaspora"],
  trending: ["viral", "trending", "popular", "buzz", "social media", "hashtag"],
};

// Source reputation tiers
const SOURCE_REPUTATION: Record<string, { tier: number; label: string; trustScore: number; isKenyan: boolean; isAfrican: boolean }> = {
  "go.ke": { tier: 1, label: "Government", trustScore: 1.0, isKenyan: true, isAfrican: true },
  "ac.ke": { tier: 2, label: "Academic", trustScore: 0.9, isKenyan: true, isAfrican: true },
  "nation.africa": { tier: 3, label: "Major Publisher", trustScore: 0.85, isKenyan: true, isAfrican: true },
  "standardmedia.co.ke": { tier: 3, label: "Major Publisher", trustScore: 0.85, isKenyan: true, isAfrican: true },
  "the-star.co.ke": { tier: 3, label: "Major Publisher", trustScore: 0.85, isKenyan: true, isAfrican: true },
  "businessdailyafrica.com": { tier: 3, label: "Major Publisher", trustScore: 0.85, isKenyan: true, isAfrican: true },
  "theeastafrican.co.ke": { tier: 3, label: "Major Publisher", trustScore: 0.85, isKenyan: true, isAfrican: true },
  "capitalfm.co.ke": { tier: 5, label: "Broadcast", trustScore: 0.75, isKenyan: true, isAfrican: true },
  "kbc.co.ke": { tier: 5, label: "Broadcast", trustScore: 0.75, isKenyan: true, isAfrican: true },
  "taifaleo.nation.co.ke": { tier: 3, label: "Major Publisher", trustScore: 0.85, isKenyan: true, isAfrican: true },
  "bbc.co.uk": { tier: 4, label: "International", trustScore: 0.8, isKenyan: false, isAfrican: false },
  "reuters.com": { tier: 4, label: "International", trustScore: 0.8, isKenyan: false, isAfrican: false },
  "aljazeera.com": { tier: 4, label: "International", trustScore: 0.8, isKenyan: false, isAfrican: false },
};

// Fetch RSS feed and parse items
async function fetchRSSFeed(feed: { name: string; url: string; domain: string }): Promise<{
  sourceId: string;
  sourceUrl: string;
  title: string;
  description: string;
  publishedAt: number;
  raw: string;
  imageUrl?: string;
}[]> {
  try {
    const response = await fetch(feed.url, {
      headers: { "User-Agent": "Samiati-Discover/1.0 (+https://samiati.com)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return [];

    const text = await response.text();
    const items: {
      sourceId: string;
      sourceUrl: string;
      title: string;
      description: string;
      publishedAt: number;
      raw: string;
      imageUrl?: string;
    }[] = [];

    // Simple XML parsing for RSS items
    const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/gi) || [];
    for (const item of itemMatches.slice(0, 20)) {
      const title = extractTag(item, "title");
      const link = extractTag(item, "link");
      const description = extractTag(item, "description");
      const pubDate = extractTag(item, "pubDate");
      const enclosure = extractAttribute(item, "enclosure", "url");

      if (!title || !link) continue;

      const publishedAt = pubDate ? new Date(pubDate).getTime() : Date.now();
      if (isNaN(publishedAt)) continue;

      items.push({
        sourceId: `rss:${feed.domain}:${btoa(link).slice(0, 40)}`,
        sourceUrl: link,
        title: decodeHTML(title),
        description: decodeHTML(description || "").slice(0, 500),
        publishedAt,
        raw: item,
        imageUrl: enclosure || undefined,
      });
    }

    return items;
  } catch (error) {
    console.error(`[Discover] Failed to fetch RSS feed ${feed.name}:`, error);
    return [];
  }
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function extractAttribute(xml: string, tag: string, attr: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*${attr}=["']([^"']*)["']`, "i"));
  return match ? match[1] : "";
}

function decodeHTML(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "…")
    .replace(/&#\d+;/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

// Fetch GDELT events for Kenya/Africa
async function fetchGDELT(): Promise<{
  sourceId: string;
  sourceUrl: string;
  title: string;
  description: string;
  publishedAt: number;
  raw: string;
  imageUrl?: string;
}[]> {
  try {
    const url = `${GDELT_BASE_URL}?query=sourcecountry:Kenya&mode=artlist&maxrecords=15&format=json`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return [];

    const text = await response.text();
    // GDELT sometimes returns non-JSON, handle gracefully
    let data: { articles?: Record<string, string>[] };
    try {
      data = JSON.parse(text);
    } catch {
      console.warn("[Discover] GDELT returned non-JSON response, skipping");
      return [];
    }

    const articles = data.articles || [];

    return articles.map((article: Record<string, string>) => ({
      sourceId: `gdelt:${btoa(article.url || "").slice(0, 40)}`,
      sourceUrl: article.url || "",
      title: article.title || "",
      description: (article.seendate || "").slice(0, 500),
      publishedAt: article.seendate ? new Date(article.seendate).getTime() : Date.now(),
      raw: JSON.stringify(article),
      imageUrl: article.socialimage || undefined,
    }));
  } catch (error) {
    console.error("[Discover] Failed to fetch GDELT:", error);
    return [];
  }
}

// Fetch all sources and return raw items
export async function fetchAllSources(): Promise<{
  sourceId: string;
  sourceUrl: string;
  title: string;
  description: string;
  publishedAt: number;
  raw: string;
  imageUrl?: string;
  feedName: string;
  feedDomain: string;
}[]> {
  const allItems: {
    sourceId: string;
    sourceUrl: string;
    title: string;
    description: string;
    publishedAt: number;
    raw: string;
    imageUrl?: string;
    feedName: string;
    feedDomain: string;
  }[] = [];

  // Fetch Kenyan RSS feeds in parallel
  const rssResults = await Promise.allSettled(
    KENYAN_RSS_FEEDS.map(async (feed) => {
      const items = await fetchRSSFeed(feed);
      return items.map((item) => ({
        ...item,
        feedName: feed.name,
        feedDomain: feed.domain,
      }));
    })
  );

  for (const result of rssResults) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  // Fetch GDELT
  const gdeltItems = await fetchGDELT();
  for (const item of gdeltItems) {
    allItems.push({
      ...item,
      feedName: "GDELT",
      feedDomain: new URL(item.sourceUrl || "https://unknown.com").hostname.replace("www.", ""),
    });
  }

  return allItems;
}

// Classify category based on keywords
export function classifyCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = keywords.filter((kw) => text.includes(kw)).length;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] > 0) return sorted[0][0];
  return "world";
}

// Extract geographic country from text
export function extractCountry(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  const countries: Record<string, string[]> = {
    KE: ["kenya", "nairobi", "kenyan", "kiambu", "mombasa", "kisumu", "nakuru", "eldoret"],
    UG: ["uganda", "kampala", "ugandan"],
    TZ: ["tanzania", "dar es salaam", "tanzanian"],
    ET: ["ethiopia", "addis ababa", "ethiopian"],
    NG: ["nigeria", "lagos", "nigerian"],
    ZA: ["south africa", "cape town", "johannesburg", "south african"],
    CD: ["congo", "kinshasa", "congolese"],
    RW: ["rwanda", "kigali", "rwandan"],
    SS: ["south sudan", "juba"],
    SO: ["somalia", "mogadishu", "somali"],
  };

  for (const [code, keywords] of Object.entries(countries)) {
    if (keywords.some((kw) => text.includes(kw))) return code;
  }
  return "KE"; // Default to Kenya
}

// Extract Kenyan county from text
export function extractCounty(title: string, description: string): string | undefined {
  const text = `${title} ${description}`.toLowerCase();
  const counties = [
    "nairobi", "mombasa", "kisumu", "nakuru", "kiambu", "machakos", "kajiado",
    "uasin gishu", "kilifi", "meru", "nyeri", "kakamega", "bungoma", "busia",
    "siaya", "homa bay", "migori", "kisii", "nyamira", "kericho", "bomet",
    "laikipia", "nyandarua", "murang'a", "taru", "tana river", "lamu", "taita taveta",
    "embu", "tharaka nithi", "isliolo", "samburu", "marsabit", "wajir", "garissa",
    "mandera", "turkana", "west pokot", "trans nzoia", "bungoma", "vihiga",
    "machakos", "makueni", "kitui",
  ];

  for (const county of counties) {
    if (text.includes(county)) return county.charAt(0).toUpperCase() + county.slice(1);
  }
  return undefined;
}

// Get source reputation by domain
export function getSourceReputation(domain: string): {
  tier: number;
  label: string;
  trustScore: number;
  isKenyan: boolean;
  isAfrican: boolean;
} {
  // Check exact match
  if (SOURCE_REPUTATION[domain]) return SOURCE_REPUTATION[domain];

  // Check TLD-based match
  if (domain.endsWith(".go.ke")) return SOURCE_REPUTATION["go.ke"];
  if (domain.endsWith(".ac.ke")) return SOURCE_REPUTATION["ac.ke"];

  // Default
  return { tier: 7, label: "Community", trustScore: 0.5, isKenyan: false, isAfrican: false };
}
