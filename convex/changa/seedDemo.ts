import { internalMutation, internalQuery, mutation } from "../_generated/server";
import { getCurrentUser, isModerator } from "../users/utils";
import { internal } from "../_generated/api";
import { chokepoint } from "../lib/chokepoint";
import { FALLBACK_CONSENT_POLICY_VERSION } from "./consent";
import type { Doc, Id } from "../_generated/dataModel";

// Seed realistic demo data for the Changa section (campaigns, tasks,
// submissions across the whole pipeline, validation votes, curated
// examples, contributor stats) so every feature can be exercised
// end-to-end on a dev deployment.
//
// Run via: npx convex run changa.seedDemo:seedDemoData
//   (or: npm run seed:changa)
// Idempotent: re-running the seed is a no-op once the demo campaign
// ("Kiswahili Phrase Harvest") exists.

type UserDoc = Doc<"users">;

// ---------------------------------------------------------------------------
// Demo contributors. Fictional accounts (no Clerk identities) that own the
// seeded submissions/votes so the peer-review queue has realistic content
// for real signed-in reviewers.
// ---------------------------------------------------------------------------

const DEMO_USERS = [
    {
        clerkId: "demo-seed-wanjiku",
        name: "Wanjiku Mwangi",
        avatar: "",
        role: "member",
    },
    {
        clerkId: "demo-seed-otieno",
        name: "Otieno Ochieng",
        avatar: "",
        role: "member",
    },
    {
        clerkId: "demo-seed-amina",
        name: "Amina Hassan",
        avatar: "",
        role: "member",
    },
] as const;

// ---------------------------------------------------------------------------
// Campaign + task content. All content mirrors what real contributors would
// see so the UI (task labels, progress bars, empty states) renders exactly
// as it would in production.
// ---------------------------------------------------------------------------

const DEMO_CAMPAIGNS = [
    {
        title: "Kiswahili Phrase Harvest",
        description:
            "Collect everyday Kiswahili phrases and their translations to power natural, human-sounding translations.",
        languageCode: "sw",
        taskTypes: ["phrase_translation", "lexicon_entry"] as const,
        goalCount: 1000,
        currentCount: 412,
    },
    {
        title: "Kikuyu Lexicon Sprint",
        description:
            "Build the first community-reviewed Gikuyu word list. Every entry is checked by two peer reviewers before curation.",
        languageCode: "ki",
        taskTypes: ["lexicon_entry"] as const,
        goalCount: 300,
        currentCount: 64,
    },
    {
        title: "Dholuo Stories on Record",
        description:
            "Record short Dholuo stories and conversations in your natural voice to train speech models for Luo speakers.",
        languageCode: "luo",
        taskTypes: ["transcription", "audio_reading"] as const,
        goalCount: 200,
        currentCount: 178,
    },
    {
        title: "Sheng Slang of the Week",
        description:
            "A weekly sprint for the newest Sheng coinages before they go stale. Fast tasks, quick review.",
        languageCode: "sheng",
        taskTypes: ["lexicon_entry", "cultural_context"] as const,
        goalCount: 50,
        currentCount: 47,
    },
] as const;

const DEMO_TASKS = [
    // --- Sheng phrase translation ---
    { taskType: "phrase_translation", languageCode: "sheng", campaign: "Sheng Slang of the Week", prompt: "Good morning, my friend.", domain: "everyday_conversation", difficulty: "beginner", priority: "high" },
    { taskType: "phrase_translation", languageCode: "sheng", campaign: "Sheng Slang of the Week", prompt: "See you later.", domain: "everyday_conversation", difficulty: "beginner", priority: "normal" },
    { taskType: "phrase_translation", languageCode: "sheng", campaign: "Sheng Slang of the Week", prompt: "I'm broke, bro.", domain: "technology_finance", difficulty: "beginner", priority: "normal" },
    { taskType: "phrase_translation", languageCode: "sheng", campaign: "Sheng Slang of the Week", prompt: "How much is it?", domain: "questions_commands", difficulty: "beginner", priority: "normal" },
    { taskType: "phrase_translation", languageCode: "sheng", campaign: "Sheng Slang of the Week", prompt: "Let's go to town.", domain: "everyday_conversation", difficulty: "beginner", priority: "low" },

    // --- Sheng lexicon entries (freeform) ---
    { taskType: "lexicon_entry", languageCode: "sheng", campaign: "Sheng Slang of the Week", prompt: "Slang for a sharply dressed person", domain: "other", difficulty: "intermediate", priority: "normal" },
    { taskType: "lexicon_entry", languageCode: "sheng", campaign: "Sheng Slang of the Week", prompt: "Slang for cheap street snacks", domain: "other", difficulty: "intermediate", priority: "normal" },
    { taskType: "lexicon_entry", languageCode: "sheng", campaign: "Sheng Slang of the Week", prompt: "Slang for the police", domain: "other", difficulty: "intermediate", priority: "high" },

    // --- Sheng cultural context ---
    { taskType: "cultural_context", languageCode: "sheng", campaign: "Sheng Slang of the Week", prompt: "Explain what 'ushamba' means and when it is used.", domain: "cultural_idioms", difficulty: "advanced", priority: "normal" },
    { taskType: "cultural_context", languageCode: "sheng", campaign: "Sheng Slang of the Week", prompt: "What does 'cheki' mean in Nairobi slang?", domain: "cultural_idioms", difficulty: "intermediate", priority: "normal" },

    // --- Kiswahili phrase translation ---
    { taskType: "phrase_translation", languageCode: "sw", campaign: "Kiswahili Phrase Harvest", prompt: "Good morning", domain: "greeting", difficulty: "beginner", priority: "high" },
    { taskType: "phrase_translation", languageCode: "sw", campaign: "Kiswahili Phrase Harvest", prompt: "Thank you very much", domain: "everyday_conversation", difficulty: "beginner", priority: "normal" },
    { taskType: "phrase_translation", languageCode: "sw", campaign: "Kiswahili Phrase Harvest", prompt: "Where is the market?", domain: "questions_commands", difficulty: "beginner", priority: "normal" },
    { taskType: "phrase_translation", languageCode: "sw", campaign: "Kiswahili Phrase Harvest", prompt: "I am learning Kiswahili", domain: "work_education", difficulty: "beginner", priority: "normal" },
    { taskType: "phrase_translation", languageCode: "sw", campaign: "Kiswahili Phrase Harvest", prompt: "How is your family?", domain: "everyday_conversation", difficulty: "beginner", priority: "normal" },
    { taskType: "phrase_translation", languageCode: "sw", campaign: "Kiswahili Phrase Harvest", prompt: "The food is delicious", domain: "everyday_conversation", difficulty: "beginner", priority: "low" },
    { taskType: "phrase_translation", languageCode: "sw", campaign: "Kiswahili Phrase Harvest", prompt: "Welcome, please sit down", domain: "greeting", difficulty: "beginner", priority: "low" },
    { taskType: "phrase_translation", languageCode: "sw", campaign: "Kiswahili Phrase Harvest", prompt: "Safe travels", domain: "everyday_conversation", difficulty: "beginner", priority: "low" },

    // --- Kikuyu lexicon entries ---
    { taskType: "lexicon_entry", languageCode: "ki", campaign: "Kikuyu Lexicon Sprint", prompt: "mother (noun)", domain: "kinship", difficulty: "beginner", priority: "high" },
    { taskType: "lexicon_entry", languageCode: "ki", campaign: "Kikuyu Lexicon Sprint", prompt: "gratitude (noun)", domain: "emotion", difficulty: "beginner", priority: "normal" },
    { taskType: "lexicon_entry", languageCode: "ki", campaign: "Kikuyu Lexicon Sprint", prompt: "harvest (noun)", domain: "agriculture", difficulty: "intermediate", priority: "normal" },
    { taskType: "lexicon_entry", languageCode: "ki", campaign: "Kikuyu Lexicon Sprint", prompt: "rain (noun)", domain: "weather", difficulty: "beginner", priority: "normal" },
    { taskType: "lexicon_entry", languageCode: "ki", campaign: "Kikuyu Lexicon Sprint", prompt: "elder (noun)", domain: "ritual", difficulty: "intermediate", priority: "low" },
] as const;

