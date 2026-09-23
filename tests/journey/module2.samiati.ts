/**
 * Module 2 — Samiati AI. Walks steps 2a, 2b, 2c as static assertions.
 */
import { describe, it, expect } from "vitest";
import { readSource, exists, assertContains, assertContainsRegex, lineNumber } from "./harness";
import type { StepResult } from "./report";

const RESULTS: StepResult[] = [];

function step(id: string, description: string, fn: () => string) {
    return it(`${id} ${description}`, () => {
        try {
            const evidence = fn();
            RESULTS.push({ id, description, status: "pass", evidence });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            RESULTS.push({ id, description, status: "fail", evidence: message });
            throw err;
        }
    });
}

const chat = () => readSource("convex/chat.ts");
const translate = () => readSource("convex/translate.ts");
const feedback = () => readSource("convex/feedback.ts");
const postsMutations = () => readSource("convex/posts/mutations.ts");
const postsQueries = () => readSource("convex/posts/queries.ts");
const aiSecurity = () => readSource("convex/lib/aiSecurity.ts");
const dashboard = () => readSource("src/app/dashboard/page.tsx");
const libValidation = () => readSource("convex/lib/validation.ts");

describe("Module 2: Core feature testing (Samiati AI)", () => {
    // ----- 2a.1 -----
    step("2a.1", "/dashboard renders HomeSearchScreen and loads localStorage conversations", () => {
        const src = dashboard();
        assertContains(src, "HomeSearchScreen", "2a.1 dashboard uses HomeSearchScreen");
        assertContains(src, "localConversationService", "2a.1 dashboard uses localConversationService");
        return `HomeSearchScreen at line ${lineNumber(src, "HomeSearchScreen")}; localConversationService at line ${lineNumber(src, "localConversationService")}`;
    });

    // ----- 2a.2 -----
    step("2a.2", "sendMessage instructs model to reply in target language only", () => {
        const src = chat();
        assertContains(src, "Reply in", "2a.2 system prompt directive");
        assertContainsRegex(src, /Reply in \$\{targetLang\}/, "2a.2 interpolation");
        return `system prompt at line ${lineNumber(src, "Reply in")}`;
    });

    // ----- 2a.3 -----
    step("2a.3", "sendMessage rejects >5000 chars", () => {
        const src = chat();
        assertContains(src, "Message too long. Please keep messages under 5,000 characters.", "2a.3 length error");
        return `error string at line ${lineNumber(src, "Message too long")}`;
    });

    // ----- 2a.4 -----
    step("2a.4", "enforceAiQuotaAction reads user plan tier", () => {
        const src = aiSecurity();
        assertContains(src, "getUserPlanTier", "2a.4 tier lookup");
        assertContainsRegex(src, /tier\s*=\s*planTier as PlanTier/, "2a.4 tier assignment");
        return `tier resolved at line ${lineNumber(src, "getUserPlanTier")}`;
    });

    // ----- 2a.5 / 2a.6 -----
    step("2a.5", "feedback.submit toggles same vote off", () => {
        const src = feedback();
        assertContains(src, "Same vote — remove it (toggle off)", "2a.5 toggle off");
        return `toggle off at line ${lineNumber(src, "remove it (toggle off)")}`;
    });
    step("2a.6", "feedback.submit supports correction field", () => {
        const src = feedback();
        assertContains(src, "correction: v.optional(v.string())", "2a.6 correction arg");
        return `correction arg at line ${lineNumber(src, "correction: v.optional")}`;
    });

    // ----- 2a.7 -----
    step("2a.7", "Dashboard handleNewChat clears ?chatId", () => {
        const src = dashboard();
        assertContains(src, "setActiveConversationId(null)", "2a.7 clears active id");
        assertContains(src, 'router.replace("/dashboard")', "2a.7 replaces URL");
        return `handleNewChat at line ${lineNumber(src, "handleNewChat")}`;
    });

    // ----- 2b.1 -----
    step("2b.1", "translateText uses Sunflower prompt format", () => {
        const src = translate();
        assertContains(src, "Translate from English to", "2b.1 prompt prefix");
        return `prompt template at line ${lineNumber(src, "Translate from English to")}`;
    });

    // ----- 2b.3 / 2b.4 / 2b.5 / 2b.6 -----
    step("2b.3", "translateText returns auth_invalid message on 403", () => {
        const src = translate();
        assertContains(src, "Translation API access forbidden", "2b.3 forbidden error");
        return `error at line ${lineNumber(src, "Translation API access forbidden")}`;
    });
    step("2b.4", "translateText returns model_loading message on 503", () => {
        const src = translate();
        assertContains(src, "Translation Model is loading", "2b.4 loading error");
        return `error at line ${lineNumber(src, "Translation Model is loading")}`;
    });
    step("2b.5", "translateText rejects >5000 chars", () => {
        const src = translate();
        assertContains(src, "Text too long. Please keep text under 5,000 characters.", "2b.5 length error");
        return `error at line ${lineNumber(src, "Text too long")}`;
    });
    step("2b.6", "feedback supports contextType='translate'", () => {
        const src = feedback();
        assertContains(src, 'v.literal("translate")', "2b.6 translate context");
        return `translate literal at line ${lineNumber(src, 'v.literal("translate")')}`;
    });

    // ----- 2c.1 / 2c.2 / 2c.3 / 2c.5 -----
    step("2c.1", "like inserts like row and increments post.stats.likes", () => {
        const src = postsMutations();
        assertContains(src, 'db.insert("likes"', "2c.1 like insert");
        assertContains(src, "stats.likes + 1", "2c.1 stats increment");
        return `like insert at line ${lineNumber(src, 'db.insert("likes"')}`;
    });
    step("2c.2", "unlike floors at 0", () => {
        const src = postsMutations();
        assertContains(src, "Math.max(0, post.stats.likes - 1)", "2c.2 floor at 0");
        return `floor at line ${lineNumber(src, "Math.max(0, post.stats.likes - 1)")}`;
    });
    step("2c.3", "self-like does not create a notification", () => {
        const src = postsMutations();
        assertContains(src, "post.authorId !== user._id", "2c.3 self-like guard");
        return `guard at line ${lineNumber(src, "post.authorId !== user._id")}`;
    });
    step("2c.5", "posts.feed surfaces isValidated", () => {
        const src = postsQueries();
        const hasFlag = /isValidated/.test(src);
        if (!hasFlag) {
            throw new Error("2c.5: isValidated not present in posts/queries.ts");
        }
        return `isValidated referenced at line ${lineNumber(src, "isValidated")}`;
    });

    it("convex/lib/validation.ts exposes isValidAvatarUrl", () => {
        expect(libValidation()).toMatch(/isValidAvatarUrl/);
    });
});

export const module2Results = RESULTS;
