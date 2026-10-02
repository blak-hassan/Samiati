import { query } from "../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import type { Doc } from "../_generated/dataModel";
import { getCurrentUser } from "../users/utils";

type ConversationDoc = Doc<"conversations">;

/**
 * List conversations for the current user, newest-activity-first, paginated.
 *
 * Why paginated (docs/perf.md §2: "Any list that may exceed ~50 items must
 * accept `paginationOpts`"): the previous version did
 * `.withIndex("by_user").order("desc").take(100)`, which had two problems:
 *
 *  1. `by_user` orders by `_creationTime`, so it returned the 100
 *     newest-*created* rows rather than the 100 most recently *active* ones —
 *     on a long-lived account the oldest chats silently never hydrated on a new
 *     device. `by_user_lastActive` fixes the ordering.
 *  2. A hard `take(100)` made anything past 100 unreachable, with no way to
 *     page further. Cursor pagination makes the list unbounded.
 *
 * Tab narrowing (active / archived / pinned) intentionally stays on the client
 * rather than being pushed into a `filter` arg: `isArchived` is an OPTIONAL
 * column, and Convex omits rows with an undefined field from secondary indexes.
 * Splitting "active" across an `eq(isArchived, false)` index lookup and a second
 * undefined-matching lookup would produce two independent cursors that cannot be
 * merged without double-counting or dropping rows. The client already narrows by
 * tab for the local-first cache, and doing it here would fight that merge. New
 * rows always write an explicit boolean (see saveConversation), so this stays
 * correct as data backfills.
 */
export const listConversations = query({
    args: { paginationOpts: paginationOptsValidator },
    // Explicit return type. Without it the guest early-return's object literal
    // infers `page: never[]`, and the union with the real `PaginationResult`
    // stops the query being recognised as a paginated query by
    // `usePaginatedQuery` (PaginatedQueryReference does not match).
    handler: async (ctx, args): Promise<PaginationResult<ConversationDoc>> => {
        const user = await getCurrentUser(ctx);
        // continueCursor is typed `Cursor` (a string), not nullable — an empty
        // first page must still carry a valid cursor so the client-side
        // pagination machinery can resolve the stream.
        if (!user) return { page: [], isDone: true, continueCursor: "" };

        return await ctx.db
            .query("conversations")
            .withIndex("by_user_lastActive", (q) => q.eq("userId", user._id))
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

// Get a single conversation with its messages by clientId
export const getConversationWithMessages = query({
    args: { clientId: v.string() },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) return null;

        const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
            .first();

        if (!conversation || conversation.userId !== user._id) return null;

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
            .order("asc")
            .collect();

        return { ...conversation, messages };
    },
});
