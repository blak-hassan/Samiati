"use client";

import { Suspense, useState } from "react";
import AddContributionScreen from "@/components/screens/AddContributionScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ContributionItem, Screen } from "@/types";
import { changaTaskTypeValues } from "../../../../convex/changa/validators";

type ChangaTaskType = typeof changaTaskTypeValues[number];

const CHANGA_TASK_TYPES = [
    { ui: 'Word', changa: 'lexicon_entry' },
    { ui: 'Proverb', changa: 'phrase_translation' },
    { ui: 'Story', changa: 'sentence_translation' },
    { ui: 'Translate Paragraphs', changa: 'sentence_translation' },
] as const;

const DEFAULT_LANGUAGE = 'sw';

function AddContributionContent() {
    const { navigate, goBack } = useNavigation();
    const searchParams = useSearchParams();

    const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE);

    const availableTasks = useQuery(api.changa.tasks.listAvailableTasks, { 
        languageCode: selectedLanguage,
        limit: 50 
    });

    const profile = useQuery(api.users.queries.getProfile, {});

    const createSimpleMutation = useMutation(api.changa.submissions.createSimpleSubmission);

    const initialDataRaw = searchParams.get('initialData');
    let initialData: ContributionItem | undefined;
    if (initialDataRaw) {
        try {
            initialData = JSON.parse(initialDataRaw);
        } catch (e) {
            console.error("Failed to parse initialData", e);
        }
    }

    const userLanguage = profile?.languages?.[0]?.id || selectedLanguage;

    const mappedTasks: ContributionItem[] = (availableTasks || []).map((task: { _id: string; taskType?: string; languageCode?: string; promptSourceText?: string; promptTargetText?: string; status?: string }) => {
        const typeMap = CHANGA_TASK_TYPES.find(t => t.changa === task.taskType);
        return {
            id: task._id,
            type: (typeMap?.ui as ContributionItem["type"]) || "Word",
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
            tags: task.languageCode ? [task.languageCode] : [],
        };
    });

    const handleSave = async (item: ContributionItem) => {
        try {
            const typeMap = CHANGA_TASK_TYPES.find(t => t.ui === item.type) || CHANGA_TASK_TYPES[0];
            
            await createSimpleMutation({
                taskType: typeMap.changa as ChangaTaskType,
                languageCode: userLanguage,
                sourceText: item.content,
                targetText: item.translation,
                contextNote: item.context,
            });

            navigate(Screen.CONTRIBUTIONS, { initialTab: 'My Changa', statusFilter: 'Under Review' });
        } catch (error) {
            console.error("Failed to save:", error);
        }
    };

    return (
        <AddContributionScreen
            navigate={navigate}
            goBack={goBack}
            onSave={handleSave}
            initialData={initialData}
            availableTasks={mappedTasks}
        />
    );
}

export default function AddContributionPage() {
    return (
        <Suspense fallback={<div className="p-4">Loading...</div>}>
            <AddContributionContent />
        </Suspense>
    );
}