import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Theme consistency tests.
 *
 * 1. Unit tests for the shared theme helpers (src/lib/theme.ts).
 * 2. Static consistency assertions (same style as tests/journey/*) that pin
 *    the fix for "navigating to Settings forces dark mode while in light
 *    mode": the settings clients must consume `useTheme` and must NOT apply
 *    the theme class themselves, and `useSettings` must never persist its
 *    pre-hydration placeholder state.
 */

// The repo's vitest setup runs in Node (no jsdom). Install minimal
// window/document stubs before each test, mirroring tests/cookie-consent.

// Typed access to the Node globals we stub (avoids `any` for eslint).
const globals = globalThis as unknown as { window?: unknown; document?: unknown };

function installBrowserStubs() {
  const storage = new Map<string, string>();
  globals.window = {
    localStorage: {
      getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
      setItem: (k: string, v: string) => {
        storage.set(k, v);
      },
      removeItem: (k: string) => {
        storage.delete(k);
      },
      clear: () => storage.clear(),
    },
  };
  return storage;
}

function installDocumentStub() {
  const classes = new Set<string>();
  globals.document = {
    documentElement: {
      classList: {
        add: (c: string) => classes.add(c),
        remove: (c: string) => classes.delete(c),
        contains: (c: string) => classes.has(c),
        toggle: (c: string, force?: boolean) => {
          const shouldHave = force ?? !classes.has(c);
          if (shouldHave) classes.add(c);
          else classes.delete(c);
          return shouldHave;
        },
      },
    },
  };
  return classes;
}

const src = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

describe("applyThemeClass", () => {
  let classes: Set<string>;

  beforeEach(() => {
    installBrowserStubs();
    classes = installDocumentStub();
  });

  afterEach(() => {
    delete globals.window;
    delete globals.document;
  });

  it("adds the dark class when isDark is true", async () => {
    const { applyThemeClass } = await import("../src/lib/theme");
    applyThemeClass(true);
    expect(classes.has("dark")).toBe(true);
  });

  it("removes the dark class when isDark is false", async () => {
    const { applyThemeClass } = await import("../src/lib/theme");
    classes.add("dark");
    applyThemeClass(false);
    expect(classes.has("dark")).toBe(false);
  });

  it("is idempotent (repeated calls cannot fight each other)", async () => {
    const { applyThemeClass } = await import("../src/lib/theme");
    applyThemeClass(true);
    applyThemeClass(true);
    applyThemeClass(false);
    applyThemeClass(false);
    expect(classes.has("dark")).toBe(false);
  });

  it("is a no-op when document is unavailable (SSR safety)", async () => {
    delete globals.document;
    const { applyThemeClass } = await import("../src/lib/theme");
    expect(() => applyThemeClass(true)).not.toThrow();
  });
});

describe("readStoredDarkMode", () => {
  let storage: Map<string, string>;

  beforeEach(() => {
    storage = installBrowserStubs();
    installDocumentStub();
  });

  afterEach(() => {
    delete globals.window;
    delete globals.document;
  });

  it("returns the stored boolean preference", async () => {
    const { readStoredDarkMode } = await import("../src/lib/theme");
    storage.set("samiati-settings", JSON.stringify({ darkMode: false }));
    expect(readStoredDarkMode()).toBe(false);
    storage.set("samiati-settings", JSON.stringify({ darkMode: true }));
    expect(readStoredDarkMode()).toBe(true);
  });

  it("returns undefined when nothing is stored (caller applies the default)", async () => {
    const { readStoredDarkMode } = await import("../src/lib/theme");
    expect(readStoredDarkMode()).toBeUndefined();
  });

  it("returns undefined for malformed JSON instead of throwing", async () => {
    const { readStoredDarkMode } = await import("../src/lib/theme");
    storage.set("samiati-settings", "not-json{");
    expect(readStoredDarkMode()).toBeUndefined();
  });

  it("returns undefined when darkMode is not a boolean", async () => {
    const { readStoredDarkMode } = await import("../src/lib/theme");
    storage.set("samiati-settings", JSON.stringify({ darkMode: "false" }));
    expect(readStoredDarkMode()).toBeUndefined();
  });
});

describe("theme consistency (static assertions)", () => {
  it("useTheme reconciles the theme class only after settings are hydrated", async () => {
    const s = src("src/hooks/useTheme.ts");
    expect(s).toContain("applyThemeClass");
    // The dark-forcing regression: applying the placeholder default before
    // the persisted preference is known forced light-mode users to dark.
    expect(s).toMatch(/if \(!hydrated\) return;\s*\n\s*applyThemeClass/);
  });

  it("settings clients consume useTheme and do not touch classList themselves", () => {
    for (const [name, s] of [
      ["SettingsLayoutClient", src("src/components/settings/SettingsLayoutClient.tsx")],
      ["SettingsIndexClient", src("src/components/settings/SettingsIndexClient.tsx")],
    ] as const) {
      expect(s, name).toContain("useTheme");
      expect(s, name).not.toMatch(/classList\.(add|remove)\(/);
      expect(s, name).not.toContain("useSettings");
    }
  });

  it("useSettings never persists its pre-hydration placeholder state", () => {
    expect(src("src/hooks/useSettings.ts")).toMatch(
      /if \(!hydrated\) return;\s*\n\s*persistSettings/,
    );
  });

  it("useSettings applies the theme class centrally on darkMode updates", () => {
    const s = src("src/hooks/useSettings.ts");
    expect(s).toContain('key === "darkMode"');
    expect(s).toContain("applyThemeClass(value)");
  });

  it("the pre-paint script and the hook default agree (dark unless stored false)", () => {
    const layout = src("src/app/layout.tsx");
    expect(layout).toContain("samiati-settings");
    expect(layout).toContain("parsed.darkMode !== false");
    expect(src("src/hooks/useTheme.ts")).toContain("settings.darkMode ?? true");
  });

  it("landing page gold text uses the theme-aware token (light-mode legibility)", () => {
    // Raw rasta-gold (#FFD700) has ~1.3:1 contrast on the light background —
    // invisible in light mode. Landing text must use the theme-aware
    // `text-gold` token (#B45309 light / #FFD700 dark).
    for (const [name, path] of [
      ["homepage", "src/app/page.tsx"],
      ["waitlist form", "src/components/WaitlistForm.tsx"],
    ] as const) {
      const s = src(path);
      expect(s, name).not.toMatch(/text-rasta-gold/);
      expect(s, name).not.toMatch(/border-rasta-gold/);
      expect(s, name).toContain("text-gold");
    }
    expect(src("src/app/page.tsx")).not.toMatch(/border-white\/5|text-stone-400/);
    // The token itself must be theme-aware: readable amber in :root, brand
    // gold in .dark.
    const css = src("src/app/globals.css");
    expect(css).toMatch(/--gold:\s*#B45309/);
    expect(css).toMatch(/--gold:\s*#FFD700/);
    expect(css).toContain("--color-gold: var(--gold)");
  });

  it("the Samiati logo wordmark is theme-aware (was hardcoded white)", () => {
    const logo = src("src/components/SamiatiLogo.tsx");
    // The default (`primary`) variant must follow the theme foreground — a
    // hardcoded pure-white wordmark vanished on the light homepage.
    // (`[^}]*` already spans newlines, so no dotAll flag needed — the repo's
    // tsconfig target predates es2018.)
    expect(logo).toContain("var(--foreground");
    expect(logo).not.toMatch(/primary:\s*\{[^}]*#FFFFFF/);
  });
});