// Submissions attached to dedicated tasks: one submission per pipeline status
// so the review queue, activity history, and curation dashboard all have
// realistic content.
const DEMO_SUBMISSION_TASKS = [
    { key: "t1", taskType: "sentence_translation", languageCode: "sheng", prompt: "Where are you going?" },
    { key: "t2", taskType: "sentence_translation", languageCode: "sheng", prompt: "How are you doing?" },
    { key: "t3", taskType: "sentence_translation", languageCode: "sheng", prompt: "The traffic is terrible today." },
    { key: "t4", taskType: "phrase_translation", languageCode: "sw", prompt: "Good morning" },
    { key: "t5", taskType: "lexicon_entry", languageCode: "sheng", prompt: "Slang for the police" },
    { key: "t6", taskType: "phrase_translation", languageCode: "sheng", prompt: "I'm broke, bro." },
] as const;

const DEMO_CONSENT = {
    isGranted: true,
    allowTraining: true,
    allowResearch: true,
    allowPublicAttribution: false,
    grantedAt: Date.now(),
};

// ---------------------------------------------------------------------------
// Additional mock data for the full Changa pipeline. These feed the consent,
// processing, task-claim, dataset-release, evaluation, role-grant, invite,
// campaign-proposal, moderation-decision, and bulk-document features so every
// screen and mutation can be exercised end-to-end.
// ---------------------------------------------------------------------------

const DEMO_CONSENT_POLICY_TEXT = `Samiati Changa Contribution Policy (Pilot v1)

1. What you contribute
   By submitting a contribution you confirm that, to the best of your knowledge,
   the text or recording genuinely represents natural usage of the language and
   does not intentionally include hate speech, personal data about others, or
   copyrighted material you do not have the right to share.

2. How your data is used
   - collection_storage — your contribution is stored so it can be reviewed and curated.
   - training — your contribution may be used to improve Samiati's language models.
   - research — anonymised contributions may be studied to better understand
     African languages. Your name is never attached.

3. Your rights
   You may request that a contribution be withdrawn at any time. Withdrawing does
   not retroactively remove data already released to a dataset, but no future use
   will reference the withdrawn item.

4. Attribution
   By default, your contributions are attributed pseudonymously in dataset
   metadata. You may opt into public attribution, or opt out entirely (private).

Effective date: 2025-01-01 (pilot)`;

const DEMO_CONSENT_POLICY_SUMMARY =
    "Contributions are stored with your consent and used to improve Samiati's language models and research, never with your name attached.";

// Invites: realistic referral data with some clicks and conversions.
const DEMO_INVITES: Array<{
    code: string;
    channel: string;
    daysAgo: number;
    daysClicked: number | null;
    daysConverted: number | null;
}> = [
    { code: "changa_demo_wanjiku_001", channel: "whatsapp", daysAgo: 8, daysClicked: 6, daysConverted: 5 },
    { code: "changa_demo_wanjiku_002", channel: "twitter", daysAgo: 7, daysClicked: 7, daysConverted: null },
    { code: "changa_demo_otieno_001", channel: "sms", daysAgo: 6, daysClicked: 6, daysConverted: 4 },
    { code: "changa_demo_otieno_002", channel: "clipboard", daysAgo: 4, daysClicked: null, daysConverted: null },
    { code: "changa_demo_amina_001", channel: "whatsapp", daysAgo: 3, daysClicked: 3, daysConverted: 2 },
];

// Campaign proposals in various review states.
const DEMO_PROPOSALS = [
    {
        title: "Gikuyu Oral History Dictation",
        description: "Collect audio recordings of elder Gikuyu speakers telling folktales in their own dialect.",
        languageCode: "ki",
        taskTypes: ["audio_reading" as const],
        goalCount: 200,
        rationale: "Elder speakers are underrepresented in written Gikuyu datasets.",
        status: "pending" as const,
    },
    {
        title: "Dholuo Proverb Translation",
        description: "Translate traditional Dholuo proverbs into English for bilingual education materials.",
        languageCode: "luo",
        taskTypes: ["sentence_translation" as const],
        goalCount: 150,
        rationale: "Dholuo proverb corpora are essential for cultural NLP projects.",
        status: "approved" as const,
    },
    {
        title: "Luo Music Lyrics Collection",
        description: "Transcribe traditional Luo songs for preservation and linguistic analysis.",
        languageCode: "luo",
        taskTypes: ["transcription" as const, "audio_reading" as const],
        goalCount: 80,
        rationale: "Song lyrics capture melodic intonation patterns unique to the language.",
        status: "rejected" as const,
        reviewNote: "Scope overlaps with existing 'Dholuo Stories on Record' campaign. Please merge.",
    },
] as const;

