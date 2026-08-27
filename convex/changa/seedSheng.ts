import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

// Seed Sheng task templates and English source sentences.
// Run via: npx convex run changa.seedSheng:seedShengData
// Requires moderator privileges.

const SHENG_SENTENCES = [
    // Everyday conversation (30%)
    "What are you doing tomorrow?",
    "Where are you going?",
    "How are you doing?",
    "What's happening?",
    "I'm going to the shop.",
    "She is not at home right now.",
    "We need to talk about something.",
    "Can you come here for a minute?",
    "I'll call you back later.",
    "What time does the meeting start?",
    "I'm running late, I'll be there soon.",
    "Did you eat already?",
    "Let's meet at the usual place.",
    "I don't have any money right now.",
    "My phone is almost dead.",
    "The traffic is terrible today.",
    "I'll be home by evening.",
    "What do you think about this?",
    "I need to charge my phone.",
    "Can you send me the location?",

    // Questions and commands (20%)
    "Where is the nearest matatu stage?",
    "How much does this cost?",
    "Can you help me with this?",
    "What happened yesterday?",
    "Who told you that?",
    "Why didn't you come?",
    "When are you leaving?",
    "Please hold on for a moment.",
    "Tell me the truth.",
    "Don't forget to lock the door.",
    "Come back tomorrow.",
    "Give me a minute.",
    "What's the problem?",
    "Is everything okay?",
    "Can I borrow your charger?",

    // Emotional and social language (15%)
    "I miss you so much.",
    "You're my best friend.",
    "I'm so happy for you.",
    "That really hurt my feelings.",
    "Congratulations on your new job!",
    "I'm sorry for what happened.",
    "You mean everything to me.",
    "I can't believe this is happening.",
    "I'm so proud of you.",
    "Please don't leave me.",
    "You always make me laugh.",
    "I'm frustrated with this situation.",
    "Thank you for always being there.",
    "I love spending time with you.",
    "You're the best thing that happened to me.",

    // Work and education (10%)
    "The deadline is next Friday.",
    "I need to finish this report.",
    "My boss wants to see me.",
    "I have a meeting at 3pm.",
    "Can you forward me the email?",
    "The project is almost done.",
    "I'm working from home today.",
    "We need more time to finish.",
    "The presentation went well.",
    "I'm looking for a new job.",

    // Technology and finance (10%)
    "My M-Pesa is not working.",
    "I need to send money to my mother.",
    "The internet is slow today.",
    "Can you buy me airtime?",
    "I'm saving for a new phone.",
    "The data bundle is finished.",
    "I need to pay my bills.",
    "My account has insufficient funds.",
    "Can you transfer money to my account?",
    "The withdrawal limit is too low.",

    // Cultural expressions and idioms (10%)
    "Every dog has its day.",
    "Patience pays off in the end.",
    "Actions speak louder than words.",
    "A friend in need is a friend indeed.",
    "You reap what you sow.",
    "Knowledge is power.",
    "Time waits for no one.",
    "Unity is strength.",
    "Health is wealth.",
    "Slow and steady wins the race.",

    // Numbers, dates, and places (5%)
    "I'll be there in five minutes.",
    "The meeting is on Monday.",
    "I live in Eastlands.",
    "The shop opens at 8am.",
    "We need three more people.",
    "The event is next month.",
    "I was born in 1995.",
    "The bus number is 33.",
    "My house is near the church.",
    "The total is one thousand shillings.",
];

