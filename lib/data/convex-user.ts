/**
 * The account of a member, as the Convex `users` table stores it.
 *
 * The shape is declared here rather than imported from the generated Convex
 * types so that the rule can be tested without a Convex deployment.
 */
export interface ConvexUserRecord {
  _id: string;
  _creationTime: number;
  clerkId?: string;
  username: string;
  displayName: string;
  createdAt: number;
  defaultLanguageId: string;
  preferredLanguageIds: string[];
  favoriteLanguageIds: string[];
  recentLanguageIds: string[];
  contributionConsent: boolean;
  plan: "free" | "supporter";
}

/** The part of a Convex context this rule needs. */
export interface ConvexUserContext {
  auth: { getUserIdentity: () => Promise<unknown> };
  db: any;
}

/**
 * Convex only bundles files inside the `convex/` directory, so this constant
 * is repeated here rather than imported from the application. It must stay in
 * sync with `lib/languages/registry.ts`.
 */
const DEFAULT_LANGUAGE_ID = "kiswahili";

/** The username of the shared account used when nobody is signed in. */
const LOCAL_USERNAME = "mwalimu";

/**
 * True when the context may write to the database.
 *
 * Convex queries are read-only: their `ctx.db` has no insert, patch or delete
 * method, so a query that tries to create a record fails. Only a mutation may
 * create the account.
 */
export function canWrite(ctx: { db: unknown }): boolean {
  return typeof (ctx.db as { insert?: unknown } | undefined)?.insert === "function";
}

/**
 * Resolves the account of the current member.
 *
 * When Clerk is configured the Convex identity is used, and the member gets an
 * account of their own. When it is not (the zero-configuration local
 * development path), a single shared account is used instead so the backend
 * still works.
 *
 * The account is created the first time it is needed, which only a mutation
 * can do: a query that meets an empty database fails with a clear error
 * instead of writing from a read-only context.
 */
export async function resolveConvexUser(
  ctx: ConvexUserContext,
): Promise<ConvexUserRecord> {
  const identity = (await ctx.auth.getUserIdentity()) as
    | {
        subject?: string;
        tokenIdentifier?: string;
        name?: unknown;
        email?: unknown;
      }
    | null;

  const clerkId = identity?.subject ?? identity?.tokenIdentifier;

  if (clerkId) {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
      .unique();
    if (existing) return existing;

    // A member who is signed in gets an account of their own. Falling back to
    // the shared account here would let one member read and delete another
    // member's conversations.
    if (!canWrite(ctx)) {
      throw new Error("The account for this member has not been created yet.");
    }

    const name = identity?.name;
    const email = identity?.email;
    const displayName =
      (typeof name === "string" && name.trim()) ||
      (typeof email === "string" && email.trim()) ||
      "Member";

    return ctx.db.insert("users", {
      clerkId,
      username: `member-${clerkId}`,
      displayName,
      createdAt: Date.now(),
      defaultLanguageId: DEFAULT_LANGUAGE_ID,
      preferredLanguageIds: [DEFAULT_LANGUAGE_ID],
      favoriteLanguageIds: [DEFAULT_LANGUAGE_ID],
      recentLanguageIds: [DEFAULT_LANGUAGE_ID],
      contributionConsent: true,
      plan: "free",
    });
  }

  // Fall back to the shared local account so the backend is usable without Clerk.
  const local = await ctx.db
    .query("users")
    .withIndex("by_username", (q: any) => q.eq("username", LOCAL_USERNAME))
    .unique();
  if (local) return local;

  if (!canWrite(ctx)) {
    // A query cannot create the account. The client creates it once, before it
    // reads anything, so the read does not have to fail here.
    throw new Error("The account for this member has not been created yet.");
  }

  return ctx.db.insert("users", {
    clerkId,
    username: LOCAL_USERNAME,
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