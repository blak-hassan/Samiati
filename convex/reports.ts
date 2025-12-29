import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get pending reports with filtering and sorting
export const getPendingReports = query({
    args: {
        type: v.optional(v.union(v.literal('comment'), v.literal('link'), v.literal('post'))),
        reason: v.optional(v.string()),
        sortBy: v.optional(v.union(v.literal('date'), v.literal('severity'))),
    },
    handler: async (ctx, args) => {
        const reportsQuery = ctx.db.query("reports")
            .withIndex("by_status", (q) => q.eq("status", "pending"));

        const reports = await reportsQuery.collect();

        // Filter by type if specified
        let filteredReports = reports;
        if (args.type) {
            filteredReports = filteredReports.filter(r => r.type === args.type);
        }

        // Filter by reason if specified
        if (args.reason && args.reason !== 'All') {
            filteredReports = filteredReports.filter(r =>
                r.reasons.some(reason => reason.includes(args.reason!))
            );
        }

        // Get reporter information for each report
        const reportsWithReporters = await Promise.all(
            filteredReports.map(async (report) => {
                const reporter = await ctx.db.get(report.reporterId);

                // Count duplicate reports for the same target
                const duplicates = await ctx.db
                    .query("reports")
                    .withIndex("by_target", (q) => q.eq("targetId", report.targetId))
                    .filter((q) => q.neq(q.field("_id"), report._id))
                    .collect();

                return {
                    ...report,
                    reporter: reporter ? {
                        id: reporter._id,
                        handle: reporter.handle,
                        avatar: reporter.avatar,
                        name: reporter.name,
                    } : null,
                    otherReporters: duplicates.length,
                };
            })
        );

        // Sort reports
        if (args.sortBy === 'severity') {
            reportsWithReporters.sort((a, b) => b.otherReporters - a.otherReporters);
        } else {
            // Default: sort by date (newest first)
            reportsWithReporters.sort((a, b) => b.timestamp - a.timestamp);
        }

        return reportsWithReporters;
    },
});

// Submit a new report
export const submitReport = mutation({
    args: {
        type: v.union(v.literal('comment'), v.literal('link'), v.literal('post')),
        targetId: v.string(),
        targetContent: v.string(),
        contextTitle: v.string(),
        contextId: v.optional(v.string()),
        reasons: v.array(v.string()),
        reporterId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Check if this user has already reported this content
        const existingReport = await ctx.db
            .query("reports")
            .withIndex("by_target", (q) => q.eq("targetId", args.targetId))
            .filter((q) => q.eq(q.field("reporterId"), args.reporterId))
            .first();

        if (existingReport) {
            throw new Error("You have already reported this content");
        }

        const reportId = await ctx.db.insert("reports", {
            type: args.type,
            targetId: args.targetId,
            targetContent: args.targetContent,
            contextTitle: args.contextTitle,
            contextId: args.contextId,
            reasons: args.reasons,
            reporterId: args.reporterId,
            timestamp: Date.now(),
            status: "pending",
        });

        return reportId;
    },
});

// Resolve a report (moderator action)
export const resolveReport = mutation({
    args: {
        reportId: v.id("reports"),
        moderatorId: v.id("users"),
        action: v.string(), // 'Hide', 'Delete', 'Approve', 'Warn User'
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Verify moderator has permission
        const moderator = await ctx.db.get(args.moderatorId);
        if (!moderator || (moderator.role !== 'moderator' && moderator.role !== 'admin')) {
            throw new Error("Unauthorized: Only moderators can resolve reports");
        }

        const report = await ctx.db.get(args.reportId);
        if (!report) {
            throw new Error("Report not found");
        }

        // Map action to status
        let status: "pending" | "approved" | "hidden" | "deleted" | "warned";
        switch (args.action) {
            case 'Hide':
                status = 'hidden';
                break;
            case 'Delete':
                status = 'deleted';
                break;
            case 'Approve':
                status = 'approved';
                break;
            case 'Warn User':
                status = 'warned';
                break;
            default:
                status = 'approved';
        }

        // Update report status
        await ctx.db.patch(args.reportId, {
            status,
            resolvedAt: Date.now(),
            resolvedBy: args.moderatorId,
            moderatorNotes: args.notes,
        });

        // Log the moderation action
        await ctx.db.insert("moderationActions", {
            reportId: args.reportId,
            moderatorId: args.moderatorId,
            action: args.action,
            timestamp: Date.now(),
            notes: args.notes,
        });

        return { success: true, status };
    },
});

// Get moderation statistics
export const getReportStats = query({
    args: {
        moderatorId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const allReports = await ctx.db.query("reports").collect();

        const pendingReports = allReports.filter(r => r.status === 'pending');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        const resolvedToday = allReports.filter(
            r => r.resolvedAt && r.resolvedAt >= todayTimestamp
        );

        // Calculate average resolution time
        const resolvedReports = allReports.filter(r => r.resolvedAt);
        const totalResolutionTime = resolvedReports.reduce((sum, r) => {
            return sum + (r.resolvedAt! - r.timestamp);
        }, 0);
        const avgResolutionTime = resolvedReports.length > 0
            ? Math.round(totalResolutionTime / resolvedReports.length / 60000) // Convert to minutes
            : 0;

        // User-specific stats
        let userResolvedCount = 0;
        if (args.moderatorId) {
            const userActions = await ctx.db
                .query("moderationActions")
                .withIndex("by_moderator", (q) => q.eq("moderatorId", args.moderatorId!))
                .collect();
            userResolvedCount = userActions.length;
        }

        return {
            totalReports: allReports.length,
            pendingReports: pendingReports.length,
            resolvedToday: resolvedToday.length,
            avgResolutionTime,
            userResolvedCount,
        };
    },
});

// Get moderation history/log
export const getReportHistory = query({
    args: {
        moderatorId: v.optional(v.id("users")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let actions;

        if (args.moderatorId) {
            actions = await ctx.db.query("moderationActions")
                .withIndex("by_moderator", (q) =>
                    q.eq("moderatorId", args.moderatorId!)
                )
                .order("desc")
                .take(args.limit || 50);
        } else {
            actions = await ctx.db.query("moderationActions")
                .withIndex("by_timestamp")
                .order("desc")
                .take(args.limit || 50);
        }

        // Get full details for each action
        const actionsWithDetails = await Promise.all(
            actions.map(async (action) => {
                const report = await ctx.db.get(action.reportId);
                const moderator = await ctx.db.get(action.moderatorId);

                return {
                    ...action,
                    report: report ? {
                        id: report._id,
                        reasons: report.reasons, // Use reasons array
                        targetContent: report.targetContent,
                    } : null,
                    moderator: moderator ? {
                        name: moderator.name,
                        handle: moderator.handle,
                        avatar: moderator.avatar,
                    } : null,
                };
            })
        );

        return actionsWithDetails;
    },
});