export const seedShengData = internalMutation({
    args: {},
    handler: async (ctx) => {
        // Create a system user if none exists (for dev/CLI seeding)
        let createdBy: any;
        const existingUser = await ctx.db.query("users").first();
        if (existingUser) {
            createdBy = existingUser._id;
        } else {
            // Insert a minimal system user for audit trail
            createdBy = await ctx.db.insert("users", {
                name: "Changa System",
                handle: "@changa-system",
                avatar: "",
                isGuest: false,
                clerkId: "system-seed",
                role: "admin",
            });
        }

        // 1. Create Sheng task templates
        const translationTemplateId = await ctx.db.insert("changaTaskTemplates", {
            name: "Sheng Translation",
            taskType: "sentence_translation",
            instructions: "Write the natural Sheng equivalent of the English sentence. Use the phrasing a fluent Sheng speaker would actually use in conversation — not standard Swahili, not a word-for-word translation.",
            sourceMode: "prompted",
            inputSchema: [
                { id: "sourceText", label: "English sentence", inputType: "text", required: true },
            ],
            outputSchema: [
                { id: "targetText", label: "Sheng translation", inputType: "text", required: true },
            ],
            requiresAudio: false,
            requiresTranslation: true,
            requiresValidationCount: 3,
            templateVersion: 1,
            riskTier: "low",
            destinationDataProduct: "sheng_translation_pairs",
            requiredConsentScopes: ["collection_storage", "training", "research"],
            isActive: true,
            createdBy,
            createdAt: Date.now(),
        });

        const audioTemplateId = await ctx.db.insert("changaTaskTemplates", {
            name: "Sheng Audio Reading",
            taskType: "audio_reading",
            instructions: "Read the Sheng sentence aloud in your natural voice. Speak clearly, in a quiet environment if possible. Listen back before submitting.",
            sourceMode: "prompted",
            inputSchema: [
                { id: "sourceText", label: "Sheng sentence to read", inputType: "text", required: true },
            ],
            outputSchema: [
                { id: "audio", label: "Audio recording", inputType: "audio", required: true },
            ],
            requiresAudio: true,
            requiresTranslation: false,
            requiresValidationCount: 2,
            templateVersion: 1,
            riskTier: "low",
            destinationDataProduct: "sheng_speech_corpus",
            requiredConsentScopes: ["collection_storage", "training", "research", "voice_use"],
            isActive: true,
            createdBy,
            createdAt: Date.now(),
        });

        const validationTemplateId = await ctx.db.insert("changaTaskTemplates", {
            name: "Sheng Translation Validation",
            taskType: "validation",
            instructions: "Review the Sheng translation for naturalness, correctness, and whether it sounds like something a real Sheng speaker would say.",
            sourceMode: "prompted",
            inputSchema: [
                { id: "sourceText", label: "English sentence", inputType: "text", required: true },
                { id: "targetText", label: "Sheng translation", inputType: "text", required: true },
            ],
            outputSchema: [
                { id: "naturalness", label: "Naturalness rating", inputType: "select", required: true, options: ["1 - Not natural", "2 - Somewhat natural", "3 - Natural", "4 - Very natural", "5 - Perfectly natural"] },
                { id: "languageLabel", label: "Language type", inputType: "select", required: true, options: ["Sheng", "Swahili", "English", "Mixed"] },
            ],
            requiresAudio: false,
            requiresTranslation: false,
            requiresValidationCount: 3,
            templateVersion: 1,
            riskTier: "low",
            destinationDataProduct: "sheng_validation_scores",
            requiredConsentScopes: ["collection_storage"],
            isActive: true,
            createdBy,
            createdAt: Date.now(),
        });

        // 2. Create Sheng collection campaign
        const campaignId = await ctx.db.insert("changaCampaigns", {
            title: "Collect 500 Sheng Sentences",
            description: "Help build the first high-quality Sheng translation dataset. Every sentence you translate helps AI understand how real Sheng speakers talk.",
            languageCode: "sheng",
            taskTypes: ["sentence_translation", "audio_reading"],
            goalCount: 500,
            currentCount: 0,
            startAt: Date.now(),
            status: "active",
            createdBy,
            createdAt: Date.now(),
        });

        // 3. Create translation tasks from English sentences
        let taskCount = 0;
        for (const sentence of SHENG_SENTENCES) {
            await ctx.db.insert("changaTasks", {
                templateId: translationTemplateId,
                campaignId,
                taskType: "sentence_translation",
                languageCode: "sheng",
                domain: getDomain(sentence),
                difficulty: getDifficulty(sentence),
                promptSourceText: sentence,
                priority: "normal",
                status: "open",
                targetSubmissionCount: 5,
                targetValidationCount: 3,
                createdBy,
                createdAt: Date.now(),
            });
            taskCount++;
        }

        // 4. Create audio reading tasks for the first 50 sentences (Sheng text to read)
        // These will be populated after translations come in — for now, use English as placeholder
        // The actual Sheng text will be set by moderators after reviewing translations
        let audioTaskCount = 0;
        for (const sentence of SHENG_SENTENCES.slice(0, 50)) {
            await ctx.db.insert("changaTasks", {
                templateId: audioTemplateId,
                campaignId,
                taskType: "audio_reading",
                languageCode: "sheng",
                domain: getDomain(sentence),
                promptSourceText: sentence, // Will be replaced with Sheng after translation
                priority: "low",
                status: "open",
                targetSubmissionCount: 3,
                targetValidationCount: 2,
                createdBy,
                createdAt: Date.now(),
            });
            audioTaskCount++;
        }

        return {
            translationTemplateId,
            audioTemplateId,
            validationTemplateId,
            campaignId,
            tasksCreated: taskCount,
            audioTasksCreated: audioTaskCount,
            sentencesSeeded: SHENG_SENTENCES.length,
        };
    },
});

