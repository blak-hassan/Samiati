"use client";

/**
 * Changa-aware Convex hooks with a non-production fallback.
 *
 * WHY THIS EXISTS: when the Convex deployment is unavailable (disabled
 * plan, missing backend, offline dev), every Changa `useQuery` either stays
 * `undefined` forever or — worse — `useQuery` *throws during render* when the
 * backend answers with an error, which would blow up the whole Changa section
 * behind an error boundary. Neither state lets a tester exercise the feature
 * end-to-end, and a render throw cannot be recovered from after the fact.
 *
 * So detection happens BEFORE we subscribe, not after:
 *
 *   1. The first wrapped hook fires a single probe `fetch` against the
 *      deployment's HTTP query endpoint (`<url>/api/query`) for a public,
 *      argument-less query (`changa/badges:listBadges`).
 *   2. While the probe is in flight the wrapped query is passed `"skip"`, so
 *      no subscription is ever created against a backend that may throw.
 *   3. Probe ok   → real `convex/react` behavior, unchanged.
 *      Probe down → a module-level flag flips to `"down"` (shared by every
 *      Changa screen, so only the first one pays the probe) and all wrapped
 *      queries resolve from the demo dataset in `src/lib/changaDemoData.ts`
 *      while wrapped mutations resolve with plausible mock results, so the
 *      full claim → contribute → validate → curate pipeline can be clicked
 *      through.
 *   4. In production builds the wrapper is fully transparent: no probe, no
 *      skip, no mocks — behavior is identical to `convex/react` (per the
 *      appMode rule that production must never silently fall back to fake
 *      data).
 *
 * Guest users get the same empty/authenticated shapes the real queries
 * return for them (no stats, no submissions, empty queue) so the existing
 * e2e empty-state expectations keep passing.
 */

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
    useMutation,
    useQuery,
    type OptionalRestArgsOrSkip,
    type ReactMutation,
} from "convex/react";
import type {
    FunctionReference,
    FunctionReturnType,
    OptionalRestArgs,
} from "convex/server";
import { useAppUser } from "@/hooks/useAppUser";
import {
    DEMO_BADGES,
    DEMO_CAMPAIGNS,
    DEMO_CURATED_EXAMPLES,
    DEMO_INVITE_CODE,
    DEMO_LEADERBOARD,
    DEMO_PROFILE,
    DEMO_SUBMISSIONS,
    DEMO_TASKS,
    DEMO_USER_STATS,
    DEMO_VALIDATION_QUEUE,
    demoLanguageStats,
    demoSubmissionStatus,
} from "@/lib/changaDemoData";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = any;

export const changaFallbackAllowed: boolean = process.env.NODE_ENV !== "production";
const BACKEND_TIMEOUT_MS = 3000;

// Convex tags every function reference with this global-registry symbol
// (`Symbol.for("functionName")` in `convex/server`), so we can resolve the
// canonical name without importing the server bundle at runtime.
const CONVEX_FUNCTION_NAME = Symbol.for("functionName");

/**
 * Read the canonical Convex function name (e.g. `"changa/tasks:claimTask"`).
 *
 * Mock lookups MUST key on this string: the generated `api` object is a Proxy
 * that hands back a brand-new reference on every property access, so
 * identity-keyed maps would never match.
 */
function describeFunction(reference: unknown): string {
    try {
        const name = (reference as Record<symbol, unknown> | null)?.[CONVEX_FUNCTION_NAME];
        if (typeof name === "string") return name;
    } catch {
        // Reading the symbol off an incomplete api path (e.g. `api.changa`) throws.
    }
    return typeof reference === "string" ? reference : "unknown-function";
}

// ---------------------------------------------------------------------------
// Backend availability probe — resolved once per page load, shared by every
// screen, so only the first wrapped hook pays for it.
// ---------------------------------------------------------------------------

type BackendStatus = "unknown" | "ok" | "down";

let backendStatus: BackendStatus = "unknown";
const statusListeners = new Set<() => void>();

function setBackendStatus(next: BackendStatus): void {
    if (backendStatus === next) return;
    backendStatus = next;
    for (const listener of statusListeners) listener();
}

function subscribeBackendStatus(onChange: () => void) {
    statusListeners.add(onChange);
    return () => {
        statusListeners.delete(onChange);
    };
}

// A public, argument-less query used purely as a liveness probe: on a healthy
// deployment it returns the badge catalog without requiring auth.
const PROBE_FUNCTION_PATH = "changa/badges:listBadges";

let probePromise: Promise<void> | null = null;