// A small dictionary document for each language so the document-ingestion
// screen has realistic data.
const DEMO_DOCUMENTS = [
    {
        ownerClerkId: "demo-seed-wanjiku",
        title: "Swahili–Sheng Mini Dictionary",
        kind: "dictionary" as const,
        languageCode: "sheng",
        entries: [
            { index: 0, sourceText: "good morning", targetText: "Asubuhi njema", metadata: { partOfSpeech: "greeting", gloss: "morning greeting" } },
            { index: 1, sourceText: "thank you", targetText: "Asante", metadata: { partOfSpeech: "greeting", gloss: "gratitude expression" } },
            { index: 2, sourceText: "friend", targetText: "Rafiki", metadata: { partOfSpeech: "noun", gloss: "close acquaintance" } },
            { index: 3, sourceText: "money", targetText: "Pesa", metadata: { partOfSpeech: "noun", gloss: "currency unit" } },
            { index: 4, sourceText: "food", targetText: "Chakula", metadata: { partOfSpeech: "noun", gloss: "nourishment" } },
        ],
    },
    {
        ownerClerkId: "demo-seed-amina",
        title: "Gikuyu Household Vocabulary",
        kind: "dictionary" as const,
        languageCode: "ki",
        entries: [
            { index: 0, sourceText: "mother", targetText: "Màa", metadata: { partOfSpeech: "noun", gloss: "female parent" } },
            { index: 1, sourceText: "father", targetText: "Bàa", metadata: { partOfSpeech: "noun", gloss: "male parent" } },
            { index: 2, sourceText: "water", targetText: "Mai", metadata: { partOfSpeech: "noun", gloss: "drinking water" } },
            { index: 3, sourceText: "fire", targetText: "Miti", metadata: { partOfSpeech: "noun", gloss: "combustion" } },
            { index: 4, sourceText: "rain", targetText: "Mĩcēerĩ", metadata: { partOfSpeech: "noun", gloss: "precipitation" } },
        ],
    },
] as const;

// Extra submission tasks + submissions to enrich the validation queue and
// give the activity feed more variety across pipeline stages.
const DEMO_EXTRA_SUBMISSION_TASKS = [
    { key: "et1", taskType: "phrase_translation", languageCode: "sw", prompt: "See you tomorrow" },
    { key: "et2", taskType: "sentence_translation", languageCode: "sheng", prompt: "Where is the nearest matatu stage?" },
    { key: "et3", taskType: "phrase_translation", languageCode: "sw", prompt: "Thank you very much" },
] as const;

interface ExtraSubmissionSpec {
    key: string;
    author: string;
    targetText: string;
    sourceText: string;
    status: "validated" | "in_validation" | "needs_fix" | "submitted";
    submittedAtOffset: number;
}

const DEMO_EXTRA_SUBMISSIONS: ExtraSubmissionSpec[] = [
    { key: "et1", author: "demo-seed-amina", targetText: "Tutaonana kesho", sourceText: "See you tomorrow", status: "validated", submittedAtOffset: 5 },
    { key: "et2", author: "demo-seed-otieno", targetText: "Huko ni wapi kipande cha matatu ya karibu?", sourceText: "Where is the nearest matatu stage?", status: "in_validation", submittedAtOffset: 3 },
    { key: "et3", author: "demo-seed-wanjiku", targetText: "Asante sana", sourceText: "Thank you very much", status: "needs_fix", submittedAtOffset: 4 },
];

interface ExtraVoteSpec {
    submissionTaskKey: string;
    validator: string;
    vote: "accept" | "minor_fix" | "reject" | "duplicate" | "unsafe" | "unclear_audio" | "wrong_language";
    confidence: number;
    comment?: string;
    issueCodes?: string[];
}

const DEMO_EXTRA_VOTES: ExtraVoteSpec[] = [
    { submissionTaskKey: "et1", validator: "demo-seed-wanjiku", vote: "accept", confidence: 94 },
    { submissionTaskKey: "et2", validator: "demo-seed-amina", vote: "accept", confidence: 88 },
    { submissionTaskKey: "et2", validator: "demo-seed-wanjiku", vote: "accept", confidence: 91, comment: "Natural Sheng but could use a context note." },
    { submissionTaskKey: "et3", validator: "demo-seed-otieno", vote: "minor_fix", confidence: 70, issueCodes: ["needs_context"], comment: "Good translation but missing a context example." },
];

function findDemoUser(users: UserDoc[], clerkId: string): UserDoc {
    const user = users.find((u) => u.clerkId === clerkId);
    if (!user) throw new Error(`seedDemo: missing demo user ${clerkId}`);
    return user;
}

