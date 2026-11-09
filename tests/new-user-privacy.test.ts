import { describe, expect, it, vi } from "vitest";

// Exercise the real mutation handlers without a network connection or database.
vi.mock("../convex/_generated/server", () => ({
  mutation: (definition: unknown) => definition,
  query: (definition: unknown) => definition,
}));
vi.mock("../convex/lib/rateLimit", () => ({
  checkRateLimit: async () => ({ allowed: true }),
}));

import { store, storeGuestUser } from "../convex/users/mutations";

type Handler = { handler: (context: unknown, args: unknown) => Promise<unknown> };
const privateDefaults = {
  profileVisible: false,
  showChanga: false,
  voiceDataAllowed: false,
  culturalDataAllowed: false,
};

function context(existing: Record<string, unknown> | null = null) {
  const unique = vi.fn().mockResolvedValue(null);
  if (existing) unique.mockResolvedValueOnce(existing);
  const chain = { withIndex: () => chain, unique };
  return {
    auth: { getUserIdentity: async () => ({ subject: "user_test", email: "test@example.com", emailVerified: true }) },
    db: {
      query: () => chain,
      insert: vi.fn().mockResolvedValue("new_user"),
      patch: vi.fn(),
    },
  };
}

describe("privacy at account creation", () => {
  it("creates authenticated profiles with private visibility and consent off", async () => {
    const ctx = context();
    await (store as unknown as Handler).handler(ctx, { name: "Test", handle: "test_user", avatar: "https://example.com/avatar.png" });
    expect(ctx.db.insert).toHaveBeenCalledWith("users", expect.objectContaining({ ...privateDefaults, isGuest: false }));
  });

  it("preserves the visibility and consent choices of an existing account", async () => {
    const ctx = context({ _id: "existing_user", name: "Test", handle: "test_user", avatar: "https://example.com/avatar.png", email: "test@example.com", emailVerified: true, profileVisible: true, showChanga: true, voiceDataAllowed: true, culturalDataAllowed: true });
    expect(await (store as unknown as Handler).handler(ctx, { name: "Test", handle: "test_user", avatar: "https://example.com/avatar.png" })).toBe("existing_user");
    expect(ctx.db.insert).not.toHaveBeenCalled();
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it("also creates guest profiles with private visibility and consent off", async () => {
    const ctx = context();
    await (storeGuestUser as unknown as Handler).handler(ctx, { name: "Guest", handle: "guest_test" });
    expect(ctx.db.insert).toHaveBeenCalledWith("users", expect.objectContaining({ ...privateDefaults, isGuest: true }));
  });
});
