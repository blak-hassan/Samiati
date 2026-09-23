import { internalAction, internalQuery, mutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { getCurrentUser } from "../users/utils";
import { changaAutoCategoryValues } from "./validators";

// AI-driven auto-categorization pipeline. The real implementation will call
// external services (fastText for language id, a small LLM for topic
// classification and PII/profanity detection). For now we provide a
// deterministic, offline fallback that uses simple keyword matching so the
// pipeline can be exercised end-to-end without an external dependency.
//
// Each entry is tagged with:
//   - autoCategory: the topic bucket (food, kinship, ritual, etc.)
//   - autoConfidence: 0..1 — how sure the classifier is
//   - detectedLanguage: ISO code of detected language (currently echoes
//     the document's declared language because we have no LID model yet)
//   - piiRiskScore / profanityRiskScore: 0..1 risk scores
//   - suggestedTarget: a placeholder suggestion for entries missing a target

const TOPIC_KEYWORDS: Record<string, string[]> = {
    food: ["food", "eat", "drink", "cook", "meal", "rice", "bread", "water", "milk", "meat", "fruit", "vegetable", "soup", "salt", "sugar", "hungry", "taste"],
    kinship: ["mother", "father", "brother", "sister", "son", "daughter", "uncle", "aunt", "cousin", "grandmother", "grandfather", "husband", "wife", "family", "kin", "parent", "child", "niece", "nephew"],
    ritual: ["ritual", "ceremony", "wedding", "funeral", "baptism", "prayer", "blessing", "ancestor", "spirit", "sacrifice", "祭", "仪式", "singing", "dance", "祭典"],
    weather: ["rain", "sun", "wind", "cloud", "storm", "thunder", "lightning", "snow", "fog", "hot", "cold", "dry", "humid", "sky", "season"],
    agriculture: ["farm", "seed", "harvest", "crop", "field", "plant", "soil", "cattle", "sheep", "goat", "chicken", "tractor", "plow", "irrigation", "fertilizer"],
    music: ["song", "sing", "drum", "flute", "guitar", "dance", "melody", "rhythm", "beat", "lyrics", "chorus", "verse", "chante", "ngoma"],
    story: ["story", "tale", "legend", "myth", "once upon", "long ago", "folklore", "fable", "anansi", "trickster"],
    greeting: ["hello", "goodbye", "good morning", "good night", "welcome", "how are you", "jambo", "habari", "sasa", "ola", "bonjour", "mhoro"],
    numbers: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "hundred", "thousand", "first", "second", "third"],
    body: ["head", "eye", "ear", "nose", "mouth", "hand", "foot", "arm", "leg", "heart", "stomach", "blood", "skin", "hair", "bone"],
    time: ["today", "tomorrow", "yesterday", "morning", "afternoon", "evening", "night", "week", "month", "year", "hour", "minute", "second", "monday", "sunday"],
    place: ["village", "town", "city", "country", "mountain", "river", "lake", "forest", "desert", "sea", "ocean", "road", "house", "home", "market", "school"],
    emotion: ["happy", "sad", "angry", "fear", "love", "hate", "joy", "sorrow", "surprise", "proud", "ashamed", "jealous", "excited", "tired"],
};

const PROFANITY_KEYWORDS = ["fuck", "shit", "bitch", "damn", "asshole", "bastard", "cunt"];
const PII_PATTERNS: RegExp[] = [
    /\b\d{10,}\b/g,                   // long phone numbers
    /\b[\w.-]+@[\w.-]+\.\w+\b/g,      // emails
    /\b\d{3}-\d{2}-\d{4}\b/g,         // US SSN
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // dates
];