export const seedDemoData = internalMutation({
    args: {},
    handler: async (ctx) => {
        // Idempotency marker: the first demo campaign doubles as the "already
        // seeded" signal so re-runs never duplicate content.
        const marker = await ctx.db
            .query("changaCampaigns")
            .withIndex("by_language_status", (q) =>
                q.eq("languageCode", "sw").eq("status", "active"),
            )
            .first();
        if (marker) {
            return { alreadySeeded: true as const };
        }

        // 0. Make sure the base Sheng seed exists (templates + campaign +
        //    sentence/audio tasks). seedShengData is itself idempotent.
        await ctx.runMutation(internal.changa.seedSheng.seedShengData, {});

        // 1. Demo contributor accounts (authors of the seeded content).
        const allUsers = await ctx.db.query("users").collect();
        for (const demo of DEMO_USERS) {
            const existing = allUsers.find((u) => u.clerkId === demo.clerkId);
            if (!existing) {
                await ctx.db.insert("users", {
                    name: demo.name,
                    avatar: demo.avatar,
                    isGuest: false,
                    clerkId: demo.clerkId,
                    role: demo.role,
                });
            }
        }
        const refreshed = await ctx.db.query("users").collect();
        const wanjiku = findDemoUser(refreshed, "demo-seed-wanjiku");
        const otieno = findDemoUser(refreshed, "demo-seed-otieno");
        const amina = findDemoUser(refreshed, "demo-seed-amina");

        // System user for audit trails (same convention as seedSheng).
        const systemUser: Id<"users"> = wanjiku._id;
        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;

        // 2. Bump the Sheng campaign progress so the progress bar has data.
        const shengCampaign = await ctx.db
            .query("changaCampaigns")
            .withIndex("by_language_status", (q) =>
                q.eq("languageCode", "sheng").eq("status", "active"),
            )
            .first();
        if (shengCampaign && shengCampaign.currentCount === 0) {
            await chokepoint.patchCampaign(ctx, shengCampaign._id, {
                currentCount: 187,
            });
        }

        // 3. Extra task templates (skip ones that already exist).
        async function ensureTemplate(
            name: string,
            doc: Record<string, unknown>,
        ): Promise<Id<"changaTaskTemplates">> {
            const existing = await ctx.db
                .query("changaTaskTemplates")
                .withIndex("by_taskType", (q) =>
                    q.eq("taskType", doc.taskType as Doc<"changaTaskTemplates">["taskType"]),
                )
                .collect();
            const match = existing.find((t) => t.name === name);
            if (match) return match._id;
            return chokepoint.insertTaskTemplate(ctx, {
                ...doc,
                name,
                templateVersion: 1,
                isActive: true,
                createdBy: systemUser,
                createdAt: now,
            });
        }

        const phraseTemplate = await ensureTemplate("Sheng Phrase Translation (demo)", {
            taskType: "phrase_translation",
            instructions:
                "Write the natural Sheng equivalent of the English phrase. Use the wording a real Nairobi speaker would use — not school Swahili.",
            sourceMode: "prompted",
            inputSchema: [
                { id: "sourceText", label: "English phrase", inputType: "text", required: true },
            ],
            outputSchema: [
                { id: "targetText", label: "Sheng translation", inputType: "text", required: true },
            ],
            requiresAudio: false,
            requiresTranslation: true,
            requiresValidationCount: 2,
            riskTier: "low",
            destinationDataProduct: "sheng_translation_pairs",
            requiredConsentScopes: ["collection_storage", "training", "research"],
        });

        const lexiconTemplate = await ensureTemplate("Sheng Lexicon Entry (demo)", {
            taskType: "lexicon_entry",
            instructions:
                "Add the Sheng word or phrase for the concept below, plus a short gloss and an example sentence if you can.",
            sourceMode: "freeform",
            inputSchema: [
                { id: "targetText", label: "Sheng word or phrase", inputType: "text", required: true },
                { id: "gloss", label: "What it means", inputType: "text", required: false },
                { id: "contextNote", label: "Example sentence / context", inputType: "textarea", required: false },
            ],
            outputSchema: [],
            requiresAudio: false,
            requiresTranslation: false,
            requiresValidationCount: 2,
            riskTier: "low",
            destinationDataProduct: "sheng_lexicon",
            requiredConsentScopes: ["collection_storage", "training"],
        });

        const culturalTemplate = await ensureTemplate("Sheng Cultural Context (demo)", {
            taskType: "cultural_context",
            instructions:
                "Explain the meaning, register, and typical usage of the Sheng expression below. Where would you hear it? Who says it?",
            sourceMode: "prompted",
            inputSchema: [
                { id: "sourceText", label: "Expression", inputType: "text", required: true },
            ],
            outputSchema: [
                { id: "targetText", label: "Explanation", inputType: "textarea", required: true },
            ],
            requiresAudio: false,
            requiresTranslation: true,
            requiresValidationCount: 2,
            riskTier: "low",
            destinationDataProduct: "sheng_cultural_notes",
            requiredConsentScopes: ["collection_storage", "training", "research"],
        });

        const kiswahiliTemplate = await ensureTemplate("Kiswahili Phrase Translation", {
            taskType: "phrase_translation",
            instructions:
                "Write the natural Kiswahili equivalent of the English phrase, the way it is actually spoken.",
            sourceMode: "prompted",
            inputSchema: [
                { id: "sourceText", label: "English phrase", inputType: "text", required: true },
            ],
            outputSchema: [
                { id: "targetText", label: "Kiswahili translation", inputType: "text", required: true },
            ],
            requiresAudio: false,
            requiresTranslation: true,
            requiresValidationCount: 2,
            riskTier: "low",
            destinationDataProduct: "kiswahili_translation_pairs",
            requiredConsentScopes: ["collection_storage", "training", "research"],
        });

        const kikuyuLexiconTemplate = await ensureTemplate("Kikuyu Lexicon Entry", {
            taskType: "lexicon_entry",
            instructions:
                "Add the Gikuyu word for the concept below, with a short gloss. Peer reviewers check every entry.",
            sourceMode: "freeform",
            inputSchema: [
                { id: "targetText", label: "Gikuyu word", inputType: "text", required: true },
                { id: "gloss", label: "What it means", inputType: "text", required: false },
            ],
            outputSchema: [],
            requiresAudio: false,
            requiresTranslation: false,
            requiresValidationCount: 2,
            riskTier: "low",
            destinationDataProduct: "kikuyu_lexicon",
            requiredConsentScopes: ["collection_storage", "training"],
        });

        // 4. Campaigns.
        const campaignIds: Record<string, Id<"changaCampaigns">> = {};
        for (const campaign of DEMO_CAMPAIGNS) {
            campaignIds[campaign.title] = await chokepoint.insertCampaign(ctx, {
                title: campaign.title,
                description: campaign.description,
                languageCode: campaign.languageCode,
                taskTypes: [...campaign.taskTypes],
                goalCount: campaign.goalCount,
                currentCount: campaign.currentCount,
                startAt: now - 21 * DAY,
                status: "active",
                createdBy: systemUser,
                createdAt: now,
            });
        }

        // 5. Open tasks with realistic prompts.
        for (const task of DEMO_TASKS) {
            const template =
                task.languageCode === "sheng"
                    ? task.taskType === "lexicon_entry"
                        ? lexiconTemplate
                        : task.taskType === "cultural_context"
                          ? culturalTemplate
                          : phraseTemplate
                    : task.languageCode === "sw"
                      ? kiswahiliTemplate
                      : kikuyuLexiconTemplate;

            await chokepoint.insertTask(ctx, {
                templateId: template,
                templateVersion: 1,
                campaignId: campaignIds[task.campaign],
                taskType: task.taskType,
                languageCode: task.languageCode,
                domain: task.domain,
                difficulty: task.difficulty,
                promptSourceText: task.prompt,
                priority: task.priority,
                status: "open",
                targetSubmissionCount: 5,
                targetValidationCount: 2,
                createdBy: systemUser,
                createdAt: now,
            });
        }

        // 6. Dedicated tasks + submissions spanning the whole pipeline.
        const submissionTaskIds: Record<string, Id<"changaTasks">> = {};
        for (const spec of DEMO_SUBMISSION_TASKS) {
            const template =
                spec.languageCode === "sw"
                    ? kiswahiliTemplate
                    : spec.taskType === "lexicon_entry"
                      ? lexiconTemplate
                      : phraseTemplate;
            submissionTaskIds[spec.key] = await chokepoint.insertTask(ctx, {
                templateId: template,
                templateVersion: 1,
                campaignId: campaignIds[
                    spec.languageCode === "sw"
                        ? "Kiswahili Phrase Harvest"
                        : "Sheng Slang of the Week"
                ],
                taskType: spec.taskType,
                languageCode: spec.languageCode,
                promptSourceText: spec.prompt,
                priority: "normal",
                status: "open",
                targetSubmissionCount: 5,
                targetValidationCount: 2,
                createdBy: systemUser,
                createdAt: now,
            });
        }

        async function insertSubmission(params: {
            key: string;
            author: Id<"users">;
            submissionType: string;
            languageCode: string;
            sourceText: string;
            targetText: string;
            gloss?: string;
            contextNote?: string;
            status: "submitted" | "in_validation" | "validated" | "rejected" | "curated";
            submittedAt: number;
        }): Promise<Id<"changaSubmissions">> {
            const submissionId = await chokepoint.insertSubmission(ctx, {
                taskId: submissionTaskIds[params.key],
                userId: params.author,
                submissionType: params.submissionType,
                languageCode: params.languageCode,
                sourceText: params.sourceText,
                targetText: params.targetText,
                gloss: params.gloss,
                contextNote: params.contextNote,
                consent: DEMO_CONSENT,
                consentPolicyVersion: FALLBACK_CONSENT_POLICY_VERSION,
                license: "community",
                status: params.status,
                submittedAt: params.submittedAt,
                updatedAt: params.submittedAt,
            });
            await chokepoint.insertConsentRecord(ctx, {
                userId: params.author,
                submissionId,
                policyVersion: FALLBACK_CONSENT_POLICY_VERSION,
                scopes: ["collection_storage", "training", "research"],
                attributionPreference: "pseudonymous",
                grantedAt: params.submittedAt,
            });
            return submissionId;
        }

        // t1 — accepted and promoted to a curated (gold) example.
        const sub1 = await insertSubmission({
            key: "t1",
            author: wanjiku._id,
            submissionType: "sentence_translation",
            languageCode: "sheng",
            sourceText: "Where are you going?",
            targetText: "Unakwenda wapi?",
            contextNote: "Common greeting-time question between friends.",
            status: "validated",
            submittedAt: now - 9 * DAY,
        });
        const curatedId = await chokepoint.insertCuratedExample(ctx, {
            sourceSubmissionId: sub1,
            exampleType: "parallel_text",
            languageCode: "sheng",
            sourceText: "Where are you going?",
            targetText: "Unakwenda wapi?",
            contextText: "Common greeting-time question between friends.",
            qualityScore: 0.92,
            reviewSummary: "Natural Sheng phrasing; two peer accepts, no flags.",
            splitRecommendation: "train",
            releaseStatus: "approved",
            createdAt: now - 8 * DAY,
        });
        await chokepoint.patchSubmission(ctx, sub1, {
            status: "curated",
            curatedExampleId: curatedId,
            updatedAt: now - 8 * DAY,
        });

        // t2 — validated by two peers.
        const sub2 = await insertSubmission({
            key: "t2",
            author: otieno._id,
            submissionType: "sentence_translation",
            languageCode: "sheng",
            sourceText: "How are you doing?",
            targetText: "Mambo vipi?",
            status: "validated",
            submittedAt: now - 6 * DAY,
        });

        // t3 — in peer review, one vote so far.
        const sub3 = await insertSubmission({
            key: "t3",
            author: amina._id,
            submissionType: "sentence_translation",
            languageCode: "sheng",
            sourceText: "The traffic is terrible today.",
            targetText: "Traffiki ni mbaya leo, ni shida.",
            status: "in_validation",
            submittedAt: now - 2 * DAY,
        });

        // t4 — in peer review, no votes yet.
        const sub4 = await insertSubmission({
            key: "t4",
            author: wanjiku._id,
            submissionType: "phrase_translation",
            languageCode: "sw",
            sourceText: "Good morning",
            targetText: "Habari za asubuhi",
            status: "in_validation",
            submittedAt: now - 1 * DAY,
        });

        // t5 — rejected with a review note.
        const sub5 = await insertSubmission({
            key: "t5",
            author: otieno._id,
            submissionType: "lexicon_entry",
            languageCode: "sheng",
            sourceText: "Slang for the police",
            targetText: "karao",
            gloss: "the police",
            status: "rejected",
            submittedAt: now - 4 * DAY,
        });

        // t6 — freshly submitted, awaiting the queue.
        const sub6 = await insertSubmission({
            key: "t6",
            author: wanjiku._id,
            submissionType: "phrase_translation",
            languageCode: "sheng",
            sourceText: "I'm broke, bro.",
            targetText: "Niko na zero, msee.",
            status: "submitted",
            submittedAt: now - 3 * 60 * 60 * 1000,
        });

        // 7. Peer validation votes (bundles show realistic vote counts).
        await chokepoint.upsertValidationVote(ctx, {
            submissionId: sub1,
            validatorId: otieno._id,
            validatorRole: "peer",
            vote: "accept",
            confidence: 95,
            comment: "Natural everyday phrasing.",
        });
        await chokepoint.upsertValidationVote(ctx, {
            submissionId: sub1,
            validatorId: amina._id,
            validatorRole: "peer",
            vote: "accept",
            confidence: 90,
        });
        await chokepoint.upsertValidationVote(ctx, {
            submissionId: sub2,
            validatorId: wanjiku._id,
            validatorRole: "peer",
            vote: "accept",
            confidence: 92,
        });
        await chokepoint.upsertValidationVote(ctx, {
            submissionId: sub2,
            validatorId: amina._id,
            validatorRole: "peer",
            vote: "accept",
            confidence: 88,
        });
        await chokepoint.upsertValidationVote(ctx, {
            submissionId: sub3,
            validatorId: wanjiku._id,
            validatorRole: "peer",
            vote: "accept",
            confidence: 80,
            comment: "Sounds right; slightly formal for Sheng but acceptable.",
        });
        await chokepoint.upsertValidationVote(ctx, {
            submissionId: sub5,
            validatorId: wanjiku._id,
            validatorRole: "peer",
            vote: "reject",
            confidence: 85,
            issueCodes: ["needs_context"],
            comment: "Correct word but needs a context note before it can be accepted.",
        });

        // 8. Contributor stats for the demo users (drives XP bar, trust, badges).
        await chokepoint.upsertUserStats(ctx, {
            userId: wanjiku._id,
            doc: {
                userId: wanjiku._id,
                contributionCount: 6,
                validationCount: 14,
                acceptRate: 0.83,
                reviewAgreementRate: 0.71,
                trustScore: 104,
                streakDays: 7,
                lastActiveDate: new Date(now).toISOString(),
                topLanguages: ["sheng", "sw"],
                badges: ["first_contribution", "week_streak"],
            },
        });
        await chokepoint.upsertUserStats(ctx, {
            userId: otieno._id,
            doc: {
                userId: otieno._id,
                contributionCount: 4,
                validationCount: 9,
                acceptRate: 0.75,
                reviewAgreementRate: 0.67,
                trustScore: 71,
                streakDays: 3,
                lastActiveDate: new Date(now - 2 * DAY).toISOString(),
                topLanguages: ["sheng", "luo"],
                badges: ["first_contribution"],
            },
        });
        await chokepoint.upsertUserStats(ctx, {
            userId: amina._id,
            doc: {
                userId: amina._id,
                contributionCount: 3,
                validationCount: 6,
                acceptRate: 0.67,
                reviewAgreementRate: 0.5,
                trustScore: 47,
                streakDays: 1,
                lastActiveDate: new Date(now - DAY).toISOString(),
                topLanguages: ["sw", "sheng"],
                badges: ["first_contribution"],
            },
        });

        // 8a. Consent policy (published, active — what reviewers see in the
        //    consent banner and what submission forms reference).
        const policyVersion = "changa-pilot-v1";
        await chokepoint.insertConsentPolicy(ctx, {
            policyVersion,
            effectiveAt: now - 90 * DAY,
            summaryText: DEMO_CONSENT_POLICY_SUMMARY,
            fullText: DEMO_CONSENT_POLICY_TEXT,
            requiredScopes: ["collection_storage", "training", "research"],
            isActive: true,
            createdBy: wanjiku._id,
            createdAt: now - 90 * DAY,
        });

        // 8b. A second curated example used only for the evaluation set
        //     (the first curatedId is in the training release — the
        //     contamination guard prevents a single example appearing in
        //     both a release and an eval set).
        const curatedId2 = await chokepoint.insertCuratedExample(ctx, {
            sourceSubmissionId: sub2,
            exampleType: "parallel_text",
            languageCode: "sheng",
            sourceText: "How are you doing?",
            targetText: "Mambo vipi?",
            qualityScore: 0.89,
            reviewSummary: "Two peer accepts; clean and natural.",
            splitRecommendation: "test",
            releaseStatus: "approved",
            createdAt: now - 7 * DAY,
        });
        await chokepoint.patchSubmission(ctx, sub2, {
            curatedExampleId: curatedId2,
            updatedAt: now - 7 * DAY,
        });

        // 9. Processing runs: basic_task_check on every submission (the
        //    worker dispatches these first). The accepted/curated ones are
        //    completed; the in-validation ones are still queued.
        async function insertProcessingRun(
            subId: Id<"changaSubmissions">,
            processor: "basic_task_check" | "audio_quality" | "asr" | "language_id" | "duplicate_detection" | "moderation",
            completed: boolean,
            result?: Record<string, unknown>,
        ) {
            const runId = await chokepoint.insertProcessingRun(ctx, {
                submissionId: subId,
                processor,
            });
            if (completed) {
                await chokepoint.patchProcessingRun(ctx, runId, {
                    status: "completed",
                    result: result ?? { passed: true, checks: ["language_id", "duplicate_detection"] },
                    completedAt: now - 8 * DAY,
                    modelVersion: "samiati-pipeline-v1.2",
                    configVersion: "cfg-003",
                });
            }
            return runId;
        }

        await insertProcessingRun(sub1, "basic_task_check", true, {
            passed: true,
            checks: ["duplicate_detection", "language_id", "pii_scan"],
            languageConfidence: 0.97,
            duplicateScore: 0.03,
        });
        await insertProcessingRun(sub2, "basic_task_check", true, {
            passed: true,
            checks: ["duplicate_detection", "language_id", "pii_scan"],
            languageConfidence: 0.96,
            duplicateScore: 0.05,
        });
        await insertProcessingRun(sub3, "basic_task_check", true);
        await insertProcessingRun(sub4, "basic_task_check", true);
        await insertProcessingRun(sub5, "basic_task_check", false);
        await insertProcessingRun(sub5, "moderation", true, {
            flagged: true,
            reasons: ["needs_context"],
            severity: "low",
        });
        await insertProcessingRun(sub6, "basic_task_check", true, {
            passed: true,
            checks: ["duplicate_detection"],
            languageConfidence: 0.88,
        });

        // 10. Task claims: realistic mix of active, submitted, expired states.
        //     We claim a few of the open DEMO_TASKS that already exist.
        const allOpenTasks = (await ctx.db
            .query("changaTasks")
            .withIndex("by_status", (q) => q.eq("status", "open"))
            .collect()).filter((t) => t.targetSubmissionCount > 0);

        // Active claim — wanjiku is translating "See you later."
        if (allOpenTasks.length > 1) {
            await chokepoint.insertTaskClaim(ctx, {
                taskId: allOpenTasks[1]._id,
                userId: wanjiku._id,
                status: "active",
                claimedAt: now - 1 * DAY,
                expiresAt: now - 1 * DAY + 2 * 60 * 60 * 1000,
            });
        }

        // Submitted claim — otieno finished "I'm broke, bro."
        if (allOpenTasks.length > 2) {
            await chokepoint.insertTaskClaim(ctx, {
                taskId: allOpenTasks[2]._id,
                userId: otieno._id,
                status: "submitted",
                claimedAt: now - 3 * DAY,
                expiresAt: now - 3 * DAY + 2 * 60 * 60 * 1000,
            });
        }

        // Expired claim — amina's claim lapsed.
        if (allOpenTasks.length > 0) {
            await chokepoint.insertTaskClaim(ctx, {
                taskId: allOpenTasks[0]._id,
                userId: amina._id,
                status: "active",
                claimedAt: now - 4 * DAY,
                expiresAt: now - 4 * DAY + 2 * 60 * 60 * 1000,
            });
            // Manually expire it to demonstrate the expired state.
            const expiredClaims = await ctx.db
                .query("changaTaskClaims")
                .withIndex("by_user_status", (q) =>
                    q.eq("userId", amina._id).eq("status", "active"))
                .collect();
            if (expiredClaims.length > 0) {
                await ctx.db.patch(expiredClaims[0]._id, { status: "expired" });
            }
        }

        // 11. Extra submissions to enrich the validation queue.
        //     First create the submission tasks, then insert submissions.
        const extraTaskIds: Record<string, Id<"changaTasks">> = {};
        for (const spec of DEMO_EXTRA_SUBMISSION_TASKS) {
            const template =
                spec.languageCode === "sw"
                    ? kiswahiliTemplate
                    : phraseTemplate;
            extraTaskIds[spec.key] = await chokepoint.insertTask(ctx, {
                templateId: template,
                templateVersion: 1,
                campaignId:
                    spec.languageCode === "sw"
                        ? campaignIds["Kiswahili Phrase Harvest"]
                        : campaignIds["Sheng Slang of the Week"],
                taskType: spec.taskType,
                languageCode: spec.languageCode,
                promptSourceText: spec.prompt,
                priority: "normal",
                status: "open",
                targetSubmissionCount: 5,
                targetValidationCount: 2,
                createdBy: systemUser,
                createdAt: now,
            });
        }

        const extraUserIds: Record<string, Id<"users">> = {
            "demo-seed-wanjiku": wanjiku._id,
            "demo-seed-otieno": otieno._id,
            "demo-seed-amina": amina._id,
        };

        const extraSubmissionIds: Record<string, Id<"changaSubmissions">> = {};
        for (const spec of DEMO_EXTRA_SUBMISSIONS) {
            const subId = await chokepoint.insertSubmission(ctx, {
                taskId: extraTaskIds[spec.key],
                userId: extraUserIds[spec.author],
                submissionType: spec.key === "et1" ? "phrase_translation" : "sentence_translation",
                languageCode: spec.key === "et1" ? "sw" : "sheng",
                sourceText: spec.sourceText,
                targetText: spec.targetText,
                consent: DEMO_CONSENT,
                consentPolicyVersion: policyVersion,
                license: "community",
                status: spec.status,
                submittedAt: now - spec.submittedAtOffset * DAY,
                updatedAt: now - spec.submittedAtOffset * DAY,
            });
            await chokepoint.insertConsentRecord(ctx, {
                userId: extraUserIds[spec.author],
                submissionId: subId,
                policyVersion,
                scopes: ["collection_storage", "training", "research"],
                attributionPreference: "pseudonymous",
                grantedAt: now - spec.submittedAtOffset * DAY,
            });
            extraSubmissionIds[spec.key] = subId;
        }

        // 12. Extra validation votes on the new submissions.
        for (const vote of DEMO_EXTRA_VOTES) {
            const subId = extraSubmissionIds[vote.submissionTaskKey];
            if (!subId) continue;
            await chokepoint.upsertValidationVote(ctx, {
                submissionId: subId,
                validatorId: extraUserIds[vote.validator],
                validatorRole: "peer",
                vote: vote.vote,
                confidence: vote.confidence,
                comment: vote.comment,
                issueCodes: vote.issueCodes,
            });
        }

        // 13. Dataset release + release members (the curated example goes
        //     to the train split — the eval set example is kept separate
        //     to avoid the contamination guard).
        const releaseId = await chokepoint.insertDatasetRelease(ctx, {
            name: "Sheng Pilot Release",
            version: "v0.1.0",
            languageScope: ["sheng"],
            criteria: "Peer-validated submissions with splitRecommendation=train, qualityScore>=0.8.",
            releaseNotes:
                "Initial pilot release of Sheng translation pairs. Includes 1 gold-standard curated example.",
            exampleCount: 1,
            createdAt: now - 7 * DAY,
            createdBy: wanjiku._id,
        });
        await chokepoint.addReleaseMember(ctx, {
            releaseId,
            exampleId: curatedId,
            split: "train",
        });
        await chokepoint.patchCuratedExample(ctx, curatedId, {
            datasetReleaseId: releaseId,
        });

        // 14. Evaluation set + evaluation items (test split, separate example).
        const evalSetId = await chokepoint.insertEvaluationSet(ctx, {
            name: "Sheng QA Bench",
            languageCode: "sheng",
            description: "Holdout benchmark sentences for model evaluation.",
            accessRole: "moderator",
            isFrozen: true,
            createdAt: now - 6 * DAY,
            createdBy: otieno._id,
        });
        await chokepoint.addEvaluationItem(ctx, {
            evaluationSetId: evalSetId,
            exampleId: curatedId2,
            addedBy: otieno._id,
            split: "test",
        });

        // 15. Role grants: promote demo users in the reputation pipeline.
        await chokepoint.insertRoleGrant(ctx, {
            userId: wanjiku._id,
            languageCode: "sheng",
            role: "trusted_contributor",
            grantedBy: systemUser,
            status: "active",
            grantedAt: now - 8 * DAY,
            expiresAt: now - 8 * DAY + 90 * DAY,
        });
        await chokepoint.insertRoleGrant(ctx, {
            userId: otieno._id,
            languageCode: "sheng",
            role: "community_reviewer",
            grantedBy: systemUser,
            status: "active",
            grantedAt: now - 7 * DAY,
            expiresAt: now - 7 * DAY + 90 * DAY,
        });
        await chokepoint.insertRoleGrant(ctx, {
            userId: amina._id,
            languageCode: "sw",
            role: "contributor",
            grantedBy: systemUser,
            status: "active",
            grantedAt: now - 5 * DAY,
        });

        // 16. Invites: referral campaign data with clicks + conversions.
        for (const invite of DEMO_INVITES) {
            const inviter = findDemoUser(refreshed, invite.code.startsWith("changa_demo_wanjiku")
                ? "demo-seed-wanjiku"
                : invite.code.startsWith("changa_demo_otieno")
                  ? "demo-seed-otieno"
                  : "demo-seed-amina");
            const doc: {
                inviterUserId: Id<"users">;
                inviteCode: string;
                channel: string;
                createdAt: number;
                clickedAt?: number;
                clickedByUserId?: Id<"users">;
                firstContributionAt?: number;
            } = {
                inviterUserId: inviter._id,
                inviteCode: invite.code,
                channel: invite.channel,
                createdAt: now - invite.daysAgo * DAY,
            };
            if (invite.daysClicked !== null) {
                doc.clickedAt = now - invite.daysClicked * DAY;
                doc.clickedByUserId = inviter._id;
            }
            if (invite.daysConverted !== null) {
                doc.firstContributionAt = now - invite.daysConverted * DAY;
            }
            await chokepoint.insertInvite(ctx, doc);
        }

        // 17. Campaign proposals in each review state.
        for (const proposal of DEMO_PROPOSALS) {
            await chokepoint.insertCampaignProposal(ctx, {
                title: proposal.title,
                description: proposal.description,
                languageCode: proposal.languageCode,
                taskTypes: [...proposal.taskTypes],
                goalCount: proposal.goalCount,
                rationale: proposal.rationale,
                status: proposal.status,
                proposedBy: wanjiku._id,
                ...(proposal.status === "approved"
                    ? { reviewedBy: otieno._id, reviewedAt: now - 1 * DAY, reviewNote: "Approved — fills a real gap." }
                    : proposal.status === "rejected"
                      ? { reviewedBy: otieno._id, reviewedAt: now - 12 * 60 * 60 * 1000, reviewNote: proposal.reviewNote }
                      : {}),
                createdAt: now - 2 * DAY,
            });
        }

        // 18. Moderation decisions for the rejected submission (t5).
        await chokepoint.insertDecision(ctx, {
            submissionId: sub5,
            decision: "needs_fix",
            reason: "Missing context note — the word 'karao' needs an example sentence to be acceptable.",
            resolverId: otieno._id,
            evidenceVersion: "samiati-pipeline-v1.2",
            createdAt: now - 3 * DAY,
        });
        await chokepoint.insertDecision(ctx, {
            submissionId: sub4,
            decision: "accepted",
            reason: "Clear, natural translation. Two peer accepts.",
            resolverId: otieno._id,
            evidenceVersion: "samiati-pipeline-v1.2",
            createdAt: now - 1 * DAY,
        });

        // 19. Documents + document entries (dictionaries and a song collection).
        for (const docDef of DEMO_DOCUMENTS) {
            const docId = await chokepoint.insertDocument(ctx, {
                ownerId: findDemoUser(refreshed, docDef.ownerClerkId)._id,
                title: docDef.title,
                kind: docDef.kind,
                languageCode: docDef.languageCode,
                totalEntries: docDef.entries.length,
                importedEntries: 0,
                status: "completed" as const,
                createdAt: now - 5 * DAY,
                updatedAt: now - 5 * DAY,
                finalizedAt: now - 5 * DAY,
            });

            for (const entry of docDef.entries) {
                const entryId = await chokepoint.insertDocumentEntry(ctx, {
                    documentId: docId,
                    index: entry.index,
                    sourceText: entry.sourceText,
                    targetText: entry.targetText,
                    metadata: entry.metadata,
                    autoCategory: entry.metadata.partOfSpeech === "noun" ? "other" : "other",
                    autoConfidence: 0.91,
                    status: "approved" as const,
                    reviewAssignedTo: findDemoUser(refreshed, docDef.ownerClerkId)._id,
                    createdAt: now - 5 * DAY,
                    updatedAt: now - 5 * DAY,
                });

                // Link the first dictionary entry of the Wanjiku doc back to
                // the corresponding curated submission for traceability.
                if (docDef.ownerClerkId === "demo-seed-wanjiku" && entry.index === 0) {
                    await chokepoint.patchSubmission(ctx, sub1, {
                        documentEntryId: entryId,
                        updatedAt: now - 5 * DAY,
                    });
                }
            }

            // Patch the document with the final imported count.
            await chokepoint.patchDocument(ctx, docId, {
                importedEntries: docDef.entries.length,
            });
        }

        return {
            success: true as const,
            campaignsWithData: DEMO_CAMPAIGNS.length,
            tasksCreated: DEMO_TASKS.length + DEMO_SUBMISSION_TASKS.length + DEMO_EXTRA_SUBMISSION_TASKS.length,
            submissionsCreated: 6 + DEMO_EXTRA_SUBMISSIONS.length,
            curatedExamples: 2,
            validationVotes: 6 + DEMO_EXTRA_VOTES.length,
            demoContributors: DEMO_USERS.length,
            consentPolicies: 1,
            processingRuns: 7,
            taskClaims: 3,
            datasetReleases: 1,
            evaluationSets: 1,
            roleGrants: 3,
            invites: DEMO_INVITES.length,
            campaignProposals: DEMO_PROPOSALS.length,
            moderationDecisions: 2,
            documents: DEMO_DOCUMENTS.length,
            documentEntries: DEMO_DOCUMENTS.reduce((sum, d) => sum + d.entries.length, 0),
        };
    },
});

