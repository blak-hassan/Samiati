import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isModerator } from "../users/utils";
import { getLooseDb, LooseDoc } from "./db";
import {
    changaAutoChecksValidator,
    changaConsentValidator,
    changaLicenseValidator,
    changaSpeakerProfileValidator,
    changaTaskTypeValidator,
} from "./validators";

type SubmissionDoc = LooseDoc & {
    userId?: string;
    updatedAt?: number;
};

function createDefaultConsent() {
    return {
        isGranted: true,
        allowTraining: true,
        allowResearch: true,
        allowPublicAttribution: false,
        grantedAt: Date.now(),
    };
}

// Max input lengths
const MAX_SOURCE_TEXT = 5000;
const MAX_TARGET_TEXT = 5000;
const MAX_TRANSCRIPT_TEXT = 5000;
const MAX_CONTEXT_NOTE = 1000;
const MAX_GLOSS = 500;

export const listUserSubmissions = query({
    args: {
        userId: v.optional(v.id("users")),
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        const targetUserId = args.userId ?? currentUser?._id;
        if (!targetUserId) {
            return [];
        }

        // Non-moderators can only see their own submissions
        if (args.userId && args.userId !== currentUser?._id && !isModerator(currentUser)) {
            throw new Error("Unauthorized: You can only view your own submissions");
        }

        const db = getLooseDb(ctx);

        const submissionsQuery = db.query("changaSubmissions")
            .withIndex("by_user_status", (q: any) => q.eq("userId", targetUserId));

        const submissions = (await submissionsQuery.collect()) as SubmissionDoc[];

        return submissions
            .filter((submission) => !args.status || submission.status === args.status)
            .sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0))
            .slice(0, args.limit ?? 50);
    },
});

// Admin query: list all submissions (moderator only)
export const listAllSubmissions = query({
    args: {
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUser(ctx);
        if (!currentUser || !isModerator(currentUser)) {
            throw new Error("Unauthorized: Only moderators can view all submissions");
        }

        const db = getLooseDb(ctx);
        
        // Use indexed query if status is provided, otherwise use timestamp index with limit
        let submissions;
        if (args.status) {
            submissions = await db.query("changaSubmissions")
                .withIndex("by_language_status", (q: any) => q.eq("status", args.status))
                .collect();
        } else {
            submissions = await db.query("changaSubmissions")
                .order("desc")
                .take(args.limit ?? 50);
        }

        return submissions
            .filter((submission) => !args.status || submission.status === args.status)
            .sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0))
            .slice(0, args.limit ?? 50);
    },
});

export const getSubmission = query({
    args: {
        submissionId: v.id("changaSubmissions"),
    },
    handler: async (ctx, args) => {
        const db = getLooseDb(ctx);
        const submission = await db.get(args.submissionId);
        if (!submission) {
            return null;
        }

        const assetsQuery = db.query("changaSubmissionAssets")
            .withIndex("by_submission", (q: any) => q.eq("submissionId", args.submissionId));
        const assets = await assetsQuery.collect();

        return {
            ...submission,
            assets,
        };
    },
});

export const createDraftSubmission = mutation({
    args: {
        taskId: v.id("changaTasks"),
        submissionType: changaTaskTypeValidator,
        languageCode: v.string(),
        dialectCode: v.optional(v.string()),
        regionCode: v.optional(v.string()),
        sourceText: v.optional(v.string()),
        targetText: v.optional(v.string()),
        transcriptText: v.optional(v.string()),
        contextNote: v.optional(v.string()),
        gloss: v.optional(v.string()),
        partOfSpeech: v.optional(v.string()),
        speakerProfile: v.optional(changaSpeakerProfileValidator),
        consent: v.optional(changaConsentValidator),
        license: v.optional(changaLicenseValidator),
        qualityFlags: v.optional(v.array(v.string())),
        autoChecks: v.optional(changaAutoChecksValidator),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) {
            throw new Error("Unauthorized");
        }

        const db = getLooseDb(ctx);
        return db.insert("changaSubmissions", {
            ...args,
            userId: user._id,
            consent: args.consent ?? createDefaultConsent(),
            license: args.license ?? "community",
            status: "draft",
            updatedAt: Date.now(),
        });
    },
});

export const submitTaskResponse = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
        sourceText: v.optional(v.string()),
        targetText: v.optional(v.string()),
        transcriptText: v.optional(v.string()),
        contextNote: v.optional(v.string()),
        gloss: v.optional(v.string()),
        partOfSpeech: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const db = getLooseDb(ctx);
        const submission = (await db.get(args.submissionId)) as SubmissionDoc | null;
        if (!submission) throw new Error("Submission not found");

        if (submission.userId !== String(user._id)) {
            throw new Error("Unauthorized: You can only update your own submissions");
        }

        await db.patch(args.submissionId, {
            sourceText: args.sourceText?.slice(0, MAX_SOURCE_TEXT),
            targetText: args.targetText?.slice(0, MAX_TARGET_TEXT),
            transcriptText: args.transcriptText?.slice(0, MAX_TRANSCRIPT_TEXT),
            contextNote: args.contextNote?.slice(0, MAX_CONTEXT_NOTE),
            gloss: args.gloss?.slice(0, MAX_GLOSS),
            partOfSpeech: args.partOfSpeech,
            status: "submitted",
            submittedAt: Date.now(),
            updatedAt: Date.now(),
        });
        return args.submissionId;
    },
});

