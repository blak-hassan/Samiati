/**
 * Gap catalog mirroring §3.2, §4.4, §5.5, §6.2 of
 * `plans/end-to-end-journey-simulation-plan.md`. Each entry's `verify`
 * function runs against the live source code; if it passes the gap is
 * marked `historical` (the underlying issue is no longer present).
 */
import { readSource, exists, lineNumber } from "./harness";

export type GapCategory =
    | "Auth gap"
    | "Data loss"
    | "Race condition"
    | "Missing route"
    | "Logic error"
    | "UX gap"
    | "Security issue"
    | "Persistence gap"
    | "Configuration gap";

export type GapStatus = "open" | "historical";

export interface Gap {
    id: string;
    title: string;
    category: GapCategory;
    severity: "Critical" | "High" | "Medium" | "Low";
    location: string;
    impact: string;
    suggestedFix: string;
    verify: () => { status: GapStatus; evidence: string };
}

const usersMutations = () => readSource("convex/users/mutations.ts");
const postsMutations = () => readSource("convex/posts/mutations.ts");
const feedback = () => readSource("convex/feedback.ts");
const chat = () => readSource("convex/chat.ts");
const translate = () => readSource("convex/translate.ts");
const aiSecurity = () => readSource("convex/lib/aiSecurity.ts");
const sunflower = () => readSource("convex/sunflower.ts");
const localConv = () => readSource("src/services/localConversationService.ts");
const submissionsTs = () => readSource("convex/changa/submissions.ts");
const tasksTs = () => readSource("convex/changa/tasks.ts");
const validationTs = () => readSource("convex/changa/validation.ts");
const campaignsTs = () => readSource("convex/changa/campaigns.ts");
const seedSheng = () => readSource("convex/changa/seedSheng.ts");
const schema = () => readSource("convex/schema.ts");
const useNav = () => readSource("src/hooks/useNavigation.ts");
const forgot = () => readSource("src/app/forgot-password/page.tsx");
const signUp = () => readSource("src/app/sign-up/[[...sign-up]]/page.tsx");
const signIn = () => readSource("src/app/sign-in/[[...sign-in]]/page.tsx");
const dashboard = () => readSource("src/app/dashboard/page.tsx");
const userSync = () => readSource("src/app/UserSync.tsx");
const settingsAccount = () => readSource("src/app/dashboard/settings/account/page.tsx");
const settingsNotif = () => readSource("src/app/dashboard/settings/notifications/page.tsx");
const settingsBlocked = () => readSource("src/app/dashboard/settings/blocked/page.tsx");
const settingsMuted = () => readSource("src/app/dashboard/settings/muted/page.tsx");
const settingsData = () => readSource("src/app/dashboard/settings/data/page.tsx");
const settingsHelp = () => readSource("src/app/dashboard/settings/help/page.tsx");
const settingsBilling = () => readSource("src/app/dashboard/settings/billing/page.tsx");

