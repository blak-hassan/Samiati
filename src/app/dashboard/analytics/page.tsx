"use client";

import { Suspense, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import AnalyticsScreen from "@/components/screens/AnalyticsScreen";
import { useNavigation } from "@/hooks/useNavigation";

function AnalyticsContent() {
    const { goBack } = useNavigation();

    const tasks = useQuery(api.changa.tasks.listAvailableTasks, { limit: 100 });
    const allSubmissions = useQuery(api.changa.submissions.listAllSubmissions, { limit: 1000 });
    const campaigns = useQuery(api.changa.campaigns.listActiveCampaigns, { limit: 50 });

    const stats = useMemo(() => {
        const subs = allSubmissions ?? [];
        return {
            totalTasks: tasks?.length || 0,
            openTasks: tasks?.filter((t) => (t as { status?: string }).status === 'open').length || 0,
            totalSubmissions: subs.length,
            pendingValidation: subs.filter((s) => (s as { status?: string }).status === 'submitted' || (s as { status?: string }).status === 'in_validation').length || 0,
            validated: subs.filter((s) => (s as { status?: string }).status === 'validated').length || 0,
            curated: subs.filter((s) => (s as { status?: string }).status === 'curated').length || 0,
            rejected: subs.filter((s) => (s as { status?: string }).status === 'rejected').length || 0,
            campaigns: campaigns?.length || 0,
            activeCampaigns: campaigns?.filter((c) => (c as { status?: string }).status === 'active').length || 0,
        };
    }, [tasks, allSubmissions, campaigns]);

    const topLanguages = useMemo(() => {
        const subs = allSubmissions ?? [];
        const languageStats = subs.reduce<Record<string, number>>((acc, s) => {
            const lang = (s as { languageCode?: string }).languageCode || 'unknown';
            acc[lang] = (acc[lang] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(languageStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([lang, count]) => ({ language: lang.toUpperCase(), count }));
    }, [allSubmissions]);

    const topTypes = useMemo(() => {
        const subs = allSubmissions ?? [];
        const typeStats = subs.reduce<Record<string, number>>((acc, s) => {
            const type = (s as { submissionType?: string }).submissionType || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(typeStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([type, count]) => ({ type, count }));
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