// Simple submission — now requires authentication
export const createSimpleSubmission = mutation({
    args: {
        taskType: changaTaskTypeValidator,
        languageCode: v.string(),
        dialectCode: v.optional(v.string()),
        sourceText: v.optional(v.string()),
        targetText: v.optional(v.string()),
        transcriptText: v.optional(v.string()),
        contextNote: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const db = getLooseDb(ctx);

        // Use indexed query to find open tasks by task type and language
        const tasks = await db.query("changaTasks")
            .withIndex("by_taskType_status", (q: any) => 
                q.eq("taskType", args.taskType).eq("status", "open")
            )
            .collect();
        
        // Filter by language in memory (small result set)
        const matchingTask = tasks.find(t => t.languageCode === args.languageCode);
        let taskId = matchingTask?._id || tasks[0]?._id;

        if (!taskId) {
            taskId = await db.insert("changaTasks", {
                taskType: args.taskType,
                languageCode: args.languageCode,
                priority: "normal",
                status: "open",
                targetSubmissionCount: 100,
                targetValidationCount: 3,
                createdAt: Date.now(),
            });
        }

        const submissionId = await db.insert("changaSubmissions", {
            taskId,
            userId: user._id,
            submissionType: args.taskType,
            languageCode: args.languageCode,
            sourceText: args.sourceText?.slice(0, MAX_SOURCE_TEXT),
            targetText: args.targetText?.slice(0, MAX_TARGET_TEXT),
            transcriptText: args.transcriptText?.slice(0, MAX_TRANSCRIPT_TEXT),
            contextNote: args.contextNote?.slice(0, MAX_CONTEXT_NOTE),
            consent: createDefaultConsent(),
            license: "community",
            status: "submitted",
            submittedAt: Date.now(),
            updatedAt: Date.now(),
        });

        return submissionId;
    },
});

export const attachSubmissionAsset = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
        storageId: v.string(),
        assetType: v.union(v.literal("audio"), v.literal("image")),
        mimeType: v.string(),
        durationMs: v.optional(v.number()),
        sampleRate: v.optional(v.number()),
        channels: v.optional(v.number()),
        sizeBytes: v.optional(v.number()),
        waveformPreview: v.optional(v.string()),
        asrText: v.optional(v.string()),
        asrConfidence: v.optional(v.number()),
        snrScore: v.optional(v.number()),
        clippingScore: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) {
            throw new Error("Unauthorized");
        }

        const db = getLooseDb(ctx);
        const submission = (await db.get(args.submissionId)) as SubmissionDoc | null;
        if (!submission) {
            throw new Error("Submission not found");
        }

        if (submission.userId !== String(user._id)) {
            throw new Error("Unauthorized");
        }

        const assetId = await db.insert("changaSubmissionAssets", {
            ...args,
            createdAt: Date.now(),
        });

        await db.patch(args.submissionId, {
            updatedAt: Date.now(),
        });

        return assetId;
    },
});

export const runAutoChecks = mutation({
    args: {
        submissionId: v.id("changaSubmissions"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) {
            throw new Error("Unauthorized");
        }

        const db = getLooseDb(ctx);
        const submission = (await db.get(args.submissionId)) as SubmissionDoc | null;
        if (!submission) {
            throw new Error("Submission not found");
        }

        const assetsQuery = db.query("changaSubmissionAssets")
            .withIndex("by_submission", (q: any) => q.eq("submissionId", args.submissionId));
        const allAssets = await assetsQuery.collect();
        const audioAsset = allAssets.find((asset: any) => asset.assetType === "audio");

        const qualityFlags: string[] = [];
        let autoCheckResult: {
            duplicateScore?: number;
            languageConfidence?: number;
            transcriptionConfidence?: number;
            piiRiskScore?: number;
            profanityRiskScore?: number;
            audioQualityScore?: number;
            passed?: boolean;
        } = {};

        if (audioAsset?.asrText && audioAsset?.transcriptText && audioAsset.transcriptText && audioAsset.asrText) {
            const similarity = calculateTextSimilarity(
                String(audioAsset.transcriptText),
                String(audioAsset.asrText),
            );
            autoCheckResult.transcriptionConfidence = similarity;
            autoCheckResult.passed = similarity > 0.7;
            if (similarity < 0.5) {
                qualityFlags.push("low_transcription_confidence");
            }
        }

        const snrScore = audioAsset?.snrScore;
        if (snrScore !== undefined && snrScore !== null && typeof snrScore === 'number') {
            autoCheckResult.audioQualityScore = snrScore;
            if (snrScore < 10) {
                qualityFlags.push("low_audio_quality");
            }
        }

        const sourceText = submission?.sourceText;
        const targetText = submission?.targetText;
        if (sourceText && targetText) {
            const sourceDuplicate = await findDuplicateText(db, sourceText, String(args.submissionId));
            const targetDuplicate = await findDuplicateText(db, targetText, String(args.submissionId));
            autoCheckResult.duplicateScore = Math.max(sourceDuplicate, targetDuplicate);
            if (autoCheckResult.duplicateScore > 0.8) {
                qualityFlags.push("potential_duplicate");
            }
        }

        await db.patch(args.submissionId, {
            qualityFlags,
            autoChecks: autoCheckResult,
            updatedAt: Date.now(),
        });

        return { qualityFlags, autoChecks: autoCheckResult };
    },
});

function calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = [...words1].filter((w) => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;
    return union > 0 ? intersection / union : 0;
}

async function findDuplicateText(
    _db: ReturnType<typeof getLooseDb>,
    text: string,
    excludeId: string,
): Promise<number> {
    if (!text) return 0;
    const submissions = (await _db.query("changaSubmissions")
        .order("desc")
        .take(200)) as SubmissionDoc[];
    let maxSimilarity = 0;
    for (const sub of submissions) {
        if (String(sub._id) === String(excludeId)) continue;
        const similarity = calculateTextSimilarity(text, sub.sourceText || sub.targetText || "");
        if (similarity > maxSimilarity) maxSimilarity = similarity;
    }
    return maxSimilarity;
}
