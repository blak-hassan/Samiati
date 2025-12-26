import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        handle: v.string(),
        email: v.optional(v.string()),
        avatar: v.string(),
        bio: v.optional(v.string()),
        culturalBackground: v.optional(v.string()),
        location: v.optional(v.string()),
        isGuest: v.boolean(),
        clerkId: v.string(), // Links to Clerk User ID
        languages: v.optional(v.array(v.object({
            id: v.string(),
            name: v.string(),
            level: v.string(),
            percent: v.number(),
        }))),
        // Moderation & Roles
        role: v.optional(v.union(
            v.literal('admin'),
            v.literal('moderator'),
            v.literal('member')
        )), // Defaults to 'member' if not set
        moderatorStatus: v.optional(v.object({
            appliedAt: v.number(), // timestamp when user applied
            approvedAt: v.optional(v.number()),
            approvedBy: v.optional(v.id("users")),
            isActive: v.boolean(),
        })),
    })
        .index("by_clerkId", ["clerkId"])
        .index("by_handle", ["handle"])
        .index("by_role", ["role"]),

    conversations: defineTable({
        title: v.string(),
        date: v.string(), // Display date string
        messageCount: v.number(),
        isPinned: v.boolean(),
        lastActive: v.number(), // Timestamp
        // Participants could be added here for multi-user
        userId: v.string(), // Owner/Participant
    }).index("by_user", ["userId"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        sender: v.string(), // 'user' | 'ai' | other userId
        text: v.string(),
        timestamp: v.number(),
        feedback: v.optional(v.union(v.literal("up"), v.literal("down"))),
        comments: v.optional(v.array(v.string())),
        image: v.optional(v.string()), // URL handling
    }).index("by_conversation", ["conversationId"]),

    posts: defineTable({
        type: v.string(), // 'fireplace' | 'proverb' | 'standard' | 'question'
        authorId: v.id("users"),
        content: v.string(),
        image: v.optional(v.string()), // URL
        altText: v.optional(v.string()),
        timestamp: v.number(), // Store as number for sorting
        stats: v.object({
            replies: v.number(),
            reposts: v.number(),
            likes: v.number(),
            validations: v.number(),
        }),
        isFireplace: v.optional(v.boolean()),
        fireplaceViewers: v.optional(v.number()),
        // Handling arrays of strings for simple IDs
        fireplaceSpeakers: v.optional(v.array(v.string())),
        languageTag: v.optional(v.string()),
        isBounty: v.optional(v.boolean()),
        poll: v.optional(v.object({
            options: v.array(v.object({
                id: v.string(),
                label: v.string(),
                votes: v.number()
            })),
            totalVotes: v.number(),
            endsAt: v.string(), // or number
        })),
        cw: v.optional(v.string()), // Content Warning
    }).index("by_timestamp", ["timestamp"]),

    likes: defineTable({
        userId: v.id("users"),
        postId: v.id("posts"),
    }).index("by_post", ["postId", "userId"]),

    notifications: defineTable({
        userId: v.id("users"),
        type: v.string(), // 'challenge' | 'contribution' | etc
        title: v.string(),
        message: v.string(),
        time: v.number(),
        isRead: v.boolean(),
        targetScreen: v.string(),
        metadata: v.optional(v.any()), // flexible for now
    }).index("by_user", ["userId"]),

    contributions: defineTable({
        userId: v.id("users"),
        type: v.string(), // 'Word' | 'Story'
        title: v.string(),
        subtitle: v.string(),
        status: v.string(),
        statusColor: v.string(),
        dotColor: v.string(),
        icon: v.string(),
        likes: v.number(),
        dislikes: v.number(),
        commentsCount: v.number(),
        content: v.optional(v.string()), // Actual content
    }).index("by_user", ["userId"]),

    reports: defineTable({
        type: v.union(v.literal('comment'), v.literal('link'), v.literal('post')),
        targetId: v.string(), // ID of the reported content
        targetContent: v.string(), // The actual content being reported
        contextTitle: v.string(), // Where it was reported from (e.g., "The Art of Ife")
        contextId: v.optional(v.string()), // ID of parent (story, post, etc)
        reasons: v.array(v.string()), // ['Spam', 'Hate Speech', etc]
        reporterId: v.id("users"),
        timestamp: v.number(),
        status: v.union(
            v.literal('pending'),
            v.literal('approved'),
            v.literal('hidden'),
            v.literal('deleted'),
            v.literal('warned')
        ),
        resolvedAt: v.optional(v.number()),
        resolvedBy: v.optional(v.id("users")),
        moderatorNotes: v.optional(v.string()),
    })
        .index("by_status", ["status"])
        .index("by_target", ["targetId"])
        .index("by_reporter", ["reporterId"])
        .index("by_timestamp", ["timestamp"]),

    moderationActions: defineTable({
        reportId: v.id("reports"),
        moderatorId: v.id("users"),
        action: v.string(), // 'Hide', 'Delete', 'Approve', 'Warn User'
        timestamp: v.number(),
        notes: v.optional(v.string()),
    })
        .index("by_report", ["reportId"])
        .index("by_moderator", ["moderatorId"])
        .index("by_timestamp", ["timestamp"]),
});
