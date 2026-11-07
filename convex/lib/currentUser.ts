import type { Doc } from "../_generated/dataModel";

/**
 * Convex only bundles files inside the `convex/` directory, so this constant
 * is repeated here rather than imported from the application. It must stay in
 * sync with `lib/languages/registry.ts`.
 */
const DEFAULT_LANGUAGE_ID = "kiswahili";

/**
 * Resolves the signed-in user.
 *
 * When Clerk is configured the Convex identity is used. When it is not (the
 * zero-configuration local development path), a single local user is used
 * instead so the backend still works.
 */
export async function getOrCreateUser(
  ctx: { auth: { getUserIdentity: () => Promise<unknown> }; db: any },
): Promise<Doc<"users">> {
  const identity = (await ctx.auth.getUserIdentity()) as
    | { subject?: string; tokenIdentifier?: string }
    | null;

  const clerkId = identity?.subject ?? identity?.tokenIdentifier;

  if (clerkId) {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();
    if (existing) return existing;
  }

  // Fall back to the shared local user so the backend is usable without Clerk.
  const local = await ctx.db
    .query("users")
    .withIndex("by_username", (q: any) => q.eq("username", "mwalimu"))
    .unique();
  if (local) return local;

  return ctx.db.insert("users", {
    clerkId,
    username: "mwalimu",
    displayName: "Mwalimu",
    createdAt: Date.now(),
    defaultLanguageId: DEFAULT_LANGUAGE_ID,
    preferredLanguageIds: [DEFAULT_LANGUAGE_ID],
    favoriteLanguageIds: [DEFAULT_LANGUAGE_ID],
    recentLanguageIds: [DEFAULT_LANGUAGE_ID],
    contributionConsent: true,
    plan: "free",
  });
}
