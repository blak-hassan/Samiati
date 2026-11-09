import type { Doc } from "../_generated/dataModel";

import { resolveConvexUser } from "../../lib/data/convex-user";

/**
 * Resolves the signed-in user.
 *
 * The rule itself lives in `lib/data/convex-user.ts`, where it can be tested
 * without a Convex deployment: a query cannot write, so the account is
 * created by a mutation, and a signed-in member never shares the local
 * account.
 */
export async function getOrCreateUser(
  ctx: { auth: { getUserIdentity: () => Promise<unknown> }; db: any },
): Promise<Doc<"users">> {
  return (await resolveConvexUser(ctx)) as unknown as Doc<"users">;
}
