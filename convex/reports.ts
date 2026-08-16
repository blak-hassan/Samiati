import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, isAdmin, isModerator } from "./users/utils";

// Get pending reports with filtering and sorting (moderator/admin only)
export const getPendingReports = query({
    args: {
        type: v.optional(v.union(v.literal('comment'), v.literal('link'), v.literal('post'))),
        reason: v.optional(v.string()),
        sortBy: v.optional(v.union(v.literal('date'), v.literal('severity'))),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can view reports");
        }

        const reportsQuery = ctx.db.query("reports")
            .withIndex("by_status", (q) => q.eq("status", "pending"));

        const reports = await reportsQuery.collect();

        let filteredReports = reports;
        if (args.type) {
            filteredReports = filteredReports.filter(r => r.type === args.type);
        }

        if (args.reason && args.reason !== 'All') {
            filteredReports = filteredReports.filter(r =>
                r.reasons.some(reason => reason.includes(args.reason!))
            );
        }

        const reportsWithReporters = await Promise.all(
            filteredReports.map(async (report) => {
                const reporter = await ctx.db.get(report.reporterId);

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

        if (args.sortBy === 'severity') {
            reportsWithReporters.sort((a, b) => b.otherReporters - a.otherReporters);
        } else {
            reportsWithReporters.sort((a, b) => b.timestamp - a.timestamp);
        }

        return reportsWithReporters;
    },
});

// Submit a new report (authenticated users only)
export const submitReport = mutation({
    args: {
        type: v.union(v.literal('comment'), v.literal('link'), v.literal('post')),
        targetId: v.string(),
        targetContent: v.string(),
        contextTitle: v.string(),
        contextId: v.optional(v.string()),
        reasons: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Bound every user-controlled string and the reasons array so a
        // single request cannot carry an oversized report payload.
        const targetContent = args.targetContent.slice(0, 2000);
        const contextTitle = args.contextTitle.slice(0, 200);
        const targetId = args.targetId.slice(0, 200);
        const contextId = args.contextId?.slice(0, 200);
        const reasons = [...new Set(args.reasons
            .map((reason) => reason.trim().slice(0, 100))
            .filter(Boolean))]
            .slice(0, 10);
        if (reasons.length === 0) {
            throw new Error("Select at least one reason");
        }

        const existingReport = await ctx.db
            .query("reports")
            .withIndex("by_target", (q) => q.eq("targetId", targetId))
            .filter((q) => q.eq(q.field("reporterId"), user._id))
            .first();

        if (existingReport) {
            throw new Error("You have already reported this content");
        }

        const reportId = await ctx.db.insert("reports", {
            type: args.type,
            targetId,
            targetContent,
            contextTitle,
            contextId,
            reasons,
            reporterId: user._id,
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
        action: v.string(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can resolve reports");
        }

        const report = await ctx.db.get(args.reportId);
        if (!report) {
            throw new Error("Report not found");
        }

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

        await ctx.db.patch(args.reportId, {
            status,
            resolvedAt: Date.now(),
            resolvedBy: user._id,
            moderatorNotes: args.notes,
        });

        await ctx.db.insert("moderationActions", {
            reportId: args.reportId,
            moderatorId: user._id,
            action: args.action,
            timestamp: Date.now(),
            notes: args.notes,
        });

        return { success: true, status };
    },
});

// Get moderation statistics (moderator/admin only)
export const getReportStats = query({
    args: {
        moderatorId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can view report stats");
        }

        // Use indexed queries instead of full table scan
        const pendingReports = await ctx.db.query("reports")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        // Get resolved reports (limited to recent for efficiency)
        const resolvedReports = await ctx.db.query("reports")
            .withIndex("by_timestamp")
            .filter((q) => q.neq(q.field("resolvedAt"), undefined))
            .order("desc")
            .take(100);

        const resolvedToday = resolvedReports.filter(
            r => r.resolvedAt && r.resolvedAt >= todayTimestamp
        );

        const totalResolutionTime = resolvedReports.reduce((sum, r) => {
            return sum + (r.resolvedAt! - r.timestamp);
        }, 0);
        const avgResolutionTime = resolvedReports.length > 0
            ? Math.round(totalResolutionTime / resolvedReports.length / 60000)
            : 0;

        let userResolvedCount = 0;
        if (args.moderatorId) {
            const userActions = await ctx.db
                .query("moderationActions")
                .withIndex("by_moderator", (q) => q.eq("moderatorId", args.moderatorId!))
                .collect();
            userResolvedCount = userActions.length;
        }

        // Get approximate total count (pending + resolved is good enough for stats)
        const totalReports = pendingReports.length + resolvedReports.length;

        return {
            totalReports,
            pendingReports: pendingReports.length,
            resolvedToday: resolvedToday.length,
            avgResolutionTime,
            userResolvedCount,
        };
    },
});

// Get moderation history/log (moderator/admin only)
export const getReportHistory = query({
    args: {
        moderatorId: v.optional(v.id("users")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!user || !isModerator(user)) {
            throw new Error("Unauthorized: Only moderators can view report history");
        }

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

        const actionsWithDetails = await Promise.all(
            actions.map(async (action) => {
                const report = await ctx.db.get(action.reportId);
                const moderator = await ctx.db.get(action.moderatorId);

                return {
                    ...action,
                    report: report ? {
                        id: report._id,
                        reasons: report.reasons,
                        targetContent: report.targetContent.slice(0, 500),
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
