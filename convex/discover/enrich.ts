import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

// =============================================================================
// AI ENRICHMENT — Summary Generation, Trend Scoring
// =============================================================================

const SUNFLOWER_URL = "https://router.huggingface.co/BlakHasan/Sunflower-Gemma4-E2B";

async function callSunflower(
  messages: { role: string; content: string }[],
  maxTokens = 512,
  temperature = 0.3,
): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("HUGGINGFACE_API_KEY not configured");

  const response = await fetch(SUNFLOWER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "BlakHasan/Sunflower-Gemma4-E2B",
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Discover Enrich] API Error (${response.status}):`, errorText);
    throw new Error(`API error: ${response.status}`);
  }

  const result = await response.json();
  return result?.choices?.[0]?.message?.content?.trim() || "";
}

// Enrich clusters with AI-generated summaries
export const enrichClusters = internalAction({
  args: {},
  handler: async (ctx): Promise<{ enriched: number; total: number }> => {
    // Get clusters that need enrichment (no summary yet)
    const clusters = await ctx.runQuery(
      internal.discover.enrich.getUnenrichedClusters,
      { limit: 10 }
    );

    let enriched = 0;
    for (const cluster of clusters) {
      try {
        // Gather item details for context
        const items = await ctx.runQuery(
          internal.discover.enrich.getClusterItems,
          { itemIds: cluster.itemIds }
        );

        // Generate summary deterministically from article data
        const headlines = items.map((item) => item.title).filter(Boolean);
        const descriptions = items.map((item) => item.description).filter(Boolean);

        // Build a summary from the most informative content
        const summaryParts: string[] = [];
        if (descriptions.length > 0) {
          // Use the first meaningful description (up to 2 sentences)
          const desc = descriptions[0].replace(/<[^>]*>/g, "").trim();
          summaryParts.push(desc.slice(0, 200));
        }
        if (headlines.length > 1) {
          summaryParts.push(`Also reported by: ${headlines.slice(1, 3).join("; ")}`);
        }

        const summary = summaryParts.join(" ") || cluster.topicTitle;

        // Why trending based on source count
        let whyTrending: string;
        if (cluster.sourceCount >= 5) {
          whyTrending = `Covered by ${cluster.sourceCount} sources — major story`;
        } else if (cluster.sourceCount >= 3) {
          whyTrending = `Picked up by ${cluster.sourceCount} outlets`;
        } else {
          whyTrending = `From ${cluster.sourceDomains[0] || "a news source"}`;
        }

        const suggestedQuery = cluster.topicTitle;

        await ctx.runMutation(internal.discover.enrich.updateClusterEnrichment, {
          clusterId: cluster._id,
          summary,
          whyTrending,
          suggestedQuery,
        });

        enriched++;
      } catch (error) {
        console.error(`[Discover Enrich] Failed to enrich cluster ${cluster._id}:`, error);
      }
    }

    console.log(`[Discover] Enriched ${enriched}/${clusters.length} clusters`);
    return { enriched, total: clusters.length };
  },
});

// Compute trend scores for all active clusters
export const computeTrendScores = internalAction({
  args: {},
  handler: async (ctx): Promise<{ scored: number }> => {
    const clusters = await ctx.runQuery(
      internal.discover.enrich.getActiveClusters
    );

    let scored = 0;
    for (const cluster of clusters) {
      const score = calculateTrendScore(cluster);
      await ctx.runMutation(internal.discover.enrich.updateTrendScore, {
        clusterId: cluster._id,
        trendScore: score,
      });
      scored++;
    }

    console.log(`[Discover] Scored ${scored} clusters`);
    return { scored };
  },
});

// Calculate Trend Velocity Score
function calculateTrendScore(cluster: {
  newestPublishedAt: number;
  sourceCount: number;
  category: string;
  country: string;
  itemIds: string[];
}): number {
  const now = Date.now();
  const ageHours = (now - cluster.newestPublishedAt) / (1000 * 60 * 60);

  // Recency: 1.0 at 0h, decays to 0 at 72h
  const recency = Math.max(0, 1 - ageHours / 72);

  // Velocity: higher if many sources arrived recently
  const velocityDecay = ageHours < 6 ? 1.0 : ageHours < 24 ? 0.8 : ageHours < 72 ? 0.5 : 0.2;
  const velocity = Math.min(1.0, (cluster.sourceCount / 10) * Math.log2(cluster.sourceCount + 1) * velocityDecay);

  // Source breadth: more sources = more important
  const sourceBreadth = Math.min(1.0, cluster.sourceCount / 10);

  // Geographic relevance: Kenya gets top priority
  const geoRelevance = cluster.country === "KE" ? 1.0 :
    ["UG", "TZ", "ET", "RW", "SS", "SO", "CD"].includes(cluster.country) ? 0.7 :
    cluster.country === "AF" ? 0.5 : 0.3;

  // Category boost: tech/science/AI get slight boost
  const categoryBoost = ["tech", "kenya"].includes(cluster.category) ? 1.1 :
    cluster.category === "africa" ? 1.05 : 1.0;

  // Stale penalty
  const stalePenalty = ageHours < 6 ? 0.0 :
    ageHours < 24 ? 0.2 :
    ageHours < 72 ? 0.5 : 0.8;

  // Final score
  const score = (
    recency * 0.30 +
    velocity * 0.35 +
    sourceBreadth * 0.15 +
    geoRelevance * 0.10 +
    0.5 * 0.10 // base interest
  ) * categoryBoost - stalePenalty * 0.3;

  return Math.round(Math.max(0, Math.min(100, score * 100)));
}

// Get clusters that need enrichment
export const getUnenrichedClusters = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const clusters = await ctx.db
      .query("discoverClusters")
      .withIndex("by_status_trendScore", (q) => q.eq("status", "active"))
      .collect();

    return clusters
      .filter((c) => !c.summary || c.summary === "")
      .sort((a, b) => b.newestPublishedAt - a.newestPublishedAt)
      .slice(0, args.limit);
  },
});

// Get all active clusters for scoring
export const getActiveClusters = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("discoverClusters")
      .withIndex("by_status_trendScore", (q) => q.eq("status", "active"))
      .collect();
  },
});

// Get items belonging to a cluster
export const getClusterItems = internalQuery({
  args: { itemIds: v.array(v.id("discoverItems")) },
  handler: async (ctx, args) => {
    const items = [];
    for (const id of args.itemIds) {
      const item = await ctx.db.get(id);
      if (item) items.push(item);
    }
    return items;
  },
});

// Update cluster enrichment
export const updateClusterEnrichment = internalMutation({
  args: {
    clusterId: v.id("discoverClusters"),
    summary: v.string(),
    whyTrending: v.string(),
    suggestedQuery: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clusterId, {
      summary: args.summary,
      whyTrending: args.whyTrending,
      suggestedQuery: args.suggestedQuery,
    });
  },
});

// Update trend score
export const updateTrendScore = internalMutation({
  args: {
    clusterId: v.id("discoverClusters"),
    trendScore: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clusterId, { trendScore: args.trendScore });
  },
});
