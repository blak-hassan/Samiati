import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

// =============================================================================
// SOURCE REPUTATION — Seed and query source trust scores
// =============================================================================

const INITIAL_REPUTATION = [
  // Kenyan Government
  { domain: "statehouse.go.ke", tier: 1, label: "Government", trustScore: 1.0, isKenyan: true, isAfrican: true },
  { domain: "parliament.go.ke", tier: 1, label: "Government", trustScore: 1.0, isKenyan: true, isAfrican: true },
  { domain: "knbs.or.ke", tier: 1, label: "Government", trustScore: 1.0, isKenyan: true, isAfrican: true },
  { domain: "centralbank.go.ke", tier: 1, label: "Government", trustScore: 1.0, isKenyan: true, isAfrican: true },

  // Kenyan Academic
  { domain: "uonbi.ac.ke", tier: 2, label: "Academic", trustScore: 0.9, isKenyan: true, isAfrican: true },
  { domain: "strathmore.edu", tier: 2, label: "Academic", trustScore: 0.9, isKenyan: true, isAfrican: true },

  // Kenyan Major Publishers
  { domain: "nation.africa", tier: 3, label: "Major Publisher", trustScore: 0.85, isKenyan: true, isAfrican: true },
  { domain: "standardmedia.co.ke", tier: 3, label: "Major Publisher", trustScore: 0.85, isKenyan: true, isAfrican: true },
  { domain: "the-star.co.ke", tier: 3, label: "Major Publisher", trustScore: 0.85, isKenyan: true, isAfrican: true },
  { domain: "businessdailyafrica.com", tier: 3, label: "Major Publisher", trustScore: 0.85, isKenyan: true, isAfrican: true },
  { domain: "theeastafrican.co.ke", tier: 3, label: "Major Publisher", trustScore: 0.85, isKenyan: true, isAfrican: true },
  { domain: "taifaleo.nation.co.ke", tier: 3, label: "Major Publisher", trustScore: 0.85, isKenyan: true, isAfrican: true },

  // Kenyan Broadcast
  { domain: "citizentv.co.ke", tier: 5, label: "Broadcast", trustScore: 0.75, isKenyan: true, isAfrican: true },
  { domain: "ntv.co.ke", tier: 5, label: "Broadcast", trustScore: 0.75, isKenyan: true, isAfrican: true },
  { domain: "ktnnews.co.ke", tier: 5, label: "Broadcast", trustScore: 0.75, isKenyan: true, isAfrican: true },
  { domain: "kbc.co.ke", tier: 5, label: "Broadcast", trustScore: 0.75, isKenyan: true, isAfrican: true },
  { domain: "capitalfm.co.ke", tier: 5, label: "Broadcast", trustScore: 0.75, isKenyan: true, isAfrican: true },

  // International
  { domain: "bbc.co.uk", tier: 4, label: "International", trustScore: 0.8, isKenyan: false, isAfrican: false },
  { domain: "reuters.com", tier: 4, label: "International", trustScore: 0.8, isKenyan: false, isAfrican: false },
  { domain: "aljazeera.com", tier: 4, label: "International", trustScore: 0.8, isKenyan: false, isAfrican: false },
  { domain: "theguardian.com", tier: 4, label: "International", trustScore: 0.8, isKenyan: false, isAfrican: false },

  // African
  { domain: "africanews.com", tier: 4, label: "African News", trustScore: 0.75, isKenyan: false, isAfrican: true },
  { domain: "techcabal.com", tier: 6, label: "Digital Native", trustScore: 0.7, isKenyan: false, isAfrican: true },
  { domain: "disrupt-africa.com", tier: 6, label: "Digital Native", trustScore: 0.7, isKenyan: false, isAfrican: true },

  // Digital Native
  { domain: "techcrunch.com", tier: 6, label: "Digital Native", trustScore: 0.7, isKenyan: false, isAfrican: false },
];

// Seed source reputation data
export const seedReputation = internalMutation({
  args: {},
  handler: async (ctx) => {
    let seeded = 0;
    for (const source of INITIAL_REPUTATION) {
      const existing = await ctx.db
        .query("discoverSourceReputation")
        .withIndex("by_domain", (q) => q.eq("domain", source.domain))
        .first();

      if (!existing) {
        await ctx.db.insert("discoverSourceReputation", source);
        seeded++;
      }
    }
    console.log(`[Discover] Seeded ${seeded} source reputation records`);
    return { seeded };
  },
});

// Get source reputation
export const getSourceReputation = internalQuery({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const rep = await ctx.db
      .query("discoverSourceReputation")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .first();

    if (rep) return rep;

    // Check TLD-based patterns
    if (args.domain.endsWith(".go.ke")) {
      return { domain: args.domain, tier: 1, label: "Government", trustScore: 1.0, isKenyan: true, isAfrican: true };
    }
    if (args.domain.endsWith(".ac.ke")) {
      return { domain: args.domain, tier: 2, label: "Academic", trustScore: 0.9, isKenyan: true, isAfrican: true };
    }

    return { domain: args.domain, tier: 7, label: "Community", trustScore: 0.5, isKenyan: false, isAfrican: false };
  },
});
