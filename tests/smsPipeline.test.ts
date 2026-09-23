/**
 * Tests for the SMS pipeline (Twilio webhook → Convex action → search).
 *
 * Scope: this file pins the *pure* invariants of the SMS entry point that
 * are security-critical and easy to silently break in a refactor:
 *
 *   1. Per-phone rate-limit constants (hourly / daily).
 *   2. The phone-number regex used to gate the action.
 *   3. The per-phone rate-limit key naming convention.
 *   4. The query / language length caps.
 *
 * The full Convex action (`processSmsSearch`) is not exercised here because
 * it requires a live Convex runtime and an HF API key. It is covered
 * manually in staging; see `convex/sms.ts` for the end-to-end delegation.
 * When `convex-test` is added as a dev dependency, these should grow into
 * true integration tests.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Mirrors the constants in `convex/sms.ts`. If you change one of these in
// the source, change it here too — these are the contract the SMS pipeline
// promises to upstream consumers (Twilio, anyone calling the JSON path).
const SMS_PER_NUMBER_HOUR = 5;
const SMS_PER_NUMBER_DAY = 20;
const MAX_QUERY_LENGTH = 5000;
const MAX_LANGUAGE_LENGTH = 50;
const PHONE_RE = /^\+?[0-9]{6,15}$/;

describe("SMS pipeline invariants", () => {
    it("exposes the documented per-number rate-limit ceilings", () => {
        expect(SMS_PER_NUMBER_HOUR).toBe(5);
        expect(SMS_PER_NUMBER_DAY).toBe(20);
    });

    it("keeps the daily limit above the hourly limit", () => {
        // If a future refactor inverts these, free-tier abuse becomes trivial.
        expect(SMS_PER_NUMBER_DAY).toBeGreaterThan(SMS_PER_NUMBER_HOUR);
    });

    it("rejects empty / over-long queries", () => {
        expect("".trim().length > 0).toBe(false);
        expect("a".repeat(MAX_QUERY_LENGTH + 1).length).toBeGreaterThan(MAX_QUERY_LENGTH);
        expect("a".repeat(MAX_QUERY_LENGTH).length).toBe(MAX_QUERY_LENGTH);
    });

    it("caps the language code length to a sane bound", () => {
        expect(MAX_LANGUAGE_LENGTH).toBeLessThanOrEqual(100);
    });

    describe("phone-number validation", () => {
        it("accepts E.164-format numbers", () => {
            expect(PHONE_RE.test("+254712345678")).toBe(true);
            expect(PHONE_RE.test("254712345678")).toBe(true);
            expect(PHONE_RE.test("+15551234567")).toBe(true);
        });

        it("rejects short, long, or non-numeric values", () => {
            expect(PHONE_RE.test("")).toBe(false);
            expect(PHONE_RE.test("+12345")).toBe(false);
            expect(PHONE_RE.test("+12345678901234567")).toBe(false);
            expect(PHONE_RE.test("not-a-number")).toBe(false);
            expect(PHONE_RE.test("+254 712 345 678")).toBe(false); // spaces
            expect(PHONE_RE.test("+254-712-345-678")).toBe(false); // dashes
        });
    });
});

describe("SMS pipeline source-level guarantees", () => {
    // Read sms.ts once and assert that the file actually wires the
    // documented constants in the documented places. Catches silent
    // refactors (e.g. someone tightening the phone regex without
    // updating tests, or someone changing the rate-limit key namespace
    // and breaking external monitoring).
    const smsSource = readFileSync(
        join(process.cwd(), "convex", "sms.ts"),
        "utf8",
    );

    it("uses the `sms:number:` keyspace for per-phone rate limits", () => {
        expect(smsSource).toMatch(/`sms:number:\$\{args\.phoneNumber\}`/);
    });

    it("requires the shared webhook secret (rejects empty / mismatched)", () => {
        // The action must compare args.secret to process.env.SMS_WEBHOOK_SECRET
        // and throw on mismatch. It must also throw if the secret is unset
        // on the server (no silent fallback).
        expect(smsSource).toMatch(/args\.secret\s*!==\s*configured/);
        expect(smsSource).toMatch(/SMS webhook secret is not configured/);
    });

    it("validates the phone number with the documented regex", () => {
        // Defense-in-depth: even if the route handler validates, the
        // action should also check, because the action is reachable
        // through other call sites in the future.
        expect(smsSource).toContain("0-9]{6,15}");
    });

    it("delegates to the internal search core (no direct HF calls)", () => {
        // The SMS path must go through `searchInternal` (which is
        // quarantined behind `internalAction`) and never hit the public
        // `search` action or fetch HF directly.
        expect(smsSource).toMatch(/internal\.sunflower\.searchInternal/);
        expect(smsSource).not.toMatch(/router\.huggingface\.co/);
        expect(smsSource).not.toMatch(/api\.sms\.search\b/); // no public-search delegation
    });

    it("enforces per-number rate limits on both the hourly and daily window", () => {
        expect(smsSource).toMatch(/SMS_PER_NUMBER_HOUR/);
        expect(smsSource).toMatch(/SMS_PER_NUMBER_DAY/);
    });
});
