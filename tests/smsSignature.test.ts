import { describe, it, expect } from "vitest";
import { isValidTwilioSignature } from "../src/lib/smsSignature";

// Canonical test vector from the official Twilio SDK tests:
// URL with query string, five form params, auth token "12345".
const AUTH_TOKEN = "12345";
const URL = "https://mycompany.com/myapp.php?foo=1&bar=2";
const PARAMS = new URLSearchParams(
    "CallSid=CA1234567890ABCDE&Caller=%2B14158675309&Digits=1234&From=%2B14158675309&To=%2B18005551212"
);
const EXPECTED_SIGNATURE = "RSOYDt4T1cUTdK1PDd93/VVr8B8=";

describe("isValidTwilioSignature", () => {
    it("accepts the documented Twilio test vector", () => {
        expect(isValidTwilioSignature(URL, PARAMS, EXPECTED_SIGNATURE, AUTH_TOKEN)).toBe(true);
    });

    it("rejects a tampered signature", () => {
        expect(isValidTwilioSignature(URL, PARAMS, "AAAAAAAAAAAAAAAAAAAAAAAAAAA=", AUTH_TOKEN)).toBe(false);
    });

    it("rejects a signature produced with a different token", () => {
        expect(isValidTwilioSignature(URL, PARAMS, EXPECTED_SIGNATURE, "wrong-token")).toBe(false);
    });

    it("rejects when the signature or token is missing", () => {
        expect(isValidTwilioSignature(URL, PARAMS, null, AUTH_TOKEN)).toBe(false);
        expect(isValidTwilioSignature(URL, PARAMS, EXPECTED_SIGNATURE, undefined)).toBe(false);
        expect(isValidTwilioSignature(URL, PARAMS, "", AUTH_TOKEN)).toBe(false);
    });

    it("is sensitive to the URL", () => {
        expect(isValidTwilioSignature(
            "https://mycompany.com/myapp.php?foo=2&bar=2",
            PARAMS,
            EXPECTED_SIGNATURE,
            AUTH_TOKEN,
        )).toBe(false);
    });

    it("is sensitive to the params", () => {
        const different = new URLSearchParams(
            "CallSid=CA1234567890ABCDE&Caller=%2B14158675309&Digits=1234&From=%2B14158675309&To=%2B18005551299"
        );
        expect(isValidTwilioSignature(URL, different, EXPECTED_SIGNATURE, AUTH_TOKEN)).toBe(false);
    });
});