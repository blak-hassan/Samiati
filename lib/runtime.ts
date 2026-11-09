/**
 * Runtime configuration for Samiati.
 *
 * This module is safe to import from both the server and the browser. It
 * exposes **only** configuration that is safe in the browser — never a key.
 * Secrets stay on the server and are read only by the route handlers.
 */
import { resolveAiRuntime } from "@/lib/ai";

export interface RuntimeConfig {
  /** Which persistence backend is active. */
  dataBackend: "local" | "convex";
  dataBackendLabel: string;
  /** Public Convex URL, when configured. */
  convexUrl?: string;
  /** True when Clerk keys are present and authentication is live. */
  clerkEnabled: boolean;
  /** True when at least one real AI provider is connected. */
  aiConnected: boolean;
  reasoningConnected: boolean;
  translationConnected: boolean;
  /** Human-readable notes about what is and is not connected. */
  aiNotes: string[];
}

/**
 * Resolves the active configuration.
 *
 * Order of preference:
 *  1. Convex + Clerk, when their public keys are present.
 *  2. Convex only.
 *  3. Local storage only (the zero-configuration default).
 */
export function getRuntimeConfig(
  env: Record<string, string | undefined> = process.env,
): RuntimeConfig {
  const convexUrl = env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const clerkEnabled = Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());

  const ai = resolveAiRuntime(env);

  return {
    dataBackend: convexUrl ? "convex" : "local",
    dataBackendLabel: convexUrl
      ? "Convex cloud"
      : "Local mode (this browser only)",
    convexUrl,
    clerkEnabled,
    aiConnected: ai.reasoningConnected || ai.translationConnected,
    reasoningConnected: ai.reasoningConnected,
    translationConnected: ai.translationConnected,
    aiNotes: ai.notes,
  };
}
