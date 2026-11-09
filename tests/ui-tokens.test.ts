import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
function tokens(selector: string) {
  const body = css.match(new RegExp(`(?:^|\\n)${selector} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? "";
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map((entry) => [entry[1], entry[2]]));
}
function luminance(hex: string) {
  const channels = hex.slice(1).match(/../g)!.map((value) => parseInt(value, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(first: string, second: string) {
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

for (const [theme, selector] of [["light", ":root"], ["dark", "\\.dark"]]) {
  describe(`${theme} semantic palette`, () => {
    const palette = tokens(selector);
    it("keeps normal reading and muted text at AA contrast on reading surfaces", () => {
      for (const surface of ["--background", "--card", "--secondary"]) {
        for (const text of ["--foreground", "--muted-foreground"]) {
          expect(contrast(palette[text], palette[surface]), `${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
    it("keeps every selectable action accent readable", () => {
      for (const accent of ["--heritage-action", "--red-action", "--green-action", "--gold-action"]) {
        expect(contrast(palette[accent], palette["--primary-foreground"]), accent).toBeGreaterThanOrEqual(4.5);
      }
    });
    it("keeps focus and form boundaries visible on reading surfaces", () => {
      for (const surface of ["--background", "--card"]) {
        for (const control of ["--ring", "--input"]) {
          expect(contrast(palette[control], palette[surface]), `${control} on ${surface}`).toBeGreaterThanOrEqual(3);
        }
      }
    });
    it("pairs destructive controls with readable text", () => {
      expect(contrast(palette["--destructive"], palette["--destructive-foreground"])).toBeGreaterThanOrEqual(4.5);
    });
  });
}