function classifyTopic(text: string): { category: string; confidence: number } {
    const lower = text.toLowerCase();
    let best: { category: string; score: number } = { category: "other", score: 0 };
    for (const [category, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        let hits = 0;
        for (const kw of keywords) {
            if (lower.includes(kw)) hits++;
        }
        if (hits > best.score) best = { category, score: hits };
    }
    if (best.score === 0) return { category: "other", confidence: 0.3 };
    // Confidence scales with hit count, capped at 0.95.
    const confidence = Math.min(0.95, 0.5 + best.score * 0.1);
    return { category: best.category, confidence };
}

function piiRisk(text: string): number {
    let maxRisk = 0;
    for (const pattern of PII_PATTERNS) {
        const matches = text.match(pattern);
        if (matches) maxRisk = Math.max(maxRisk, Math.min(1, matches.length * 0.4));
    }
    return maxRisk;
}

function profanityRisk(text: string): number {
    const lower = text.toLowerCase();
    let hits = 0;
    for (const kw of PROFANITY_KEYWORDS) {
        if (lower.includes(kw)) hits++;
    }
    return Math.min(1, hits * 0.5);
}

// 1. Pull a batch of pending document entries.
export const pullCategorizationBatch = internalQuery({
    args: {
        documentId: v.id("changaDocuments"),
        batchSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.batchSize ?? 50;
        const entries = await ctx.db.query("changaDocumentEntries")
            .withIndex("by_document_status", (q) =>
                q.eq("documentId", args.documentId).eq("status", "pending"))
            .take(limit);
        return entries;
    },
});

// 2. Run the offline classifier on a single batch and reschedule if more
//    work remains. This avoids hitting the Convex action timeout for
//    large documents (a 12k-entry dictionary would otherwise run for many
//    minutes in a single invocation). Each call processes up to
//    `CATEGORIZE_BATCH_SIZE` entries and re-queues itself if more pending
//    entries exist for the same document.
const CATEGORIZE_BATCH_SIZE = 200;

export const runOfflineCategorization = internalAction({
    args: {
        documentId: v.id("changaDocuments"),
    },
    handler: async (ctx, args): Promise<{ processed: number; scheduled: boolean }> => {
        const entries = await ctx.runQuery(internal.changa.categorization.pullCategorizationBatch, {
            documentId: args.documentId,
            batchSize: CATEGORIZE_BATCH_SIZE,
        });
        if (entries.length === 0) {
            // No more pending entries — mark the document ready if it was
            // still in `uploading` / `parsing`. Otherwise leave the status
            // alone (it may be `in_review` already).
            await ctx.runMutation(internal.changa.documents.markDocumentCategorized, {
                documentId: args.documentId,
            });
            return { processed: 0, scheduled: false };
        }

        // Echo declared language until we have a real LID model.
        const doc = await ctx.runQuery(internal.changa.categorization.getDocumentLang, {
            documentId: args.documentId,
        });
        const detectedLang = doc?.languageCode;

        for (const entry of entries) {
            const topic = classifyTopic(entry.sourceText + " " + (entry.targetText ?? ""));
            const pii = piiRisk(entry.sourceText + " " + (entry.targetText ?? ""));
            const prof = profanityRisk(entry.sourceText + " " + (entry.targetText ?? ""));
            await ctx.runMutation(internal.changa.documents.applyAutoCategory, {
                entryId: entry._id,
                autoCategory: topic.category as typeof changaAutoCategoryValues[number],
                autoConfidence: topic.confidence,
                detectedLanguage: detectedLang,
                piiRiskScore: pii,
                profanityRiskScore: prof,
                suggestedTarget: entry.targetText ?? `Suggested translation for "${entry.sourceText.slice(0, 40)}..."`,
            });
        }

        // If the batch was full, more pending entries likely remain — reschedule
        // a follow-up call so a 12k-entry document doesn't get stuck.
        if (entries.length >= CATEGORIZE_BATCH_SIZE) {
            await ctx.scheduler.runAfter(0, internal.changa.categorization.runOfflineCategorization, {
                documentId: args.documentId,
            });
            return { processed: entries.length, scheduled: true };
        }

        // Batch wasn't full → this is the last chunk. Mark ready.
        await ctx.runMutation(internal.changa.documents.markDocumentCategorized, {
            documentId: args.documentId,
        });
        return { processed: entries.length, scheduled: false };
    },
});

// Helper query used by the worker to fetch the document's declared language.
export const getDocumentLang = internalQuery({
    args: { documentId: v.id("changaDocuments") },
    handler: async (ctx, args) => {
        const doc = await ctx.db.get(args.documentId);
        return doc ? { languageCode: doc.languageCode } : null;
    },
});

// Public mutation: kicks off the offline categorizer for a document. Called
// by the client immediately after `finalizeDocument` so the user sees
// auto-categories populate in My Documents within seconds.
export const triggerCategorization = mutation({
    args: { documentId: v.id("changaDocuments") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        const doc = await ctx.db.get(args.documentId);
        if (!doc) throw new Error("Document not found");
        if (doc.ownerId !== user._id) {
            throw new Error("Only the document owner can trigger categorization");
        }
        await ctx.scheduler.runAfter(0, internal.changa.categorization.runOfflineCategorization, {
            documentId: args.documentId,
        });
        return { scheduled: true };
    },
});

// Internal action: picks up all documents that have entries still marked
// `pending` (i.e. never categorized) and runs the offline classifier on
// each. Used by the cron entry in convex/crons.ts.
export const categorizeAllPending = internalAction({
    args: { batchSize: v.optional(v.number()) },
    handler: async (ctx, args): Promise<{ processed: number; total: number }> => {
        const limit = args.batchSize ?? 5;
        const docs = await ctx.runQuery(internal.changa.categorization.pickPendingDocuments, { limit });
        let processed = 0;
        for (const doc of docs as Array<{ _id: Id<"changaDocuments"> }>) {
            try {
                await ctx.runAction(internal.changa.categorization.runOfflineCategorization, {
                    documentId: doc._id,
                });
                processed++;
            } catch {
                // Skip and try the next document on the next cron tick.
            }
        }
        return { processed, total: (docs as unknown[]).length };
    },
});

// Internal query: list documents whose first few entries are still pending.
// We keep the per-doc entry check lightweight — a full scan would dominate
// the cron budget, so we rely on the worker to process all entries on a
// single pass per document.
export const pickPendingDocuments = internalQuery({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 5;
        // Documents in `parsing` are the ones that just finished uploading.
        // The first entry's `status` will be `pending` for unprocessed data.
        const docs = await ctx.db.query("changaDocuments")
            .withIndex("by_status", (q) => q.eq("status", "parsing"))
            .take(limit);
        // Also catch any "uploading" docs that have hit `importedEntries ===
        // totalEntries` and are waiting for a status transition to ready.
        const ready = await ctx.db.query("changaDocuments")
            .withIndex("by_status", (q) => q.eq("status", "uploading"))
            .take(limit);
        return [...docs, ...ready].slice(0, limit);
    },
});
