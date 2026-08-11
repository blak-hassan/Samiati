"use client";

import dynamic from "next/dynamic";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../../MockProviders";
import React, { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { RouteSearchParams, ContributionItem } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const ContributionsScreen = dynamic(() => import("@/components/screens/ContributionsScreen"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark gap-4">
      <Skeleton className="w-8 h-8 rounded-full" />
      <Skeleton className="w-32 h-4" />
    </div>
  ),
});

export default function ContributionsPage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
    const { navigate, goBack } = useNavigation();
    const { languages, myContributions, setMyContributions } = useUser();
    const resolvedSearchParams = use(searchParams);

    const initialTab = (resolvedSearchParams.initialTab as 'My Changa' | 'Challenges' | 'Moderation' | 'Saved') || "My Changa";
    const initialStatusFilter = (resolvedSearchParams.statusFilter as string) || "All";

    const availableTasks = useQuery(api.changa.tasks.listAvailableTasks, { limit: 20 });
    const userSubmissions = useQuery(api.changa.submissions.listUserSubmissions, { limit: 50 });
    const activeCampaigns = useQuery(api.changa.campaigns.listActiveCampaigns, { limit: 10 });

    const changaTasks: ContributionItem[] = (availableTasks || []).map((task: { _id: string; taskType?: string; languageCode?: string; promptSourceText?: string; promptTargetText?: string; status?: string; priority?: string }) => ({
        id: task._id,
        type: (task.taskType as ContributionItem["type"]) || "Word",
        title: task.promptSourceText || task.promptTargetText || "New Task",
        subtitle: `${task.taskType || "Word"} • ${task.languageCode || "en"}`,
        status: task.status === "open" ? "Live" : "Under Review",
        statusColor: task.status === "open" ? "text-success" : "text-warning",
        dotColor: task.status === "open" ? "bg-success" : "bg-warning",
        icon: "history_edu",
        likes: 0,
        dislikes: 0,
        commentsCount: 0,
        userVote: null,
        comments: [],
        showComments: false,
        tags: [task.languageCode || "en", task.taskType || "Word"],
    }));

    const myChangaItems: ContributionItem[] = (userSubmissions || []).map((sub: { _id: string; submissionType?: string; sourceText?: string; targetText?: string; status?: string; languageCode?: string }) => ({
        id: sub._id,
        type: (sub.submissionType as ContributionItem["type"]) || "Word",
        title: sub.sourceText || sub.targetText || "Submission",
        subtitle: `${sub.submissionType || "Word"} • ${sub.languageCode || "en"}`,
        status: sub.status === "validated" ? "Live" : sub.status === "rejected" ? "Declined" : "Under Review",
        statusColor: sub.status === "validated" ? "text-success" : sub.status === "rejected" ? "text-destructive" : "text-warning",
        dotColor: sub.status === "validated" ? "bg-success" : sub.status === "rejected" ? "bg-destructive" : "bg-warning",
        icon: "history_edu",
        likes: 0,
        dislikes: 0,
        commentsCount: 0,
        userVote: null,
        comments: [],
        showComments: false,
    }));

    return (
        <ContributionsScreen
            navigate={navigate}
            goBack={goBack}
            initialTab={initialTab}
            initialTypeFilter={resolvedSearchParams.typeFilter as string | undefined}
            initialStatusFilter={initialStatusFilter}
            onViewProfile={() => {}}
            myContributions={[...changaTasks, ...myChangaItems, ...myContributions]}
            setMyContributions={setMyContributions}
            languages={languages}
        />
    );
}
