"use client";

import { Suspense, useMemo } from "react";
import { useChangaQuery as useQuery } from "@/hooks/useChangaData";
import { api } from "../../../../convex/_generated/api";
import AnalyticsScreen from "@/components/screens/AnalyticsScreen";
import { useNavigation } from "@/hooks/useNavigation";

// Local mirrors of the Convex shapes we read. The generated API bindings
// are stale in this worktree so the useQuery return type widens to unknown;
// these types let us annotate the callbacks and keep the typecheck green
// without changing runtime behavior. When `npx convex dev` regenerates
// the bindings, these annotations become redundant but harmless.
type SubmissionLike = {
    status?: string;
    languageCode?: string;
    submissionType?: string;
};
type CampaignLike = { status?: string };
type TaskLike = { status?: string };

function AnalyticsContent() {
    const { goBack } = useNavigation();

    const tasks = useQuery(api.changa.tasks.listAvailableTasks, { limit: 100 }) as TaskLike[] | undefined;
    const allSubmissions = useQuery(api.changa.submissions.listAllSubmissions, { limit: 1000 }) as SubmissionLike[] | undefined;
    const campaigns = useQuery(api.changa.campaigns.listActiveCampaigns, { limit: 50 }) as CampaignLike[] | undefined;

    const stats = useMemo(() => {
        const subs = allSubmissions ?? [];
        return {
            totalTasks: tasks?.length || 0,
            openTasks: tasks?.filter((t) => t.status === 'open').length || 0,
            totalSubmissions: subs.length,
            pendingValidation: subs.filter((s) => s.status === 'submitted' || s.status === 'in_validation').length || 0,
            validated: subs.filter((s) => s.status === 'validated').length || 0,
            curated: subs.filter((s) => s.status === 'curated').length || 0,
            rejected: subs.filter((s) => s.status === 'rejected').length || 0,
            campaigns: campaigns?.length || 0,
            activeCampaigns: campaigns?.filter((c) => c.status === 'active').length || 0,
        };
    }, [tasks, allSubmissions, campaigns]);

    const topLanguages = useMemo(() => {
        const subs = allSubmissions ?? [];
        const languageStats = subs.reduce<Record<string, number>>((acc: Record<string, number>, s: SubmissionLike) => {
            const lang = s.languageCode || 'unknown';
            acc[lang] = (acc[lang] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(languageStats)
            .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
            .slice(0, 10)
            .map(([lang, count]: [string, number]) => ({ language: lang.toUpperCase(), count }));
    }, [allSubmissions]);

    const topTypes = useMemo(() => {
        const subs = allSubmissions ?? [];
        const typeStats = subs.reduce<Record<string, number>>((acc: Record<string, number>, s: SubmissionLike) => {
            const type = s.submissionType || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(typeStats)
            .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
            .slice(0, 8)
            .map(([type, count]: [string, number]) => ({ type, count }));
    }, [allSubmissions]);

    const qualityMetrics = useMemo(() => ({
        acceptanceRate: stats.totalSubmissions > 0
            ? Math.round((stats.validated / stats.totalSubmissions) * 100)
            : 0,
        rejectionRate: stats.totalSubmissions > 0
            ? Math.round((stats.rejected / stats.totalSubmissions) * 100)
            : 0,
        curationRate: stats.validated > 0
            ? Math.round((stats.curated / stats.validated) * 100)
            : 0,
        pendingRate: stats.totalSubmissions > 0
            ? Math.round((stats.pendingValidation / stats.totalSubmissions) * 100)
            : 0,
    }), [stats]);

    return (
        <AnalyticsScreen
            goBack={goBack}
            stats={stats}
            topLanguages={topLanguages}
            topTypes={topTypes}
            qualityMetrics={qualityMetrics}
        />
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<div className="p-4">Loading analytics...</div>}>
            <AnalyticsContent />
        </Suspense>
    );
}