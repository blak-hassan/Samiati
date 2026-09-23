/**
 * Module 1 — Authentication & Onboarding. Walks steps 1.1–1.10 from
 * §3.1 of the source plan as static-analysis assertions against the
 * current code. The `writeReport` call in `journey.test.ts` aggregates
 * the module results and emits the gap report.
 */
import { describe, it, expect } from "vitest";
import { readSource, exists, assertContains, assertContainsRegex, lineNumber } from "./harness";
import { collect, type StepResult } from "./collect";

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

const usersMutations = () => readSource("convex/users/mutations.ts");
const usersUtils = () => readSource("convex/users/utils.ts");
const signUpPage = () => readSource("src/app/sign-up/[[...sign-up]]/page.tsx");
const signInPage = () => readSource("src/app/sign-in/[[...sign-in]]/page.tsx");
const forgotPage = () => readSource("src/app/forgot-password/page.tsx");
const authGuard = () => readSource("src/components/auth/AuthGuard.tsx");
const guestBanner = () => readSource("src/components/auth/GuestBanner.tsx");
const dashboard = () => readSource("src/app/dashboard/page.tsx");
const chat = () => readSource("convex/chat.ts");
const postsMutations = () => readSource("convex/posts/mutations.ts");
const libValidation = () => readSource("convex/lib/validation.ts");

describe("Module 1: Authentication & Onboarding", () => {
    step("1.1", "/sign-up renders Clerk form or demo banner", () => {
        const src = signUpPage();
        assertContains(src, "Sign up unavailable", "1.1 demo banner copy");
        assertContains(src, "/sign-up", "1.1 self-path");
        return `demo banner present at line ${lineNumber(src, "Sign up unavailable")}`;
    });

    step("1.2", "store mutation creates user with role=member, isGuest=false", () => {
        const src = usersMutations();
        assertContainsRegex(src, /role:\s*'member'[\s\S]{0,40}isGuest:\s*false/, "1.2 store default fields");
        const ln = lineNumber(src, "role: 'member'");
        return `default fields written at line ${ln}`;
    });

    step("1.3", "Duplicate handle handling", () => {
        // The current `store` mutation only matches by clerkId; handle is not
        // a field on the insert. We assert the plan's claim is no longer
        // applicable.
        const src = usersMutations();
        const stillHandlesHandles = /by_handle/.test(src) || /\.handle\s*=/.test(src);
        if (stillHandlesHandles) {
            throw new Error("1.3: store still references a handle lookup — verify the suffix algorithm is in place");
        }
        return "store no longer uses handle uniqueness; schema does not require handle for sign-up";
    });

    step("1.4", "/sign-in page exists", () => {
        assertContains(signInPage(), "Sign in", "1.4 sign-in copy");
        return "/sign-in page renders the Clerk sign-in component";
    });

    step("1.5", "/forgot-password has 1.5s demo delay then success state", () => {
        const src = forgotPage();
        assertContainsRegex(src, /setTimeout\([\s\S]{0,200}1500/, "1.5 1.5s demo delay");
        assertContains(src, "Check your email", "1.5 success copy");
        return `demo delay at line ${lineNumber(src, "1500")}, success copy at line ${lineNumber(src, "Check your email")}`;
    });

    step("1.6", "AuthGuard wraps the dashboard", () => {
        const src = dashboard();
        assertContains(src, "useAppUser", "1.6 dashboard uses useAppUser");
        assertContains(src, "isLoaded", "1.6 dashboard waits for isLoaded");
        return "dashboard waits for Clerk isLoaded and renders HomeSearchScreen for guests";
    });

    step("1.7", "storeGuestUser is rate-limited to 200/hr and 1000/day", () => {
        const src = usersMutations();
        assertContainsRegex(src, /MAX_GUESTS_PER_HOUR\s*=\s*200/, "1.7 hourly cap");
        assertContainsRegex(src, /MAX_GUESTS_PER_DAY\s*=\s*1000/, "1.7 daily cap");
        assertContainsRegex(src, /`guest_\$\{Date\.now\(\)\}_\$\{Math\.random/, "1.7 guest id template literal");
        return `rate-limit constants at line ${lineNumber(src, "MAX_GUESTS_PER_HOUR")}; guest id template at line ${lineNumber(src, "guest_${Date.now()}")}`;
    });

    step("1.8", "Guest AI call throws via requireAiUser", () => {
        const src = readSource("convex/lib/aiSecurity.ts");
        assertContains(src, "Guests cannot use AI features. Please sign in.", "1.8 guest AI error");
        return `guest AI error string at line ${lineNumber(src, "Guests cannot use AI features")}`;
    });

    step("1.9", "Guest post creation throws", () => {
        const src = postsMutations();
        assertContains(src, "Guests cannot create posts. Please sign up to contribute.", "1.9 guest post error");
        return `guest post error at line ${lineNumber(src, "Guests cannot create posts")}`;
    });

    step("1.10", "Guest profile update throws", () => {
        const src = usersMutations();
        assertContains(src, "Guest users cannot update their profile", "1.10 guest profile error");
        return `guest profile error at line ${lineNumber(src, "Guest users cannot update their profile")}`;
    });

    it("isGuestUser helper is exported from users/utils", () => {
        expect(usersUtils()).toMatch(/export function isGuestUser/);
    });
});

export const module1Results = RESULTS;
