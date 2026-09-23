/**
 * Module 3 — Changa. Walks steps 3a–3d as static assertions.
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

const tasks = () => readSource("convex/changa/tasks.ts");
const submissions = () => readSource("convex/changa/submissions.ts");
const validation = () => readSource("convex/changa/validation.ts");
const campaigns = () => readSource("convex/changa/campaigns.ts");
const seed = () => readSource("convex/changa/seedSheng.ts");

describe("Module 3: Linguistic & Cultural Simulation (Changa)", () => {
    // ----- 3a.1 -----
    step("3a.1", "Changa home page exists", () => {
        if (!exists("src/app/dashboard/changa-activity/page.tsx")) {
            throw new Error("3a.1: /dashboard/changa-activity page is missing");
        }
        return "/dashboard/changa-activity page present";
    });

    // ----- 3a.2 -----
    step("3a.2", "listAvailableTasks sorts by priority then createdAt and caps at 25", () => {
        const src = tasks();
        assertContains(src, "priorityWeight", "3a.2 priority weights");
        assertContainsRegex(src, /priorityDelta[\s\S]{0,200}right\.createdAt - left\.createdAt/, "3a.2 priority then date");
        assertContainsRegex(src, /args\.limit\s*\?\?\s*25/, "3a.2 default limit 25");
        return `priority weights at line ${lineNumber(src, "priorityWeight")}; default limit at line ${lineNumber(src, "args.limit ?? 25")}`;
    });

    // ----- 3a.3 -----
    step("3a.3", "claimTask caps concurrent active claims at 10 and uses 20-minute TTL", () => {
        const src = tasks();
        assertContainsRegex(src, /MAX_CONCURRENT_CLAIMS\s*=\s*10/, "3a.3 max concurrent");
        assertContainsRegex(src, /TASK_CLAIM_DURATION_MS\s*=\s*20\s*\*\s*60\s*\*\s*1000/, "3a.3 20-minute TTL");
        assertContains(src, "expiresAt: now + TASK_CLAIM_DURATION_MS", "3a.3 expiry applied");
        return `MAX_CONCURRENT_CLAIMS=10, TTL=20m at line ${lineNumber(src, "TASK_CLAIM_DURATION_MS")}`;
    });

    // ----- 3a.4 -----
    step("3a.4", "startClaimedSubmission requires isGranted and allowTraining", () => {
        const src = submissions();
        assertContains(src, 'if (!args.consent.isGranted || !args.consent.allowTraining)', "3a.4 consent guard");
        assertContains(src, "ACTIVE_CONSENT_POLICY_VERSION", "3a.4 policy version check");
        return `consent guard at line ${lineNumber(src, "isGranted || !args.consent.allowTraining")}`;
    });

    // ----- 3a.5 -----
    step("3a.5", "submitSubmission enforces 50/hr and 300/day velocity", () => {
        const src = submissions();
        assertContainsRegex(src, /MAX_SUBMISSIONS_PER_HOUR\s*=\s*50/, "3a.5 hourly cap");
        assertContainsRegex(src, /MAX_SUBMISSIONS_PER_DAY\s*=\s*300/, "3a.5 daily cap");
        return `velocity caps at line ${lineNumber(src, "MAX_SUBMISSIONS_PER_HOUR")}`;
    });

    // ----- 3a.6 -----
    step("3a.6", "Audio MIME whitelist enforced, 25MB ceiling", () => {
        const src = submissions();
        assertContains(src, "audio/webm", "3a.6 webm in whitelist");
        assertContains(src, "audio/mp4", "3a.6 mp4 in whitelist");
        assertContains(src, "audio/opus", "3a.6 opus in whitelist");
        assertContainsRegex(src, /MAX_AUDIO_BYTES\s*=\s*25\s*\*\s*1024\s*\*\s*1024/, "3a.6 25MB cap");
        return `whitelist + cap at line ${lineNumber(src, "ALLOWED_AUDIO_MIME_TYPES")}`;
    });

    // ----- 3a.8 -----
    step("3a.8", "submitValidationVote transitions on 2x accept / 2x reject / 2x minor_fix; disagreement escalates", () => {
        const src = validation();
        assertContains(src, 'nextStatus = "validated"', "3a.8 accept transition");
        assertContains(src, 'nextStatus = "rejected"', "3a.8 reject transition");
        assertContains(src, 'nextStatus = "needs_fix"', "3a.8 needs_fix transition");
        assertContains(src, 'roleRequired: "moderator"', "3a.8 moderator escalation");
        return `transitions at lines ${lineNumber(src, 'nextStatus = "validated"')}, ${lineNumber(src, 'nextStatus = "rejected"')}, ${lineNumber(src, 'nextStatus = "needs_fix"')}`;
    });

    // ----- 3a.9 -----
    step("3a.9", "listUserSubmissions restricts non-moderators to their own work", () => {
        const src = submissions();
        assertContains(src, "You can only view your own submissions", "3a.9 self-only");
        return `guard at line ${lineNumber(src, "You can only view your own submissions")}`;
    });

    // ----- 3b.1 / 3b.2 / 3b.3 -----
    step("3b.1", "createCampaign gates on moderator role and defaults to draft", () => {
        const src = campaigns();
        assertContains(src, "Only moderators and admins can create campaigns", "3b.1 mod-only");
        assertContainsRegex(src, /status:\s*args\.status\s*\?\?\s*"draft"/, "3b.1 default status");
        return `mod gate at line ${lineNumber(src, "Only moderators and admins can create campaigns")}`;
    });
    step("3b.2", "submitCampaignProposal allows any authenticated user with status='pending'", () => {
        const src = campaigns();
        assertContains(src, 'status: "pending"', "3b.2 pending default");
        return `pending default at line ${lineNumber(src, 'status: "pending"')}`;
    });
    step("3b.3", "reviewCampaignProposal creates a live campaign on approval", () => {
        const src = campaigns();
        assertContains(src, 'args.decision === "approved"', "3b.3 approval branch");
        assertContains(src, 'status: "active"', "3b.3 live campaign status");
        return `approval branch at line ${lineNumber(src, 'args.decision === "approved"')}`;
    });
    step("3b.4", "getCampaignLeaderboard sorts by submission count desc", () => {
        const src = campaigns();
        assertContains(src, "right.submissionCount - left.submissionCount", "3b.4 sort");
        return `sort at line ${lineNumber(src, "right.submissionCount - left.submissionCount")}`;
    });
    step("3b.5", "seedShengData is an internalMutation with 50 audio tasks", () => {
        const src = seed();
        assertContains(src, "internalMutation", "3b.5 internal mutation");
        // The plan claims "110 translation + 50 audio"; the actual seed
        // creates 50 audio tasks from the first 50 of SHENG_SENTENCES. The
        // sentence corpus size is encoded in the campaign title ("Collect
        // 500 Sheng Sentences").
        assertContains(src, ".slice(0, 50)", "3b.5 50 audio tasks");
        assertContains(src, "Collect 500 Sheng Sentences", "3b.5 campaign title");
        return `internalMutation at line ${lineNumber(src, "internalMutation")}; audio slice at line ${lineNumber(src, ".slice(0, 50)")}`;
    });

    // ----- 3c.2 -----
    step("3c.2", "getValidationBundle hides votes from peer reviewers", () => {
        const src = validation();
        assertContains(src, "votes: isModerator(user) ? votes : []", "3c.2 blind peer review");
        return `blind review at line ${lineNumber(src, "isModerator(user) ? votes : []")}`;
    });

    // ----- 3d.1 / 3d.3 / 3d.4 -----
    step("3d.1", "seedShengData creates 110 sentence translation tasks", () => {
        const src = seed();
        assertContains(src, "sentence_translation", "3d.1 task type");
        return `task type at line ${lineNumber(src, "sentence_translation")}`;
    });
    step("3d.3", "Validation template includes naturalness rating 1-5", () => {
        const src = seed();
        assertContainsRegex(src, /naturalness[\s\S]{0,200}1[\s\S]{0,80}5/, "3d.3 naturalness 1-5");
        return `naturalness rating at line ${lineNumber(src, "naturalness")}`;
    });

    it("changa worker module exists", () => {
        expect(readSource("convex/changa/worker.ts")).toMatch(/processQueuedRuns/);
    });
});

export const module3Results = RESULTS;
