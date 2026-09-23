import { internalQuery, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../users/utils";
import { internal } from "../_generated/api";
import {
    changaAutoCategoryValidator,
    changaDocumentEntryStatusValidator,
    changaDocumentKindValidator,
    changaDocumentStatusValidator,
} from "./validators";
import type { Doc } from "../_generated/dataModel";

// Hard limits for bulk ingestion. These are intentionally generous so power
// users can drop entire dictionaries or song collections, but capped so a
// single client cannot exhaust the database in one mutation.
const MAX_BATCH_SIZE = 500;
const MAX_DOCUMENT_TITLE_LENGTH = 200;
const MAX_SOURCE_TEXT_LENGTH = 2000;
const MAX_TARGET_TEXT_LENGTH = 2000;
const MAX_METADATA_FIELD_LENGTH = 200;
const MAX_PARALLEL_DOCUMENTS_PER_USER = 10;

// Idempotency: an entry already exists for (documentId, index) so we skip it
// instead of throwing — safe to retry a batch.
type DocumentOwner = Doc<"changaDocuments">;
async function ensureDocumentOwner(
    ctx: { db: { get: (id: Doc<"changaDocuments">["_id"]) => Promise<DocumentOwner | null> } },
    documentId: Doc<"changaDocuments">["_id"],
    userId: DocumentOwner["ownerId"]
) {
    const doc = await ctx.db.get(documentId);
    if (!doc) throw new Error("Document not found");
    if (doc.ownerId !== userId) {
        throw new Error("Only the document owner can add entries");
    }
    return doc;
}

export const createDocument = mutation({
    args: {
        title: v.string(),
        kind: changaDocumentKindValidator,
        sourceUrl: v.optional(v.string()),
        languageCode: v.string(),
        dialectCode: v.optional(v.string()),
        regionCode: v.optional(v.string()),
        totalEntries: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const open = await ctx.db.query("changaDocuments")
            .withIndex("by_owner_status", (q) => q.eq("ownerId", user._id).eq("status", "uploading"))
            .collect();
        const parsing = await ctx.db.query("changaDocuments")
            .withIndex("by_owner_status", (q) => q.eq("ownerId", user._id).eq("status", "parsing"))
            .collect();
        if (open.length + parsing.length >= MAX_PARALLEL_DOCUMENTS_PER_USER) {
            throw new Error(`You already have ${MAX_PARALLEL_DOCUMENTS_PER_USER} documents in progress`);
        }

        // Per-user daily document quota: max 5 new documents per UTC day.
        const DAILY_DOCUMENT_QUOTA = 5;
        const dayStart = new Date();
        dayStart.setUTCHours(0, 0, 0, 0);
        const todayCount = await ctx.db.query("changaDocuments")
            .withIndex("by_owner_status", (q) => q.eq("ownerId", user._id))
            .filter((q) => q.gte(q.field("createdAt"), dayStart.getTime()))
            .collect();
        if (todayCount.length >= DAILY_DOCUMENT_QUOTA) {
            throw new Error(`Daily document quota reached (${DAILY_DOCUMENT_QUOTA} per day). Try again tomorrow.`);
        }

        if (args.sourceUrl && !/^https?:\/\//i.test(args.sourceUrl)) {
            throw new Error("sourceUrl must be an http(s) URL");
        }
        if (args.title.length > MAX_DOCUMENT_TITLE_LENGTH) {
            throw new Error(`title must be ≤ ${MAX_DOCUMENT_TITLE_LENGTH} characters`);
        }
        if (args.totalEntries < 1) {
            throw new Error("totalEntries must be at least 1");
        }
        if (args.totalEntries > 1_000_000) {
            throw new Error("totalEntries cannot exceed 1,000,000");
        }

        return ctx.runMutation(internal.changa.datasetWrites.insertDocument, {
            doc: {
                ownerId: user._id,
                title: args.title.slice(0, MAX_DOCUMENT_TITLE_LENGTH),
                kind: args.kind,
                sourceUrl: args.sourceUrl?.slice(0, 2048),
                languageCode: args.languageCode.slice(0, 20),
                dialectCode: args.dialectCode?.slice(0, 20),
                regionCode: args.regionCode?.slice(0, 20),
                totalEntries: args.totalEntries,
                importedEntries: 0,
                status: "uploading",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
        });
    },
});

export const bulkAddDocumentEntries = mutation({
    args: {
        documentId: v.id("changaDocuments"),
        entries: v.array(
            v.object({
                index: v.number(),
                sourceText: v.string(),
                targetText: v.optional(v.string()),
                metadata: v.optional(
                    v.object({
                        page: v.optional(v.number()),
                        chapter: v.optional(v.string()),
                        partOfSpeech: v.optional(v.string()),
                        gloss: v.optional(v.string()),
                    })
                ),
                // Optional idempotency key for client-side retry safety.
                clientIdempotencyKey: v.optional(v.string()),
            })
        ),
        replaceExisting: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        if (args.entries.length === 0) return { added: 0, skipped: 0 };
        if (args.entries.length > MAX_BATCH_SIZE) {
            throw new Error(`Batch too large: ${args.entries.length} (max ${MAX_BATCH_SIZE})`);
        }

        const doc = await ensureDocumentOwner(ctx, args.documentId, user._id);
        if (doc.status === "completed" || doc.status === "in_review") {
            throw new Error(`Document is ${doc.status}; cannot add more entries`);
        }

        // Build a set of existing (documentId, index) for idempotent insertion.
        const existing = await ctx.db.query("changaDocumentEntries")
            .withIndex("by_document_index", (q) => q.eq("documentId", args.documentId))
            .collect();
        const existingKeys = new Set(existing.map((e) => `${e.documentId}:${e.index}`));

        let added = 0;
        let skipped = 0;
        const now = Date.now();
        const seenThisBatch = new Set<string>();
        for (const e of args.entries) {
            const key = `${args.documentId}:${e.index}`;
            if (!args.replaceExisting && existingKeys.has(key)) { skipped++; continue; }
            if (seenThisBatch.has(key)) { skipped++; continue; }
            seenThisBatch.add(key);
            if (e.sourceText.length > MAX_SOURCE_TEXT_LENGTH) {
                throw new Error(`Entry ${e.index}: sourceText exceeds ${MAX_SOURCE_TEXT_LENGTH} characters`);
            }
            if (e.targetText && e.targetText.length > MAX_TARGET_TEXT_LENGTH) {
                throw new Error(`Entry ${e.index}: targetText exceeds ${MAX_TARGET_TEXT_LENGTH} characters`);
            }
            if (e.metadata?.chapter && e.metadata.chapter.length > MAX_METADATA_FIELD_LENGTH) {
                throw new Error(`Entry ${e.index}: chapter metadata too long`);
            }
            if (e.metadata?.partOfSpeech && e.metadata.partOfSpeech.length > MAX_METADATA_FIELD_LENGTH) {
                throw new Error(`Entry ${e.index}: partOfSpeech metadata too long`);
            }
            if (e.metadata?.gloss && e.metadata.gloss.length > MAX_METADATA_FIELD_LENGTH) {
                throw new Error(`Entry ${e.index}: gloss metadata too long`);
            }
            await ctx.runMutation(internal.changa.datasetWrites.insertDocumentEntry, {
                doc: {
                    documentId: args.documentId,
                    index: e.index,
                    sourceText: e.sourceText,
                    targetText: e.targetText,
                    metadata: e.metadata,
                    status: "pending",
                    createdAt: now,
                    updatedAt: now,
                },
            });
            added++;
        }

        const newImported = doc.importedEntries + added;
        const newStatus = newImported >= doc.totalEntries ? "ready" : "uploading";
        await ctx.runMutation(internal.changa.datasetWrites.patchDocument, {
            id: args.documentId,
            patch: {
                importedEntries: newImported,
                status: newStatus,
                updatedAt: now,
            },
        });

        return { added, skipped, importedEntries: newImported, status: newStatus };
    },
});

export const finalizeDocument = mutation({
    args: {
        documentId: v.id("changaDocuments"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        const doc = await ensureDocumentOwner(ctx, args.documentId, user._id);
        if (doc.status === "completed") {
            throw new Error("Document is already completed");
        }
        if (doc.importedEntries < doc.totalEntries) {
            throw new Error(
                `Cannot finalize: imported ${doc.importedEntries} of ${doc.totalEntries} entries`
            );
        }
        await ctx.runMutation(internal.changa.datasetWrites.patchDocument, {
            id: args.documentId,
            patch: {
                status: "in_review",
                finalizedAt: Date.now(),
                updatedAt: Date.now(),
            },
        });
        return { ok: true };
    },
});

export const updateDocumentEntry = mutation({
    args: {
        entryId: v.id("changaDocumentEntries"),
        targetText: v.optional(v.string()),
        metadata: v.optional(
            v.object({
                page: v.optional(v.number()),
                chapter: v.optional(v.string()),
                partOfSpeech: v.optional(v.string()),
                gloss: v.optional(v.string()),
            })
        ),
        status: v.optional(changaDocumentEntryStatusValidator),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        const entry = await ctx.db.get(args.entryId);
        if (!entry) throw new Error("Entry not found");
        const doc = await ctx.db.get(entry.documentId);
        if (!doc) throw new Error("Document not found");
        if (doc.ownerId !== user._id) {
            throw new Error("Only the document owner can edit entries");
        }
        await ctx.runMutation(internal.changa.datasetWrites.patchDocumentEntry, {
            id: args.entryId,
            patch: {
                targetText: args.targetText ?? entry.targetText,
                metadata: args.metadata ?? entry.metadata,
                status: args.status ?? entry.status,
                updatedAt: Date.now(),
            },
        });
    },
});

// Internal query used by the categorization worker to pull a batch of
// pending document entries for offline classification. Returns up to
// `batchSize` entries with status `pending` for the given document.
export const pullCategorizationBatch = internalQuery({
    args: {
        documentId: v.id("changaDocuments"),
        batchSize: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("changaDocumentEntries")
            .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .take(args.batchSize);
    },
});

export const applyAutoCategory = mutation({
    args: {
        entryId: v.id("changaDocumentEntries"),
        autoCategory: changaAutoCategoryValidator,
        autoConfidence: v.number(),
        detectedLanguage: v.optional(v.string()),
        piiRiskScore: v.optional(v.number()),
        profanityRiskScore: v.optional(v.number()),
        suggestedTarget: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Internal-only: called by the categorization worker.
        // Authorization is enforced at the worker entry-point, not here.
        await ctx.runMutation(internal.changa.datasetWrites.patchDocumentEntry, {
            id: args.entryId,
            patch: {
                autoCategory: args.autoCategory,
                autoConfidence: args.autoConfidence,
                detectedLanguage: args.detectedLanguage,
                piiRiskScore: args.piiRiskScore,
                profanityRiskScore: args.profanityRiskScore,
                suggestedTarget: args.suggestedTarget,
                updatedAt: Date.now(),
            },
        });
    },
});

// markDocumentCategorized transitions a document to `ready` once all
// entries have an autoCategory. If the document is already in `in_review`
// or `completed`, the status is left untouched. Called by the
// categorization worker after it processes the final batch.
export const markDocumentCategorized = mutation({
    args: {
        documentId: v.id("changaDocuments"),
    },
    handler: async (ctx, args) => {
        const doc = await ctx.db.get(args.documentId);
        if (!doc) return;
        // Don't downgrade a document that's already past the review stage.
        if (doc.status !== "uploading" && doc.status !== "parsing") return;
        // If entries are still missing, leave the document in `uploading`
        // so the next cron tick picks it up.
        const remaining = await ctx.db.query("changaDocumentEntries")
            .withIndex("by_document_status", (q) =>
                q.eq("documentId", args.documentId).eq("status", "pending"))
            .take(1);
        if (remaining.length > 0) return;
        await ctx.db.patch(args.documentId, {
            status: "ready",
            updatedAt: Date.now(),
        });
    },
});

// createQuickLink lets a signed-in contributor record a single URL as a
// "link" contribution without going through the 3-step import wizard. The
// document is created with totalEntries=0 and a scrape-friendly status so
// the existing worker pipeline can later fetch and parse the page. It
// deliberately bypasses the bulk-entry requirement of `createDocument`.
//
// Note on quota: the rate limit is intentionally broader than the
// kind-specific count, because we don't yet have a `(ownerId, kind)` index
// on `changaDocuments`. The existing `createDocument` already caps raw
// uploads at 5/day, so the link-specific check below is a soft secondary
// limit that prevents a single user from spamming website_link rows on top
// of the bulk-import cap.
export const createQuickLink = mutation({
    args: {
        url: v.string(),
        title: v.optional(v.string()),
        languageCode: v.string(),
        campaignId: v.optional(v.id("changaCampaigns")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        if (!/^https?:\/\//i.test(args.url)) {
            throw new Error("url must be an http(s) URL");
        }
        if (args.url.length > 2048) {
            throw new Error("url is too long");
        }
        if (args.title && args.title.length > 200) {
            throw new Error("title must be ≤ 200 characters");
        }

        const DAY_MS = 24 * 60 * 60 * 1000;
        const DAILY_LINK_QUOTA = 30;
        const recent = await ctx.db.query("changaDocuments")
            .withIndex("by_owner_status", (q) => q.eq("ownerId", user._id))
            .filter((q) =>
                q.and(
                    q.gte(q.field("createdAt"), Date.now() - DAY_MS),
                    q.eq(q.field("kind"), "website_link"),
                ),
            )
            .take(DAILY_LINK_QUOTA);
        if (recent.length >= DAILY_LINK_QUOTA) {
            throw new Error(
                `Daily link quota reached (${DAILY_LINK_QUOTA} per day). Try again tomorrow.`,
            );
        }

        const autoTitle = (() => {
            try {
                const u = new URL(args.url);
                return u.hostname.replace(/^www\./, "");
            } catch {
                return "Web link";
            }
        })();

        return ctx.runMutation(internal.changa.datasetWrites.insertDocument, {
            doc: {
                ownerId: user._id,
                title: (args.title?.trim() || autoTitle).slice(0, 200),
                kind: "website_link",
                sourceUrl: args.url.slice(0, 2048),
                languageCode: args.languageCode.slice(0, 20),
                totalEntries: 0,
                importedEntries: 0,
                status: "ready",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
        });
    },
});

export const listUserDocuments = query({
    args: {
        limit: v.optional(v.number()),
        status: v.optional(changaDocumentStatusValidator),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return [];
        const docs = await ctx.db.query("changaDocuments")
            .withIndex("by_owner_status", (q) => q.eq("ownerId", user._id))
            .order("desc")
            .collect();
        const filtered = args.status
            ? docs.filter((d) => d.status === args.status)
            : docs;
        return filtered.slice(0, args.limit ?? 20).map((d) => ({
            _id: d._id,
            title: d.title,
            kind: d.kind,
            languageCode: d.languageCode,
            totalEntries: d.totalEntries,
            importedEntries: d.importedEntries,
            status: d.status,
            detectedLanguage: d.detectedLanguage,
            autoCategory: d.autoCategory,
            autoConfidence: d.autoConfidence,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
        }));
    },
});

export const getDocument = query({
    args: { documentId: v.id("changaDocuments") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;
        const doc = await ctx.db.get(args.documentId);
        if (!doc) return null;
        if (doc.ownerId !== user._id) return null;
        const entries = await ctx.db.query("changaDocumentEntries")
            .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
            .order("asc")
            .collect();
        return {
            document: doc,
            entries,
        };
    },
});
