"use client";

import { Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import AnalyticsScreen from "@/components/screens/AnalyticsScreen";
import { useNavigation } from "@/hooks/useNavigation";

function AnalyticsContent() {
    const { goBack } = useNavigation();

    const tasks = useQuery(api.changa.tasks.listAvailableTasks, { limit: 100 });
    const submissions = useQuery(api.changa.submissions.listAllSubmissions, { limit: 500 });
    const campaigns = useQuery(api.changa.campaigns.listActiveCampaigns, { limit: 50 });
    const candidates = useQuery(api.changa.curation.listCuratedCandidates, { limit: 200 });

    const allSubmissions = useQuery(api.changa.submissions.listAllSubmissions, { limit: 1000 });
    const curatedExamples = useQuery(api.changa.curation.listDatasetReleaseCandidates, { limit: 500 });

    const stats = {
        totalTasks: tasks?.length || 0,
        openTasks: tasks?.filter((t: any) => t.status === 'open').length || 0,
        totalSubmissions: allSubmissions?.length || 0,
        pendingValidation: allSubmissions?.filter((s: any) => s.status === 'submitted' || s.status === 'in_validation').length || 0,
        validated: allSubmissions?.filter((s: any) => s.status === 'validated').length || 0,
        curated: allSubmissions?.filter((s: any) => s.status === 'curated').length || 0,
        rejected: allSubmissions?.filter((s: any) => s.status === 'rejected').length || 0,
        campaigns: campaigns?.length || 0,
        activeCampaigns: campaigns?.filter((c: any) => c.status === 'active').length || 0,
    };

    const languageStats = (allSubmissions || []).reduce((acc: Record<string, number>, s: any) => {
        const lang = s.languageCode || 'unknown';
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
    }, {});

    const topLanguages = Object.entries(languageStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([lang, count]) => ({ language: lang.toUpperCase(), count }));

    const typeStats = (allSubmissions || []).reduce((acc: Record<string, number>, s: any) => {
        const type = s.submissionType || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const topTypes = Object.entries(typeStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([type, count]) => ({ type, count }));

    const qualityMetrics = {
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
    };

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