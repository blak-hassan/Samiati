import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update a user
export const store = mutation({
    args: {
        name: v.string(),
        handle: v.string(),
        email: v.optional(v.string()),
        avatar: v.string(),
        clerkId: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if user exists
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (user !== null) {
            // Update basic fields if they changed (optional strategy: only update if null?)
            // For now, we update avatars/names if they change in Clerk
            await ctx.db.patch(user._id, {
                name: args.name,
                // handle: args.handle, // Handle might be managed differently?
                avatar: args.avatar,
                email: args.email
            });
            return user._id;
        }

        // Create new user
        const newUserId = await ctx.db.insert("users", {
            name: args.name,
            handle: args.handle, // Could generate a default handle from name or email
            email: args.email,
            avatar: args.avatar,
            clerkId: args.clerkId,
            isGuest: false,
            // Defaults
            bio: "Passionate about preserving African languages and digital storytelling",
            culturalBackground: "Global",
            location: "Internet",
        });

        return newUserId;
    },
});

export const current = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        return user;
    },
});
