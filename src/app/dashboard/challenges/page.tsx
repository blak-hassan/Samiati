"use client";

import { Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import dynamic from "next/dynamic";
import { useNavigation } from "@/hooks/useNavigation";
import { useSearchParams } from "next/navigation";
import { ContributionItem, Screen } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import type { CampaignItem } from "@/components/screens/ChallengesScreen";

const ChallengesScreen = dynamic(() => import("@/components/screens/ChallengesScreen"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark gap-4">
      <Skeleton className="w-8 h-8 rounded-full" />
      <Skeleton className="w-32 h-4" />
    </div>
  ),
});

const TASK_TYPE_MAP: Record<string, { label: string; icon: string }> = {
    lexicon_entry: { label: 'Word', icon: 'translate' },
    phrase_translation: { label: 'Proverb', icon: 'format_quote' },
    sentence_translation: { label: 'Story', icon: 'menu_book' },
    audio_reading: { label: 'Audio', icon: 'mic' },
    transcription: { label: 'Transcribe', icon: 'text_fields' },
    cultural_context: { label: 'Culture', icon: 'groups' },
};

function ChallengesContent() {
    const { navigate, goBack } = useNavigation();
    const searchParams = useSearchParams();

    const languageFilter = searchParams.get('language') || undefined;
    const availableTasks = useQuery(api.changa.tasks.listAvailableTasks, { 
        languageCode: languageFilter,
        limit: 20 
    });

    const activeCampaigns = useQuery(api.changa.campaigns.listActiveCampaigns, { limit: 10 });

    const taskItems: ContributionItem[] = (availableTasks || []).map((task: { 
        _id: string; 
        taskType?: string; 
        languageCode?: string; 
        promptSourceText?: string; 
        promptTargetText?: string; 
        status?: string;
        priority?: string;
        difficulty?: string;
        targetSubmissionCount?: number;
    }) => {
        const typeInfo = TASK_TYPE_MAP[task.taskType || ''] || { label: 'Task', icon: 'assignment' };
        return {
            id: task._id,
            type: typeInfo.label as ContributionItem["type"],
            title: task.promptSourceText || task.promptTargetText || typeInfo.label,
            subtitle: `${task.languageCode?.toUpperCase() || 'EN'} • ${task.difficulty || 'normal'}`,
            status: task.status === 'open' ? 'Live' : 'Under Review',
            statusColor: task.status === 'open' ? 'text-success' : 'text-warning',
            dotColor: task.status === 'open' ? 'bg-success' : 'bg-warning',
            icon: typeInfo.icon,
            likes: 0,
            dislikes: 0,
            commentsCount: task.targetSubmissionCount || 0,
            userVote: null,
            comments: [],
            showComments: false,
            tags: [task.languageCode || 'en', task.priority || 'normal'],
        };
    });

    const handleTaskSelect = (task: ContributionItem) => {
        navigate(Screen.ADD_CONTRIBUTION, { task });
    };

    const handleGoToAddContribution = () => {
        navigate(Screen.ADD_CONTRIBUTION);
    };

    return (
        <ChallengesScreen
            navigate={navigate}
            goBack={goBack}
            tasks={taskItems}
            campaigns={activeCampaigns as CampaignItem[]}
            onTaskSelect={handleTaskSelect}
            onAddNew={handleGoToAddContribution}
        />
    );
}

export default function ChallengesPage() {
    return (
        <Suspense fallback={<div className="p-4">Loading challenges...</div>}>
            <ChallengesContent />
        </Suspense>
    );
}
