/**
 * Ingest a Discover feed.
 *
 * Samiati does not scrape publishers. It reads a feed the publisher has
 * chosen to publish — their own RSS/Atom output, or a JSON feed — and turns
 * it into the Discover catalogue.
 *
 * Usage:
 *   node scripts/ingest-discover.ts --url <feed-url> [--source <name>] [--out <path>]
 *
 * Environment:
 *   SAMIATI_DISCOVER_FEED_URL     Used when --url is not given.
 *   SAMIATI_DISCOVER_FEED_SOURCE  The publication name shown on each item.
 *   SAMIATI_DISCOVER_FEED_OUT     Where to write the JSON (default
 *                                 public/discover-feed.json).
 *
 * The output file is served statically and merged into the catalogue by the
 * app on load. Running the script again updates items in place.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  parseFeed,
  parseJsonFeed,
  toDiscoverItems,
  type RawFeedEntry,
} from "../lib/discover/ingest.ts";

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

const url = readArg("url") ?? process.env.SAMIATI_DISCOVER_FEED_URL;
const source =
  readArg("source") ??
  process.env.SAMIATI_DISCOVER_FEED_SOURCE ??
  "Samiati Feed";
const outPath = resolve(
  process.cwd(),
  readArg("out") ??
    process.env.SAMIATI_DISCOVER_FEED_OUT ??
    "public/discover-feed.json",
);

if (!url) {
  console.error(
    "No feed configured. Pass --url <feed-url> or set SAMIATI_DISCOVER_FEED_URL.",
  );
  process.exit(1);
}

console.log(`Fetching ${url} ...`);

let body: string;
let contentType: string;

if (url.startsWith("file://")) {
  // Reading a local file makes it possible to test the pipeline without a
  // network, and to ingest a feed a publisher has delivered by hand.
  const filePath = fileURLToPath(url);
  body = await readFile(resolve(process.cwd(), filePath), "utf8");
  contentType = filePath.endsWith(".json")
    ? "application/json"
    : "application/xml";
} else {
  const response = await fetch(url, {
    headers: { "User-Agent": "Samiati/0.1 (+https://samiati.app)" },
  });

  if (!response.ok) {
    console.error(
      `Feed request failed: ${response.status} ${response.statusText}`,
    );
    process.exit(1);
  }

  body = await response.text();
  contentType = response.headers.get("content-type") ?? "";
}

const looksJson =
  contentType.includes("json") || body.trimStart().startsWith("{");

const items = looksJson
  ? parseJsonFeed(body)
  : toDiscoverItems(parseFeed(body) as RawFeedEntry[], { source });

if (items.length === 0) {
  console.error("The feed produced no items. Nothing was written.");
  process.exit(1);
}

const payload = {
  source,
  ingestedAt: new Date().toISOString(),
  items,
};

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`Wrote ${items.length} items to ${outPath}`);
