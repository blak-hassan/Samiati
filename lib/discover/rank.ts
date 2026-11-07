/**
 * Discover ranking.
 *
 * A reader should see stories in the languages they care about, and stories
 * they have not already seen. The ranking is deliberately simple and
 * explainable — every score is a visible, named reason.
 */

import type { DiscoverItem } from "@/lib/data/types";

export interface RankContext {
  /** The user's languages, most preferred first. */
  languageIds: string[];
  /** The ids the reader has saved. */
  savedIds: string[];
  /** The current time, for recency. */
  now: number;
}

export interface RankedItem {
  item: DiscoverItem;
  score: number;
  reasons: string[];
}

/** How many days old an item may be and still count as recent. */
const RECENT_WINDOW_DAYS = 7;

/**
 * Scores and orders Discover items for one reader.
 *
 * The order of the reasons is the order of the weights: language first,
 * because a story in the reader's own language is the most useful thing we
 * can show them.
 */
export function rankDiscoverItems(
  items: readonly DiscoverItem[],
  context: RankContext,
): RankedItem[] {
  const languages = new Set(context.languageIds);
  const saved = new Set(context.savedIds);

  return items
    .map((item) => {
      const reasons: string[] = [];
      let score = 0;

      const matching = item.languages.filter((id) => languages.has(id));
      if (matching.length > 0) {
        // The reader's first language counts for more than their second.
        const rank = Math.min(
          ...matching.map((id) => {
            const index = context.languageIds.indexOf(id);
            return index === -1 ? context.languageIds.length : index;
          }),
        );
        const weight = 40 - Math.min(rank, 5) * 5;
        score += weight;
        reasons.push(`in ${matching.join(", ")}`);
      }

      if (saved.has(item.id)) {
        score += 15;
        reasons.push("saved");
      }

      const ageDays = (context.now - item.publishedAt) / (1000 * 60 * 60 * 24);
      if (ageDays <= RECENT_WINDOW_DAYS) {
        score += 20;
        reasons.push(ageDays < 1 ? "published today" : "recent");
      } else {
        score += Math.max(0, 10 - ageDays / 7);
      }

      // Longer pieces are slightly penalised: a short read is usually a
      // better default on a slow connection.
      if (item.readingMinutes <= 4) {
        score += 4;
        reasons.push("quick read");
      }

      return { item, score, reasons };
    })
    .sort((a, b) => b.score - a.score || b.item.publishedAt - a.item.publishedAt);
}

/** The languages a reader is most likely to want, in order. */
export function preferredDiscoverLanguages(
  languageIds: readonly string[],
  favorites: readonly string[],
): string[] {
  const ordered: string[] = [];
  for (const id of favorites) {
    if (languageIds.includes(id)) ordered.push(id);
  }
  for (const id of languageIds) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  return ordered;
}