// Helper: categorize sentence domain
function getDomain(sentence: string): string {
    const lower = sentence.toLowerCase();
    if (
        lower.includes("?") &&
        (lower.includes("where") ||
            lower.includes("what") ||
            lower.includes("who") ||
            lower.includes("when") ||
            lower.includes("why") ||
            lower.includes("how") ||
            lower.includes("can you"))
    ) {
        return "questions_commands";
    }
    if (
        lower.includes("love") ||
        lower.includes("miss") ||
        lower.includes("happy") ||
        lower.includes("sorry") ||
        lower.includes("proud") ||
        lower.includes("friend") ||
        lower.includes("hurt") ||
        lower.includes("congratulations")
    ) {
        return "emotional_social";
    }
    if (
        lower.includes("work") ||
        lower.includes("meeting") ||
        lower.includes("job") ||
        lower.includes("report") ||
        lower.includes("boss") ||
        lower.includes("project") ||
        lower.includes("deadline") ||
        lower.includes("presentation")
    ) {
        return "work_education";
    }
    if (
        lower.includes("mpesa") ||
        lower.includes("money") ||
        lower.includes("airtime") ||
        lower.includes("internet") ||
        lower.includes("phone") ||
        lower.includes("account") ||
        lower.includes("transfer") ||
        lower.includes("pay") ||
        lower.includes("data bundle")
    ) {
        return "technology_finance";
    }
    if (
        lower.includes("dog") ||
        lower.includes("patience") ||
        lower.includes("actions") ||
        lower.includes("friend in need") ||
        lower.includes("reap") ||
        lower.includes("knowledge") ||
        lower.includes("time waits") ||
        lower.includes("unity") ||
        lower.includes("health") ||
        lower.includes("slow and steady")
    ) {
        return "cultural_idioms";
    }
    if (
        lower.includes("monday") ||
        lower.includes("friday") ||
        lower.includes("8am") ||
        lower.includes("3pm") ||
        lower.includes("five minutes") ||
        lower.includes("three") ||
        lower.includes("thousand") ||
        lower.includes("1995") ||
        lower.includes("eastlands")
    ) {
        return "numbers_dates_places";
    }
    return "everyday_conversation";
}

// Helper: estimate sentence difficulty
function getDifficulty(sentence: string): "beginner" | "intermediate" | "advanced" {
    const words = sentence.split(" ").length;
    if (words <= 5) return "beginner";
    if (words <= 10) return "intermediate";
    return "advanced";
}

// Query to check how many Sheng tasks exist
export const countShengTasks = internalQuery({
    args: {},
    handler: async (ctx) => {
        const tasks = await ctx.db
            .query("changaTasks")
            .withIndex("by_language_status", (q) =>
                q.eq("languageCode", "sheng").eq("status", "open"),
            )
            .collect();

        const campaigns = await ctx.db
            .query("changaCampaigns")
            .withIndex("by_language_status", (q) =>
                q.eq("languageCode", "sheng").eq("status", "active"),
            )
            .collect();

        return {
            openTasks: tasks.length,
            activeCampaigns: campaigns.length,
            tasksByType: {
                translation: tasks.filter((t) => t.taskType === "sentence_translation").length,
                audio: tasks.filter((t) => t.taskType === "audio_reading").length,
                validation: tasks.filter((t) => t.taskType === "validation").length,
            },
        };
    },
});
