import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Generate a URL to upload a file to Convex storage
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});
