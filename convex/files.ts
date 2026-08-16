import { mutation } from "./_generated/server";
import { getCurrentUser, isGuestUser } from "./users/utils";
import { checkRateLimit } from "./lib/rateLimit";

const MAX_UPLOAD_URLS_PER_HOUR = 30;

// Generate a URL to upload a file to Convex storage
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        if (isGuestUser(user)) {
            throw new Error("Guests cannot upload files");
        }

        // Bound how many upload URLs one account can mint — a URL alone is
        // harmless, but unlimited minting enables storage abuse.
        const limit = await checkRateLimit(
            ctx.db,
            `upload-url:user:${user._id}`,
            60 * 60 * 1000,
            MAX_UPLOAD_URLS_PER_HOUR,
        );
        if (!limit.allowed) {
            throw new Error("Too many upload attempts. Please try again later.");
        }

        return await ctx.storage.generateUploadUrl();
    },
});