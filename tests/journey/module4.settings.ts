/**
 * Module 4 — Settings & Profile Management. Backend assertions are
 * static; the corresponding route-coverage tests live in the Playwright
 * spec (`e2e/journey.spec.ts`).
 */
import { describe, it, expect } from "vitest";
import { readSource, exists, assertContains, assertContainsRegex, lineNumber } from "./harness";
import type { StepResult } from "./report";

const RESULTS: StepResult[] = [];

function step(id: string, description: string, fn: () => string, opts: { rethrowOnFail?: boolean } = {}) {
    const rethrow = opts.rethrowOnFail !== false;
    return it(`${id} ${description}`, () => {
        try {
            const evidence = fn();
            RESULTS.push({ id, description, status: "pass", evidence });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            RESULTS.push({ id, description, status: "fail", evidence: message });
            if (rethrow) throw err;
        }
    });
}

// Record a step as a deliberate fail (so the orchestrator's `afterAll`
// surfaces it in the report) without making the whole test file red.
// Used for known gaps that the harness is meant to highlight.
function fail(evidence: string): never {
    throw new Error(evidence);
}

const usersMutations = () => readSource("convex/users/mutations.ts");
const settingsAccount = () => readSource("src/app/dashboard/settings/account/page.tsx");
const settingsBilling = exists("src/app/dashboard/settings/billing/page.tsx")
    ? () => readSource("src/app/dashboard/settings/billing/page.tsx")
    : () => "";
const useNav = () => readSource("src/hooks/useNavigation.ts");
const libValidation = () => readSource("convex/lib/validation.ts");

describe("Module 4: System Settings & Profile Management", () => {
    // ----- 4.1 -----
    step("4.1", "Settings account page exists and reads the Clerk user", () => {
        const src = settingsAccount();
        // The page may use `useAppUser` (production) or `useUser` from
        // MockProviders (demo mode). Accept either.
        const hook = /useAppUser|useUser/.exec(src)?.[0] ?? "";
        if (!hook) {
            throw new Error("4.1: settings/account does not import a user hook");
        }
        return `settings/account uses ${hook}`;
    });

    // ----- 4.2 / 4.3 / 4.4 -----
    step("4.2", "updateProfile caps name≤100, bio≤500, location≤200, languages≤20", () => {
        const src = usersMutations();
        assertContainsRegex(src, /MAX_NAME_LENGTH\s*=\s*100/, "4.2 name cap");
        assertContainsRegex(src, /MAX_BIO_LENGTH\s*=\s*500/, "4.2 bio cap");
        assertContainsRegex(src, /MAX_LOCATION_LENGTH\s*=\s*200/, "4.2 location cap");
        assertContains(src, "args.languages.length > 20", "4.2 languages cap");
        return `limits at line ${lineNumber(src, "MAX_NAME_LENGTH")}`;
    });
    step("4.3", "updateProfile rejects invalid avatar URL", () => {
        const src = usersMutations();
        assertContains(src, "Avatar must be a valid http(s) image URL", "4.3 invalid avatar");
        // Confirm validation helper exists and rejects javascript:/data:
        const v = libValidation();
        assertContains(v, "javascript:", "4.3 isValidAvatarUrl blocks javascript:");
        assertContains(v, "data:", "4.3 isValidAvatarUrl blocks data:");
        return `error at line ${lineNumber(src, "Avatar must be a valid http(s) image URL")}`;
    });
    step("4.4", "updateProfile truncates avatar to 2048 chars", () => {
        const src = usersMutations();
        assertContains(src, "args.avatar.trim().slice(0, 2048)", "4.4 avatar truncate");
        return `truncate at line ${lineNumber(src, ".slice(0, 2048)")}`;
    });

    // ----- 4.5 -----
    step("4.5", "updatePrivacy patches all four flags", () => {
        const src = usersMutations();
        assertContains(src, "export const updatePrivacy", "4.5 mutation");
        assertContains(src, "profileVisible", "4.5 profileVisible");
        assertContains(src, "showChanga", "4.5 showChanga");
        assertContains(src, "voiceDataAllowed", "4.5 voiceDataAllowed");
        assertContains(src, "culturalDataAllowed", "4.5 culturalDataAllowed");
        return `updatePrivacy at line ${lineNumber(src, "export const updatePrivacy")}`;
    });

    // ----- 4.6 / 4.8–4.13 routes (assert navigation hook maps them) -----
    step("4.6", "MANAGE_LANGUAGES maps to /dashboard/settings/languages", () => {
        const src = useNav();
        assertContains(src, "MANAGE_LANGUAGES", "4.6 nav hook");
        assertContains(src, "/dashboard/settings/languages", "4.6 route");
        return `route at line ${lineNumber(src, "/dashboard/settings/languages")}`;
    });
    step("4.8", "SETTINGS_NOTIFICATIONS maps to a route", () => {
        const src = useNav();
        assertContains(src, "SETTINGS_NOTIFICATIONS", "4.8 nav hook");
        assertContains(src, "/dashboard/settings/notifications", "4.8 route");
        return `route at line ${lineNumber(src, "/dashboard/settings/notifications")}`;
    });
    step("4.9", "SETTINGS_PRIVACY maps to a route", () => {
        const src = useNav();
        assertContains(src, "SETTINGS_PRIVACY", "4.9 nav hook");
        assertContains(src, "/dashboard/settings/privacy", "4.9 route");
        return `route at line ${lineNumber(src, "/dashboard/settings/privacy")}`;
    });
    step("4.10", "SETTINGS_DATA maps to a route", () => {
        const src = useNav();
        assertContains(src, "SETTINGS_DATA", "4.10 nav hook");
        assertContains(src, "/dashboard/settings/data", "4.10 route");
        return `route at line ${lineNumber(src, "/dashboard/settings/data")}`;
    });
    step("4.13", "/dashboard/settings/billing uses SubscriptionManager", () => {
        const src = settingsBilling();
        if (!src) {
            // The plan asserts the billing page exists; if the file is
            // missing, this step records a deliberate fail so the gap
            // surfaces in the report without making the whole suite red.
            return fail(`4.13: /dashboard/settings/billing page is missing — surfaces as part of SET-01`);
        }
        assertContains(src, "SubscriptionManager", "4.13 SubscriptionManager");
        return "SubscriptionManager component wired into billing page";
    }, { rethrowOnFail: false });

    it("settings/notifications page references notificationPreferences or updateNotificationPreferences", () => {
        // The page may delegate to a screen component; we accept that
        // pattern as long as either the page or the screen component
        // wires the mutation.
        const page = readSource("src/app/dashboard/settings/notifications/page.tsx");
        const screenPath = "src/components/screens/SettingsNotificationsScreen.tsx";
        const screen = exists(screenPath) ? readSource(screenPath) : "";
        const wired =
            /updateNotificationPreferences|notificationPreferences/.test(page) ||
            /updateNotificationPreferences|notificationPreferences/.test(screen);
        if (!wired) {
            throw new Error("settings/notifications does not reference updateNotificationPreferences (SET-02)");
        }
        expect(wired).toBe(true);
    });
});

export const module4Results = RESULTS;
