import { describe, expect, it } from "vitest";

import { resolveConvexUser as getOrCreateUser } from "@/lib/data/convex-user";

interface FakeUser {
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

function makeUser(overrides: Partial<FakeUser> = {}): FakeUser {
  return {
    _id: "user-1",
    _creationTime: 0,
    username: "mwalimu",
    displayName: "Mwalimu",
    createdAt: 0,
    defaultLanguageId: "kiswahili",
    preferredLanguageIds: ["kiswahili"],
    favoriteLanguageIds: ["kiswahili"],
    recentLanguageIds: ["kiswahili"],
    contributionConsent: true,
    plan: "free",
    ...overrides,
  };
}

/**
 * A stand-in for the Convex database.
 *
 * `writable` decides whether the context has an `insert` method, which is
 * exactly the difference between a Convex mutation and a Convex query: a
 * query's `ctx.db` is read-only and has no write methods at all.
 */
function makeDb(users: FakeUser[], writable: boolean) {
  const db: Record<string, unknown> = {
    query(table: string) {
      if (table !== "users") throw new Error(`Unexpected table: ${table}`);
      return {
        withIndex(_index: string, build: (q: unknown) => unknown) {
          const builder = {
            eq: (field: string, value: unknown) => ({ field, value }),
          };
          const { field, value } = build(builder) as {
            field: string;
            value: unknown;
          };
          return {
            unique: async () =>
              users.find((user) => (user as unknown as Record<string, unknown>)[field] === value) ??
              null,
          };
        },
      };
    },
  };

  if (writable) {
    db.insert = async (_table: string, document: Record<string, unknown>) => {
      const created = {
        _id: `user-${users.length + 1}`,
        _creationTime: 0,
        ...document,
      } as unknown as FakeUser;
      users.push(created);
      return created;
    };
  }

  return db;
}

function makeCtx(
  users: FakeUser[],
  options: { writable: boolean; identity?: unknown },
) {
  return {
    auth: { getUserIdentity: async () => options.identity ?? null },
    db: makeDb(users, options.writable),
  };
}

describe("getOrCreateUser", () => {
  it("creates the shared account when a mutation asks for it", async () => {
    const users: FakeUser[] = [];
    const ctx = makeCtx(users, { writable: true });

    const user = await getOrCreateUser(ctx);

    expect(user.username).toBe("mwalimu");
    expect(users).toHaveLength(1);
  });

  it("returns the existing account without writing to the database", async () => {
    const users: FakeUser[] = [makeUser({ _id: "user-7" })];
    const ctx = makeCtx(users, { writable: true });

    const user = await getOrCreateUser(ctx);

    expect(user._id).toBe("user-7");
    expect(users).toHaveLength(1);
  });

  it("does not try to write from a read-only context", async () => {
    const users: FakeUser[] = [];
    // A Convex query has no insert method: writing from one throws.
    const ctx = makeCtx(users, { writable: false });

    await expect(getOrCreateUser(ctx)).rejects.toThrow(/has not been created/i);
    expect(users).toHaveLength(0);
  });

  it("gives a signed-in member an account of their own", async () => {
    const users: FakeUser[] = [makeUser({ _id: "shared" })];
    const ctx = makeCtx(users, {
      writable: true,
      identity: { subject: "user_abc", name: "Amina" },
    });

    const user = await getOrCreateUser(ctx);

    expect(user.clerkId).toBe("user_abc");
    expect(user.username).toBe("member-user_abc");
    expect(user.displayName).toBe("Amina");
    // The shared account is not handed to a member who is signed in.
    expect(user._id).not.toBe("shared");
  });
});