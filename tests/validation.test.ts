import { describe, it, expect } from "vitest";
import { isValidHandle, isValidAvatarUrl } from "../convex/lib/validation";

describe("isValidHandle", () => {
    it("accepts valid handles", () => {
        expect(isValidHandle("wanjiku")).toBe(true);
        expect(isValidHandle("a_b_1")).toBe(true);
        expect(isValidHandle("ABC123")).toBe(true);
        expect(isValidHandle("ab")).toBe(false); // too short
        expect(isValidHandle("a".repeat(31))).toBe(false); // too long
    });

    it("rejects invalid handles", () => {
        expect(isValidHandle("has space")).toBe(false);
        expect(isValidHandle("has-dash")).toBe(false);
        expect(isValidHandle("has.dot")).toBe(false);
        expect(isValidHandle("")).toBe(false);
        expect(isValidHandle("emoji👍")).toBe(false);
    });
});

describe("isValidAvatarUrl", () => {
    it("accepts https and http URLs", () => {
        expect(isValidAvatarUrl("https://example.com/avatar.png")).toBe(true);
        expect(isValidAvatarUrl("http://example.com/avatar.png")).toBe(true);
    });

    it("rejects non-http schemes and garbage", () => {
        expect(isValidAvatarUrl("javascript:alert(1)")).toBe(false);
        expect(isValidAvatarUrl("data:image/svg+xml;base64,PHN2Zy8+")).toBe(false);
        expect(isValidAvatarUrl("file:///etc/passwd")).toBe(false);
        expect(isValidAvatarUrl("not a url")).toBe(false);
        expect(isValidAvatarUrl("")).toBe(false);
    });

    it("rejects oversized URLs", () => {
        expect(isValidAvatarUrl(`https://example.com/${"a".repeat(2100)}`)).toBe(false);
    });
});