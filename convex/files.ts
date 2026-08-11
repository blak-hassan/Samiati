import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users/utils";

// Generate a URL to upload a file to Convex storage
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        return await ctx.storage.generateUploadUrl();
    },
});
