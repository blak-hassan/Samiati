import { describe, it, expect } from "vitest";
import { isValidAvatarUrl } from "../convex/lib/validation";

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