// Verification query: run with
//   npx convex run changa.seedDemo:demoSeedStatus
// to confirm the demo dataset is present.
export const demoSeedStatus = internalQuery({
    args: {},
    handler: async (ctx) => {
        const campaigns = await ctx.db.query("changaCampaigns").collect();
        const tasks = await ctx.db.query("changaTasks").collect();
        const openTasks = tasks.filter((t) => t.status === "open");
        const submissions = await ctx.db.query("changaSubmissions").collect();
        const votes = await ctx.db.query("changaValidationVotes").collect();
        const curated = await ctx.db.query("changaCuratedExamples").collect();
        const stats = await ctx.db.query("changaUserStats").collect();
        const templates = await ctx.db.query("changaTaskTemplates").collect();
        const policies = await ctx.db.query("changaConsentPolicies").collect();
        const processingRuns = await ctx.db.query("changaProcessingRuns").collect();
        const taskClaims = await ctx.db.query("changaTaskClaims").collect();
        const releases = await ctx.db.query("changaDatasetReleases").collect();
        const releaseMembers = await ctx.db.query("changaReleaseMembers").collect();
        const evalSets = await ctx.db.query("changaEvaluationSets").collect();
        const evalItems = await ctx.db.query("changaEvaluationItems").collect();
        const roleGrants = await ctx.db.query("changaRoleGrants").collect();
        const invites = await ctx.db.query("changaInvites").collect();
        const proposals = await ctx.db.query("changaCampaignProposals").collect();
        const decisions = await ctx.db.query("changaDecisions").collect();
        const documents = await ctx.db.query("changaDocuments").collect();
        const docEntries = await ctx.db.query("changaDocumentEntries").collect();

        const openByLanguage: Record<string, number> = {};
        for (const task of openTasks) {
            openByLanguage[task.languageCode] = (openByLanguage[task.languageCode] ?? 0) + 1;
        }

        return {
            activeCampaigns: campaigns.filter((c) => c.status === "active").length,
            openTasks: openTasks.length,
            openTasksByLanguage: openByLanguage,
            submissionsByStatus: submissions.reduce<Record<string, number>>(
                (acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }),
                {},
            ),
            validationVotes: votes.length,
            curatedExamples: curated.length,
            contributorsWithStats: stats.length,
            taskTemplates: templates.length,
            consentPolicies: policies.length,
            processingRuns: processingRuns.length,
            processingRunsByStatus: processingRuns.reduce<Record<string, number>>(
                (acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }),
                {},
            ),
            taskClaims: taskClaims.length,
            taskClaimsByStatus: taskClaims.reduce<Record<string, number>>(
                (acc, c) => ({ ...acc, [c.status]: (acc[c.status] ?? 0) + 1 }),
                {},
            ),
            datasetReleases: releases.length,
            releaseMembers: releaseMembers.length,
            evaluationSets: evalSets.length,
            evaluationItems: evalItems.length,
            roleGrants: roleGrants.length,
            roleGrantsByRole: roleGrants.reduce<Record<string, number>>(
                (acc, g) => ({ ...acc, [g.role]: (acc[g.role] ?? 0) + 1 }),
                {},
            ),
            invites: invites.length,
            campaignProposals: proposals.length,
            proposalsByStatus: proposals.reduce<Record<string, number>>(
                (acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }),
                {},
            ),
            moderationDecisions: decisions.length,
            documents: documents.length,
            documentEntries: docEntries.length,
        };
    },
});

// UI-friendly trigger (moderator-gated), mirroring seedSheng.triggerSeedSheng
// so a moderator can populate the demo dataset from the app instead of the CLI.
export const triggerSeedDemo = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can seed demo data");
        }
        await ctx.runMutation(internal.changa.seedDemo.seedDemoData, {});
        return { success: true as const };
    },
});