export const GAPS: Gap[] = [
    // -----------------------------------------------------------------------
    // Module 1 — Authentication & Onboarding
    // -----------------------------------------------------------------------
    {
        id: "AUTH-01",
        title: "Guest session has no profile-management UI",
        category: "UX gap",
        severity: "Medium",
        location: "src/app/dashboard/page.tsx:96-103",
        impact: "Guest users have no visible profile management; only GuestBanner + HomeSearchScreen render.",
        suggestedFix: "Either add a guest-profile screen reachable from GuestBanner, or remove the banner CTA and let the dashboard carry a placeholder profile card.",
        verify: () => {
            const src = dashboard();
            const hasGuestBranch = src.includes("!clerkUser") && src.includes("GuestBanner");
            const hasGuestProfileRoute = exists("src/app/dashboard/guest-profile/page.tsx");
            const evidence = hasGuestProfileRoute
                ? `guest-profile route exists (resolves to /dashboard/guest-profile); GuestBanner still wraps HomeSearchScreen for unauthenticated users at line ${lineNumber(src, "GuestBanner")}`
                : `no /dashboard/guest-profile route; unauthenticated users render GuestBanner + HomeSearchScreen at line ${lineNumber(src, "GuestBanner")}`;
            return {
                status: hasGuestBranch && !hasGuestProfileRoute ? "open" : "historical",
                evidence,
            };
        },
    },
    {
        id: "AUTH-02",
        title: "Handle collision race condition in user creation",
        category: "Race condition",
        severity: "High",
        location: "convex/users/mutations.ts:214-234",
        impact: "Two concurrent sign-ups with the same handle could both pass the existence check before either inserts.",
        suggestedFix: "Use a unique index on `users.handle` and let Convex reject the duplicate, or take an exclusive lock via a dedicated counter row.",
        verify: () => {
            const src = usersMutations();
            // Current `store` mutation: looks up by clerkId only; handle is not
            // touched. Therefore the "duplicate handle" check the plan calls
            // out doesn't exist in this code path at all.
            const handleLookup = /by_handle/i.test(src) || /\.handle\b/.test(src);
            const evidence = handleLookup
                ? `users.mutations.ts references a handle lookup at line ${lineNumber(src, "by_handle") || lineNumber(src, "handle")}`
                : `users.mutations.ts never queries by handle and does not patch a handle field; the race the plan describes is not present in the current store flow.`;
            return { status: handleLookup ? "open" : "historical", evidence };
        },
    },
    {
        id: "AUTH-03",
        title: "Clerk ↔ Convex sync gap",
        category: "Auth gap",
        severity: "High",
        location: "src/app/UserSync.tsx",
        impact: "If the client-side sync fails silently, the Clerk identity has no Convex record and all data operations fail.",
        suggestedFix: "Server-side webhook from Clerk that upserts the Convex `users` row; make UserSync a fallback, not the primary path.",
        verify: () => {
            const hasSync = exists("src/app/UserSync.tsx") || exists("src/app/usersync.tsx");
            const hasWebhook = exists("convex/clerkWebhook.ts") || exists("convex/webhooks/clerk.ts");
            if (!hasSync) {
                return { status: "historical", evidence: "No client-side UserSync module found; sync is not client-driven." };
            }
            return {
                status: hasWebhook ? "historical" : "open",
                evidence: hasWebhook
                    ? "UserSync exists but a server-side webhook also exists, removing the silent-failure window."
                    : "UserSync exists at src/app/UserSync.tsx and no server-side Clerk webhook module is present.",
            };
        },
    },
    {
        id: "AUTH-04",
        title: "Email verification not enforced",
        category: "Auth gap",
        severity: "Medium",
        location: "convex/lib/aiSecurity.ts:51-53 (enforceAiQuotaAction)",
        impact: "Plan claims users with unverified emails can fully interact; in practice AI actions reject unverified identities.",
        suggestedFix: "No fix needed if email verification is enforced at the AI gate; surface the gate error more clearly in the UI.",
        verify: () => {
            const src = aiSecurity();
            const enforced = /emailVerified\s*===\s*false/.test(src) && /verify your email address/i.test(src);
            return {
                status: enforced ? "historical" : "open",
                evidence: enforced
                    ? `aiSecurity.ts enforces email verification before AI calls (line ${lineNumber(src, "emailVerified")})`
                    : "aiSecurity.ts does not block unverified identities before AI calls.",
            };
        },
    },
    {
        id: "AUTH-05",
        title: "Forgot-password is mock-only in demo mode",
        category: "UX gap",
        severity: "Low",
        location: "src/app/forgot-password/page.tsx:41-44",
        impact: "In demo mode the form simulates a 1.5s delay and reports success without calling any backend.",
        suggestedFix: "When not in demo mode, fall through to Clerk's hosted reset flow (already wired at line 49). Add a banner clarifying demo vs. live behavior.",
        verify: () => {
            const src = forgot();
            const demoDelay = /isDemoMode[\s\S]{0,200}setTimeout\(\(resolve\)[\s\S]{0,200}1500/.test(src);
            const clerkPath = /reset_password_email_code/.test(src);
            return {
                status: demoDelay && clerkPath ? "open" : "historical",
                evidence: `demo branch at line ${lineNumber(src, "1500")}, Clerk path at line ${lineNumber(src, "reset_password_email_code")}`,
            };
        },
    },
    {
        id: "AUTH-06",
        title: "No onboarding wizard after sign-up",
        category: "UX gap",
        severity: "Medium",
        location: "missing",
        impact: "Plan reports no guided onboarding for language/interests/Changa consent.",
        suggestedFix: "Add a 3-step onboarding wizard reachable from /dashboard/onboarding.",
        verify: () => {
            const hasPage = exists("src/app/dashboard/onboarding/page.tsx");
            const hasMutation = /export const completeOnboarding\b/.test(usersMutations());
            return {
                status: hasPage && hasMutation ? "historical" : "open",
                evidence: hasPage
                    ? `onboarding page exists at /dashboard/onboarding; completeOnboarding mutation present in users/mutations.ts at line ${lineNumber(usersMutations(), "completeOnboarding")}`
                    : "no /dashboard/onboarding page; completeOnboarding mutation is present but no UI drives it.",
            };
        },
    },
    // -----------------------------------------------------------------------
    // Module 2 — Samiati AI
    // -----------------------------------------------------------------------
    {
        id: "SAM-01",
        title: "Chat history is localStorage-only",
        category: "Data loss",
        severity: "High",
        location: "src/services/localConversationService.ts",
        impact: "Conversations are persisted only in the browser. Clearing storage or switching devices loses the history.",
        suggestedFix: "Always persist via the Convex `conversations.mutations.saveConversation` mutation; treat localStorage as a write-through cache.",
        verify: () => {
            const hasService = exists("src/services/localConversationService.ts");
            const hasConvexConv = exists("convex/conversations/mutations.ts");
            // Server-round-trip wiring added with the sessions rework:
            // a hydration hook merges Convex rows into the local cache, and an
            // offline-safe queue uploads saves/metadata/deletes to Convex.
            const hasSyncQueue = exists("src/services/conversationSyncQueue.ts");
            const hasHydrationHook = exists("src/hooks/useSyncedConversations.ts");
            const schemaHasArchive = /isArchived: v.optional\(v.boolean\(\)\)/.test(schema());
            const dashboardWritesThrough = /syncSave/.test(dashboard());
            return {
                status: hasService && hasConvexConv && !(hasSyncQueue && hasHydrationHook) ? "open" : "historical",
                evidence: hasSyncQueue && hasHydrationHook && dashboardWritesThrough
                    ? "sync queue + hydration hook wired; dashboard saves flow through syncSave; conversations render from Convex on a fresh device (localStorage is a write-through cache). isArchived column: " + schemaHasArchive
                    : `sync queue: ${hasSyncQueue}, hydration hook: ${hasHydrationHook}, dashboard syncSave: ${dashboardWritesThrough}, isArchived column: ${schemaHasArchive}`,
            };
        },
    },
    {
        id: "SAM-02",
        title: "Two competing AI backends (chat.ts vs sunflower.ts)",
        category: "Logic error",
        severity: "Medium",
        location: "convex/chat.ts vs convex/sunflower.ts",
        impact: "Two action files implement similar chat translation. Maintenance burden and risk of divergent behavior.",
        suggestedFix: "Delete the legacy module and route all chat traffic through convex/chat.ts and convex/lib/aiRouter.ts.",
        verify: () => {
            const chatSrc = chat();
            const flowerSrc = sunflower();
            const chatExports = /export const sendMessage/.test(chatSrc);
            const flowerExports = /export const sendMessage/.test(flowerSrc);
            return {
                status: chatExports && flowerExports ? "open" : "historical",
                evidence: `convex/chat.ts exports sendMessage at line ${lineNumber(chatSrc, "export const sendMessage")}; convex/sunflower.ts exports sendMessage at line ${lineNumber(flowerSrc, "export const sendMessage")}`,
            };
        },
    },
    {
        id: "SAM-03",
        title: "Translation has no conversation context",
        category: "Logic error",
        severity: "Low",
        location: "convex/translate.ts:79-117",
        impact: "Stateless translation; no memory of prior exchanges.",
        suggestedFix: "Accept an optional `context` argument (already present at line 83) and include it in the prompt (already done). Document the contract.",
        verify: () => {
            const src = translate();
            const hasContext = /context: v\.optional\(v\.string\(\)\)/.test(src) && /prior exchange/.test(src);
            return {
                status: hasContext ? "historical" : "open",
                evidence: hasContext
                    ? `translate.ts already accepts an optional context argument and includes it in the prompt (line ${lineNumber(src, "prior exchange")})`
                    : "translate.ts does not accept any context argument",
            };
        },
    },
    {
        id: "SAM-04",
        title: "Feedback toggle off removes the record",
        category: "Logic error",
        severity: "Low",
        location: "convex/feedback.ts:36-49",
        impact: "Clicking thumbs-up twice deletes the record. Intentional but may surprise users.",
        suggestedFix: "Document the toggle behavior in the UI (tooltip or microcopy).",
        verify: () => {
            const src = feedback();
            const toggleOff = /Same vote — remove it \(toggle off\)/.test(src);
            return {
                status: toggleOff ? "open" : "historical",
                evidence: toggleOff
                    ? `feedback.ts deletes the record on repeated same-vote (line ${lineNumber(src, "remove it (toggle off)")})`
                    : "feedback.ts no longer removes records on a repeated same-vote",
            };
        },
    },
    {
        id: "SAM-05",
        title: "Like count race condition",
        category: "Race condition",
        severity: "High",
        location: "convex/posts/mutations.ts:99-103",
        impact: "Read-then-patch on post.stats.likes can lose concurrent increments.",
        suggestedFix: "Use a separate `likeCount` table keyed by postId and increment via a dedicated internal mutation, or use Convex atomic `db.patch` with `$inc` semantics.",
        verify: () => {
            const src = postsMutations();
            const readThenPatch = /const post = await ctx\.db\.get\(args\.postId\);[\s\S]{0,200}stats\.likes \+ 1/.test(src);
            return {
                status: readThenPatch ? "open" : "historical",
                evidence: readThenPatch
                    ? `posts.like still reads post then patches stats.likes + 1 (line ${lineNumber(src, "stats: { ...post.stats, likes: post.stats.likes + 1 }")})`
                    : "posts.like no longer performs a read-then-patch on likes",
            };
        },
    },
    {
        id: "SAM-06",
        title: "No post editing flow",
        category: "UX gap",
        severity: "Low",
        location: "convex/posts/mutations.ts:134-185",
        impact: "Plan claims posts cannot be edited. `editPost` exists for author/admin/moderator.",
        suggestedFix: "Wire `editPost` to the post-thread UI; expose an edit button gated by role.",
        verify: () => {
            const src = postsMutations();
            const hasEdit = /export const editPost\b/.test(src);
            const wired = exists("src/components/post/PostEditButton.tsx") || exists("src/components/posts/EditPostButton.tsx");
            return {
                status: hasEdit ? "open" : "historical",
                evidence: hasEdit
                    ? `editPost mutation present at line ${lineNumber(src, "export const editPost")}; UI wiring ${wired ? "exists" : "not yet wired to post-thread"}`
                    : "no editPost mutation",
            };
        },
    },
    {
        id: "SAM-07",
        title: "AI quota tier hardcoded to 'free'",
        category: "Configuration gap",
        severity: "High",
        location: "convex/lib/aiSecurity.ts:46 (plan reference)",
        impact: "Plan asserts paid plans get no benefit. Current code resolves tier via getUserPlanTier.",
        suggestedFix: "None required; confirm billing integration in tests/journey.",
        verify: () => {
            const src = aiSecurity();
            const usesTier = /getUserPlanTier/.test(src) && /tier = planTier/.test(src);
            return {
                status: usesTier ? "historical" : "open",
                evidence: usesTier
                    ? `enforceAiQuotaAction calls internal.payments.billing.getUserPlanTier (line ${lineNumber(src, "getUserPlanTier")}) and passes the resulting tier to enforceAiQuota`
                    : "enforceAiQuotaAction does not read tier from billing",
            };
        },
    },
    {
        id: "SAM-08",
        title: "AI quota mutation receives the wrong tier",
        category: "Configuration gap",
        severity: "High",
        location: "convex/lib/aiSecurity.ts:67-71 (plan reference)",
        impact: "Plan claims the internal mutation always receives tier:\"free\". Current code passes the resolved tier.",
        suggestedFix: "None required.",
        verify: () => {
            const src = aiSecurity();
            const passesTier = /tier,[\s\S]{0,200}internal\.lib\.aiSecurity\.enforceAiQuota/.test(src) || /enforceAiQuota,[\s\S]{0,200}tier,/.test(src);
            return {
                status: passesTier ? "historical" : "open",
                evidence: passesTier
                    ? "enforceAiQuotaAction forwards the resolved tier into enforceAiQuota"
                    : "enforceAiQuota does not receive the resolved tier",
            };
        },
    },
    // -----------------------------------------------------------------------
    // Module 3 — Changa
    // -----------------------------------------------------------------------
    {
        id: "CHANGA-01",
        title: "Consent form lacks inline explanation",
        category: "UX gap",
        severity: "Medium",
        location: "convex/changa/submissions.ts:17-27",
        impact: "Consent requires allowTraining/allowResearch but UI doesn't explain what they mean.",
        suggestedFix: "Pass a `summaryText` from the active `changaConsentPolicies` row to the consent UI and render it as a tooltip.",
        verify: () => {
            const src = submissionsTs();
            const hasSummary = /summaryText/.test(src);
            return {
                status: hasSummary ? "historical" : "open",
                evidence: hasSummary
                    ? `submissions.ts references summaryText from changaConsentPolicies (line ${lineNumber(src, "summaryText")})`
                    : "submissions.ts does not surface consent policy summary text",
            };
        },
    },
    {
        id: "CHANGA-02",
        title: "Changa campaigns route missing",
        category: "Missing route",
        severity: "High",
        location: "src/app/dashboard/changa-campaigns/page.tsx",
        impact: "Plan reported the route was missing.",
        suggestedFix: "None required — already exists.",
        verify: () => {
            const hasPage = exists("src/app/dashboard/changa-campaigns/page.tsx");
            const navMapped = /Screen\.CHANGA_CAMPAIGNS[\s\S]{0,200}changa-campaigns/.test(useNav());
            return {
                status: hasPage && navMapped ? "historical" : "open",
                evidence: `changa-campaigns page: ${hasPage ? "present" : "missing"}; Screen.CHANGA_CAMPAIGNS maps to route: ${navMapped ? "yes" : "no"}`,
            };
        },
    },
    {
        id: "CHANGA-03",
        title: "No Changa campaign discovery UI",
        category: "UX gap",
        severity: "Medium",
        location: "convex/changa/campaigns.ts:9-23",
        impact: "`listActiveCampaigns` exists but there's no browse UI with language/task-type filters.",
        suggestedFix: "Add a ChangaCampaigns page with language + taskType filters wired to listActiveCampaigns.",
        verify: () => {
            const hasList = /export const listActiveCampaigns\b/.test(campaignsTs());
            const hasUi = exists("src/components/changa/ChangaCampaigns.tsx");
            return {
                status: hasList && hasUi ? "historical" : "open",
                evidence: `listActiveCampaigns: ${hasList ? "present" : "missing"}; ChangaCampaigns UI component: ${hasUi ? "present" : "missing"}`,
            };
        },
    },
    {
        id: "CHANGA-04",
        title: "Audio upload is fragile",
        category: "UX gap",
        severity: "High",
        location: "convex/changa/submissions.ts (attachSubmissionAsset); src/components/changa/inputs/",
        impact: "Audio MIME whitelist (webm, wav, mpeg, mp4, ogg, aac, flac, opus, m4a) is enforced server-side but UI components may not use it.",
        suggestedFix: "Add a typed `<AudioRecorder />` component that calls Convex storage upload and then attachSubmissionAsset.",
        verify: () => {
            const src = submissionsTs();
            const hasWhitelist = /ALLOWED_AUDIO_MIME_TYPES/.test(src);
            const hasRecorder = exists("src/components/changa/inputs/AccentRecorder.tsx") || exists("src/components/changa/inputs/QuickRecord.tsx");
            return {
                status: hasWhitelist && hasRecorder ? "historical" : "open",
                evidence: `whitelist present: ${hasWhitelist}; audio recorder UI: ${hasRecorder}`,
            };
        },
    },
    {
        id: "CHANGA-05",
        title: "Sheng seed is internal-only",
        category: "Configuration gap",
        severity: "Low",
        location: "convex/changa/seedSheng.ts:114",
        impact: "Cannot trigger from the app; CLI only.",
        suggestedFix: "Add an admin-only mutation in the dashboard that invokes seedShengData.",
        verify: () => {
            const src = seedSheng();
            const isInternal = /export const seedShengData = internalMutation/.test(src);
            return {
                status: isInternal ? "open" : "historical",
                evidence: isInternal
                    ? `seedShengData is internalMutation (line ${lineNumber(src, "seedShengData = internalMutation")})`
                    : "seedShengData is exposed as a regular mutation",
            };
        },
    },
    {
        id: "CHANGA-06",
        title: "Validation queue loads all languages when unfiltered",
        category: "Logic error",
        severity: "Medium",
        location: "convex/changa/validation.ts:51-63",
        impact: "Without languageCode, listValidationQueue scans every in_validation submission across all languages.",
        suggestedFix: "Default the queue to the reviewer's primary language (the plan claims this is already done at line 53).",
        verify: () => {
            const src = validationTs();
            const defaulted = /effectiveLang[\s\S]{0,200}user\.languages\?\.0\?\.id/.test(src);
            return {
                status: defaulted ? "historical" : "open",
                evidence: defaulted
                    ? `listValidationQueue defaults the queue to user.languages[0].id when no languageCode is provided (line ${lineNumber(src, "user.languages")})`
                    : "listValidationQueue does not default the queue to the reviewer's primary language",
            };
        },
    },
    {
        id: "CHANGA-07",
        title: "Campaign currentCount never auto-incremented",
        category: "Logic error",
        severity: "Medium",
        location: "convex/changa/campaigns.ts:72",
        impact: "currentCount starts at 0 and never increments on validation.",
        suggestedFix: "Bump currentCount in submitValidationVote when status transitions to validated.",
        verify: () => {
            const v = validationTs();
            const increments = /currentCount:\s*\(campaign\.currentCount\s*\?\?\s*0\)\s*\+\s*1/.test(v);
            return {
                status: increments ? "historical" : "open",
                evidence: increments
                    ? `submitValidationVote increments campaign.currentCount when a submission validates (line ${lineNumber(v, "currentCount:")})`
                    : "no currentCount increment in validation.ts",
            };
        },
    },
    {
        id: "CHANGA-08",
        title: "Changa XP not integrated with social XP",
        category: "Logic error",
        severity: "Low",
        location: "convex/changa/validators.ts:80-86",
        impact: "changaRewardProfileValidator defines XP rewards but no main XP integration.",
        suggestedFix: "When a submission is validated, award the user.socialXp by rewardProfile.xp.",
        verify: () => {
            const v = validationTs();
            const awards = /award[\s\S]{0,80}xp|changaXp|user\.xp/i.test(v) || exists("convex/changa/xp.ts");
            return {
                status: awards ? "historical" : "open",
                evidence: awards
                    ? `validation.ts or changa/xp.ts has social-XP integration`
                    : "no social XP award in validation.ts and no convex/changa/xp.ts",
            };
        },
    },
    {
        id: "CHANGA-09",
        title: "Worker processing is cron-dependent",
        category: "Configuration gap",
        severity: "High",
        location: "convex/changa/worker.ts:41-128",
        impact: "Submissions can be stuck in 'submitted' if the cron never runs.",
        suggestedFix: "Expose a server-side fallback that triggers processQueuedRuns from any submission mutation.",
        verify: () => {
            const hasCron = exists("convex/crons.ts") && /changa/i.test(readSource("convex/crons.ts"));
            return {
                status: hasCron ? "open" : "historical",
                evidence: hasCron
                    ? "crons.ts schedules changa processing; if the cron fails, no fallback path is documented in worker.ts"
                    : "no changa cron entry found",
            };
        },
    },
    {
        id: "CHANGA-10",
        title: "No offline queue for Changa",
        category: "Persistence gap",
        severity: "Medium",
        location: "src/components/changa/TaskContributionScreen.tsx + src/lib/changaOfflineQueue.ts",
        impact: "Plan reported failed text submissions were lost. Resolved at PR head.",
        suggestedFix: "None required.",
        verify: () => {
            const hasQueue = exists("src/lib/changaOfflineQueue.ts");
            const hasRequeue = /requeueChangaSubmission|requeueChanga/.test(readSource("src/components/changa/TaskContributionScreen.tsx"));
            return {
                status: hasQueue && hasRequeue ? "historical" : "open",
                evidence: `changaOfflineQueue.ts: ${hasQueue ? "present" : "missing"}; requeue marker in TaskContributionScreen: ${hasRequeue}`,
            };
        },
    },
    {
        id: "CHANGA-11",
        title: "Submission dialect/region mismatch not enforced",
        category: "Logic error",
        severity: "Low",
        location: "convex/changa/submissions.ts:223-238",
        impact: "Plan reported the check was missing. Current code rejects mismatches.",
        suggestedFix: "None required.",
        verify: () => {
            const src = submissionsTs();
            const checks = /Submission dialect does not match the task/.test(src) && /Submission region does not match the task/.test(src);
            return {
                status: checks ? "historical" : "open",
                evidence: checks
                    ? `submissions.ts enforces dialect + region match (line ${lineNumber(src, "dialect does not match")})`
                    : "dialect/region mismatch not enforced",
            };
        },
    },
    {
        id: "CHANGA-12",
        title: "Duplicate detection is a placeholder",
        category: "Logic error",
        severity: "Medium",
        location: "convex/changa/processing.ts",
        impact: "calculateTextSimilarity is basic; no real duplicate detection against curated examples.",
        suggestedFix: "Compare against changaCuratedExamples using a real similarity metric.",
        verify: () => {
            const proc = readSource("convex/changa/processing.ts");
            const isPlaceholder = /calculateTextSimilarity/.test(proc) || /TODO.*duplicate/i.test(proc);
            return {
                status: isPlaceholder ? "open" : "historical",
                evidence: isPlaceholder
                    ? "calculateTextSimilarity present; no vector-based dedupe against changaCuratedExamples"
                    : "real duplicate detection is in place",
            };
        },
    },
    // -----------------------------------------------------------------------
    // Module 4 — Settings
    // -----------------------------------------------------------------------
    {
        id: "SET-01",
        title: "Settings screens without backend logic",
        category: "Missing route",
        severity: "Medium",
        location: "src/app/dashboard/settings/data|help/page.tsx",
        impact: "Pages render but have no Convex queries/mutations wired.",
        suggestedFix: "Wire each page to its corresponding table and a settings export query.",
        verify: () => {
            const pages = ["data", "help"].map((s) => `src/app/dashboard/settings/${s}/page.tsx`);
            const allExist = pages.every((p) => exists(p));
            const blockedBackend = /blockedUsers/.test(readSource("convex/schema.ts"));
            const mutedBackend = /mutedWords/.test(readSource("convex/schema.ts"));
            const dataBackend = exists("convex/settings/mutations.ts") || /exportUserData/.test(usersMutations());
            return {
                status: allExist && blockedBackend && mutedBackend && dataBackend ? "historical" : "open",
                evidence: `pages: ${allExist}, blockedBackend: ${blockedBackend}, mutedBackend: ${mutedBackend}, dataBackend: ${dataBackend}`,
            };
        },
    },
    {
        id: "SET-02",
        title: "Notification preferences are UI-only",
        category: "Persistence gap",
        severity: "Medium",
        location: "src/app/dashboard/settings/notifications/page.tsx",
        impact: "Toggles have no persistent effect; the notificationPreferences field is in the schema but never written.",
        suggestedFix: "Wire toggles to updateNotificationPreferences and reload the user doc.",
        verify: () => {
            const hasMutation = /export const updateNotificationPreferences\b/.test(usersMutations());
            const hasField = /notificationPreferences: v\.optional/.test(schema());
            const uiWired = /updateNotificationPreferences/.test(settingsNotif());
            return {
                status: hasMutation && hasField && uiWired ? "historical" : "open",
                evidence: `mutation: ${hasMutation}, schema field: ${hasField}, UI wired: ${uiWired}`,
            };
        },
    },
    {
        id: "SET-03",
        title: "Profile visibility not enforced in queries",
        category: "Security issue",
        severity: "High",
        location: "convex/schema.ts:78 (users.profileVisible)",
        impact: "privateProfile flag exists but no query filters on it.",
        suggestedFix: "Update profile/queries.ts to return null for users where profileVisible === false (except for self/admin).",
        verify: () => {
            const pq = exists("convex/profile/queries.ts") ? readSource("convex/profile/queries.ts") : "";
            const enforced = /profileVisible\s*===\s*false/.test(pq);
            return {
                status: enforced ? "historical" : "open",
                evidence: enforced
                    ? `convex/profile/queries.ts filters on profileVisible (line ${lineNumber(pq, "profileVisible")})`
                    : "no profileVisible filter in convex/profile/queries.ts",
            };
        },
    },
    {
        id: "SET-04",
        title: "No language deletion flow",
        category: "UX gap",
        severity: "Low",
        location: "convex/users/mutations.ts:84-95",
        impact: "Languages can be added via updateProfile but never removed.",
        suggestedFix: "Add a removeLanguage mutation, or accept a `replace` flag on updateProfile.",
        verify: () => {
            const src = usersMutations();
            const hasRemove = /removeLanguage|deleteLanguage/i.test(src);
            return {
                status: hasRemove ? "historical" : "open",
                evidence: hasRemove
                    ? `users.mutations.ts has a language-removal entry point (line ${lineNumber(src, "removeLanguage") || lineNumber(src, "deleteLanguage")})`
                    : "no language removal mutation",
            };
        },
    },
    {
        id: "SET-05",
        title: "Password change is Clerk-only",
        category: "Configuration gap",
        severity: "Low",
        location: "src/app/dashboard/change-password/page.tsx",
        impact: "No backend handler in this repo; Clerk handles the change.",
        suggestedFix: "None required; document the dependency in the page header.",
        verify: () => {
            const page = exists("src/app/dashboard/change-password/page.tsx");
            return {
                status: page ? "open" : "historical",
                evidence: page
                    ? "change-password page delegates to Clerk; demo mode shows the form but submit is a no-op"
                    : "no change-password page",
            };
        },
    },
    {
        id: "SET-06",
        title: "No account deletion / GDPR export flow",
        category: "Security issue",
        severity: "High",
        location: "missing",
        impact: "Plan reports no UI for account deletion or data export.",
        suggestedFix: "Add /dashboard/settings/data with export and delete buttons wired to exportUserData and deleteAccount.",
        verify: () => {
            const hasExport = /export const exportUserData\b/.test(usersMutations());
            const hasDelete = /export const deleteAccount\b/.test(usersMutations());
            const pageWired = /exportUserData|deleteAccount/.test(settingsData());
            return {
                status: hasExport && hasDelete && pageWired ? "historical" : "open",
                evidence: `exportUserData: ${hasExport}, deleteAccount: ${hasDelete}, settings/data wired: ${pageWired}`,
            };
        },
    },
    {
        id: "SET-07",
        title: "culturalBackground field has no editing UI",
        category: "UX gap",
        severity: "Low",
        location: "convex/schema.ts:42",
        impact: "Schema field exists but settings screens don't expose it.",
        suggestedFix: "Add a `culturalBackground` textarea to /dashboard/edit-profile wired to updateProfile.",
        verify: () => {
            const ep = exists("src/app/dashboard/edit-profile/page.tsx") ? readSource("src/app/dashboard/edit-profile/page.tsx") : "";
            const wired = /culturalBackground/.test(ep);
            return {
                status: wired ? "historical" : "open",
                evidence: wired
                    ? `edit-profile page references culturalBackground (line ${lineNumber(ep, "culturalBackground")})`
                    : "no UI references culturalBackground",
            };
        },
    },
    {
        id: "SET-08",
        title: "Notifications have no read-state mutation visible to the user",
        category: "UX gap",
        severity: "Low",
        location: "convex/notifications/",
        impact: "Plan claims no bulk mark-as-read; the notifications table is unread until a mutation runs.",
        suggestedFix: "Add a `markAllRead` mutation and a Settings link to it.",
        verify: () => {
            const m = readSource("convex/notifications/mutations.ts");
            const hasBulk = /markAllRead|markAsRead|read\s*:\s*true/.test(m);
            return {
                status: hasBulk ? "historical" : "open",
                evidence: hasBulk
                    ? `convex/notifications/mutations.ts has a mark-read helper (line ${lineNumber(m, "markAllRead") || lineNumber(m, "markAsRead") || lineNumber(m, "read: true")})`
                    : "no mark-read mutation in convex/notifications/mutations.ts",
            };
        },
    },
];

export const ALL_GAP_IDS = GAPS.map((g) => g.id);

export function runGapChecks(): { gaps: { id: string; status: GapStatus; evidence: string }[] } {
    return {
        gaps: GAPS.map((g) => {
            const r = g.verify();
            return { id: g.id, status: r.status, evidence: r.evidence };
        }),
    };
}
