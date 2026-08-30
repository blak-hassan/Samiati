import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser, isGuestUser } from "../users/utils";
import { isValidAvatarUrl } from "../lib/validation";

// Input validation constants
const MAX_CONTENT_LENGTH = 5000;
const MAX_TITLE_LENGTH = 200;

// Input sanitization helper
function sanitizeInput(input: string): string {
    return input.trim().slice(0, MAX_CONTENT_LENGTH);
}

// Create a new post
export const create = mutation({
    args: {
        content: v.string(),
        type: v.string(), // 'standard', 'proverb', etc
        image: v.optional(v.string()),
        altText: v.optional(v.string()),
        languageTag: v.optional(v.string()),
        isFireplace: v.optional(v.boolean()),
        // Add other specific fields as optional
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");
        
        // Check if user is a guest - guests cannot create posts
        if (isGuestUser(user)) {
            throw new Error("Guests cannot create posts. Please sign up to contribute.");
        }
        
        // Validate content length
        if (args.content.length > MAX_CONTENT_LENGTH) {
            throw new Error(`Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
        }
        
        // Validate content is not empty after sanitization
        const sanitizedContent = sanitizeInput(args.content);
        if (!sanitizedContent) {
            throw new Error("Content cannot be empty");
        }
        
        // Validate type
        const allowedTypes = ['standard', 'proverb', 'question', 'fireplace'];
        if (!allowedTypes.includes(args.type)) {
            throw new Error("Invalid post type");
        }

        // The image is rendered on public pages; only real http(s) URLs are
        // allowed (no data:, javascript:, or file: URIs).
        if (args.image && !isValidAvatarUrl(args.image)) {
            throw new Error("Image must be a valid http(s) URL");
        }

        const postId = await ctx.db.insert("posts", {
            content: sanitizedContent,
            type: args.type,
            authorId: user._id,
            timestamp: Date.now(),
            image: args.image,
            altText: args.altText?.slice(0, MAX_TITLE_LENGTH),
            languageTag: args.languageTag?.slice(0, MAX_TITLE_LENGTH),
            isFireplace: args.isFireplace,
            stats: {
                replies: 0,
                reposts: 0,
                likes: 0,
                validations: 0,
            },
        });

        // If fireplace, maybe trigger notification?

        return postId;
    },
});

// Like a post
export const like = mutation({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existingLike = await ctx.db
            .query("likes")
            .withIndex("by_post", (q) => q.eq("postId", args.postId).eq("userId", user._id))
            .first();

        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post not found");

        if (existingLike) {
            // Unlike: delete the like and atomically decrement
            await ctx.db.delete(existingLike._id);
            await ctx.db.patch(args.postId, {
                stats: { ...post.stats, likes: Math.max(0, post.stats.likes - 1) }
            });
            return false;
        } else {
            // Like: insert and atomically increment
            await ctx.db.insert("likes", {
                postId: args.postId,
                userId: user._id,
            });
            await ctx.db.patch(args.postId, {
                stats: { ...post.stats, likes: post.stats.likes + 1 }
            });

            // Notify post author (if not self-liking)
            if (post.authorId !== user._id) {
                await ctx.db.insert("notifications", {
                    userId: post.authorId,
                    type: "like",
                    title: "New Like",
                    message: `${user.name} liked your post`,
                    time: Date.now(),
                    isRead: false,
                    targetScreen: "POST_THREAD",
                    metadata: { postId: post._id, likerId: user._id },
                });
            }
            return true;
        }
    },
});

// Edit a post (author, admin, or moderator only)
export const editPost = mutation({
    args: {
        postId: v.id("posts"),
        content: v.string(),
        type: v.optional(v.string()),
        image: v.optional(v.string()),
        altText: v.optional(v.string()),
        languageTag: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post not found");

        if (post.authorId !== user._id && user.role !== 'admin' && user.role !== 'moderator') {
            throw new Error("Unauthorized");
        }

        const sanitizedContent = sanitizeInput(args.content);
        if (!sanitizedContent) {
            throw new Error("Content cannot be empty");
        }
        if (sanitizedContent.length > MAX_CONTENT_LENGTH) {
            throw new Error(`Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`);
        }

        const allowedTypes = ['standard', 'proverb', 'question', 'fireplace'];
        const type = args.type ?? post.type;
        if (!allowedTypes.includes(type)) {
            throw new Error("Invalid post type");
        }

        if (args.image !== undefined && args.image && !isValidAvatarUrl(args.image)) {
            throw new Error("Image must be a valid http(s) URL");
        }

        await ctx.db.patch(args.postId, {
            content: sanitizedContent,
            type,
            image: args.image ?? post.image,
            altText: args.altText?.slice(0, MAX_TITLE_LENGTH) ?? post.altText,
            languageTag: args.languageTag?.slice(0, MAX_TITLE_LENGTH) ?? post.languageTag,
            editedAt: Date.now(),
        });

        return args.postId;
    },
});

// Delete a post
export const deletePost = mutation({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post not found");

        if (post.authorId !== user._id && user.role !== 'admin' && user.role !== 'moderator') {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.postId);
    },
});