function probeChangaBackend(): Promise<void> {
    if (probePromise) return probePromise;

    probePromise = (async () => {
        if (!changaFallbackAllowed) {
            setBackendStatus("ok");
            return;
        }

        const url = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (!url) {
            setBackendStatus("down");
            console.warn(
                "[changa] NEXT_PUBLIC_CONVEX_URL is not set — serving the Changa demo dataset.",
            );
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
        try {
            const response = await fetch(`${url.replace(/\/+$/, "")}/api/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: PROBE_FUNCTION_PATH, args: {}, format: "json" }),
                signal: controller.signal,
            });
            const payload = (await response.json().catch(() => null)) as {
                status?: string;
                errorMessage?: string;
            } | null;

            if (response.ok && payload?.status === "success") {
                setBackendStatus("ok");
                return;
            }

            setBackendStatus("down");
            console.warn(
                `[changa] Convex backend returned ${response.status} — serving the Changa demo dataset (non-production only).`,
                payload?.errorMessage ?? "",
            );
        } catch (error) {
            setBackendStatus("down");
            console.warn(
                "[changa] Convex backend unreachable — serving the Changa demo dataset (non-production only).",
                error,
            );
        } finally {
            clearTimeout(timer);
        }
    })();

    return probePromise;
}

function useBackendStatus(): BackendStatus {
    const status = useSyncExternalStore(
        subscribeBackendStatus,
        () => backendStatus,
        // Server snapshot: keeps hydration clean (the probe only runs in an
        // effect). Production short-circuits to "ok" below regardless.
        () => "unknown" as BackendStatus,
    );

    useEffect(() => {
        if (changaFallbackAllowed) void probeChangaBackend();
    }, []);

    return changaFallbackAllowed ? status : "ok";
}

// ---------------------------------------------------------------------------
// Mock resolvers, keyed by canonical Convex function name (see
// `describeFunction`) so call sites need no changes beyond the import swap.
// ---------------------------------------------------------------------------

// Submissions created through mocked mutations during the session, so the
// "my activity" list reflects what the tester just did.
let mockSubmissionCounter = 0;
const dynamicSubmissions: AnyFn[] = [];
const votedSubmissionIds = new Set<string>();

const QUERY_MOCKS = new Map<string, (args: AnyFn, isSignedIn: boolean) => AnyFn>([
    ["changa/tasks:listAvailableTasks", (args) => {
        const tasks = DEMO_TASKS.filter(
            (task) => !args?.languageCode || task.languageCode === args.languageCode,
        );
        return tasks.slice(0, args?.limit ?? 25);
    }],
    ["changa/tasks:getTask", (args) =>
        DEMO_TASKS.find((task) => task._id === args?.taskId) ?? null],
    ["changa/submissions:listUserSubmissions", (args, isSignedIn) => {
        if (!isSignedIn) return [];
        return [...dynamicSubmissions, ...DEMO_SUBMISSIONS]
            .sort((left, right) => right.updatedAt - left.updatedAt)
            .slice(0, args?.limit ?? 50);
    }],
    ["changa/submissions:listAllSubmissions", (_args, isSignedIn) =>
        isSignedIn ? [...dynamicSubmissions, ...DEMO_SUBMISSIONS] : []],
    ["changa/campaigns:listActiveCampaigns", (args) =>
        DEMO_CAMPAIGNS.filter(
            (campaign) => !args?.languageCode || campaign.languageCode === args.languageCode,
        ).slice(0, args?.limit ?? 20)],
    ["changa/campaigns:getCampaignWithLeaderboard", () => DEMO_LEADERBOARD],
    ["changa/badges:listBadges", () => DEMO_BADGES],
    ["changa/stats:getUserContributionStats", (_args, isSignedIn) =>
        isSignedIn ? DEMO_USER_STATS : null],
    ["changa/stats:getLanguageProgressStats", (args) =>
        demoLanguageStats(args?.languageCode ?? "sheng")],
    ["changa/invites:getMyInviteCode", (_args, isSignedIn) =>
        isSignedIn ? DEMO_INVITE_CODE : null],
    ["users/queries:getProfile", (_args, isSignedIn) =>
        isSignedIn ? DEMO_PROFILE : null],
    ["changa/validation:listValidationQueue", (_args, isSignedIn) => {
        if (!isSignedIn) return [];
        return DEMO_VALIDATION_QUEUE.filter(
            (item) => !votedSubmissionIds.has(item._id),
        );
    }],
    ["changa/validation:getValidationBundle", (args) => {
        const submission = DEMO_SUBMISSIONS.find((s) => s._id === args?.submissionId);
        return submission ? { ...submission, assets: [], votes: [] } : null;
    }],
    ["changa/validation:getSubmissionAssetUrl", () => null],
    ["changa/processing:getSubmissionStatus", (args) =>
        demoSubmissionStatus(String(args?.submissionId ?? ""))],
    ["changa/curation:listCuratedCandidates", (_args, isSignedIn) =>
        isSignedIn
            ? [...dynamicSubmissions, ...DEMO_SUBMISSIONS].filter(
                  (s) => s.status === "validated",
              )
            : []],
    ["changa/curation:listDatasetReleaseCandidates", (_args, isSignedIn) =>
        isSignedIn ? DEMO_CURATED_EXAMPLES : []],
]);

const MUTATION_MOCKS = new Map<string, (args: AnyFn) => AnyFn>([
    ["changa/tasks:claimTask", () => ({ claimId: "demo_claim_1" })],
    ["changa/tasks:skipTask", (args) => args?.claimId ?? null],
    ["changa/submissions:startClaimedSubmission", () => {
        mockSubmissionCounter += 1;
        return `demo_new_sub_${mockSubmissionCounter}`;
    }],
    ["changa/submissions:submitSubmission", (args) => {
        mockSubmissionCounter += 1;
        const submissionId = args?.submissionId ?? `demo_new_sub_${mockSubmissionCounter}`;
        dynamicSubmissions.push({
            _id: String(submissionId),
            taskId: "demo_task_1",
            submissionType: "phrase_translation",
            languageCode: "sheng",
            sourceText: "Demo task",
            targetText: args?.targetText ?? undefined,
            transcriptText: args?.transcriptText ?? undefined,
            consent: { isGranted: true, allowTraining: true, allowResearch: false, allowPublicAttribution: false, grantedAt: Date.now() },
            consentPolicyVersion: "changa-pilot-v1",
            license: "community",
            status: "submitted",
            submittedAt: Date.now(),
            updatedAt: Date.now(),
        });
        return submissionId;
    }],
    ["changa/submissions:attachSubmissionAsset", () => "demo_asset_1"],
    ["changa/invites:generateInviteCode", () => DEMO_INVITE_CODE],
    ["changa/seedSheng:triggerSeedSheng", () => ({ success: true })],
    ["changa/validation:submitValidationVote", (args) => {
        if (args?.submissionId) votedSubmissionIds.add(String(args.submissionId));
        return "demo_vote_1";
    }],
    ["changa/validation:escalateSubmission", () => "demo_assignment_1"],
    ["changa/campaigns:createCampaign", () => "demo_campaign_new"],
    ["changa/campaigns:submitCampaignProposal", () => "demo_proposal_1"],
    ["changa/curation:promoteSubmissionToCuratedExample", () => "demo_curated_new"],
    ["changa/curation:approveCuratedExample", (args) => args?.exampleId ?? null],
    ["changa/customTasks:createCustomTemplate", () => "demo_custom_template_1"],
    ["changa/customTasks:submitCustomSubmission", () => {
        mockSubmissionCounter += 1;
        return { submissionId: `demo_new_sub_${mockSubmissionCounter}`, xp: { baseXp: 8, bonusXp: 0, totalXp: 8 } };
    }],
    ["changa/documents:createQuickLink", () => "demo_document_1"],
    ["changa/documents:createDocument", () => "demo_document_2"],
    ["changa/documents:bulkAddDocumentEntries", (args) =>
        Array.isArray(args?.entries) ? args.entries.length : 0],
]);

// ---------------------------------------------------------------------------
// Public hooks — drop-in replacements for `convex/react` useQuery/useMutation
// on Changa screens (same call signature, so call sites only swap imports).
// ---------------------------------------------------------------------------

export function useChangaQuery<Query extends FunctionReference<"query">>(
    query: Query,
    ...args: OptionalRestArgsOrSkip<Query>
): FunctionReturnType<Query> | undefined {
    const status = useBackendStatus();
    const fallback = status === "down";
    const { isSignedIn } = useAppUser();

    // Never subscribe to a backend we already know is broken: `useQuery`
    // throws during render on an error result, which would take the whole
    // Changa section down with it. `"skip"` is a real Convex arg and is safe
    // for every generated reference (see `OptionalRestArgsOrSkip`).
    const skip = fallback && args[0] !== "skip";
    const real = useQuery(query, ...((skip ? ["skip"] : args) as OptionalRestArgs<Query>));

    const name = useMemo(() => describeFunction(query), [query]);
    const resolver = fallback && !skip ? QUERY_MOCKS.get(name) : undefined;
    const argsKey = JSON.stringify(args[0] ?? null);

    return useMemo(() => {
        if (!fallback) return real;
        if (skip || !resolver) return real;
        return resolver(args[0], isSignedIn) as FunctionReturnType<Query>;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fallback, skip, resolver, name, argsKey, isSignedIn, real]);
}

export function useChangaMutation<Mutation extends FunctionReference<"mutation">>(
    mutation: Mutation,
): ReactMutation<Mutation> {
    const real = useMutation(mutation);
    const fallback = useBackendStatus() === "down";
    const name = useMemo(() => describeFunction(mutation), [mutation]);

    return useMemo(() => {
        if (!fallback) return real;

        const mocked = async (args?: AnyFn): Promise<AnyFn> => {
            const mock = MUTATION_MOCKS.get(name);
            if (mock) return mock(args);
            console.warn("[changa] mocked mutation with no result shape:", name);
            return null;
        };

        // Mutations are only ever called, so we keep `withOptimisticUpdate`
        // working (a no-op cache patch for this mutation) and cast the rest.
        return Object.assign(mocked, {
            withOptimisticUpdate: () => mocked,
        }) as unknown as ReactMutation<Mutation>;
    }, [fallback, real, name]);
}


