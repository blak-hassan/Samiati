"use client";

import ModerationDashboardScreen from "@/components/screens/ModerationDashboardScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ValidationItem, ContributionItem } from "@/types";

export default function ModerationDashboardPage() {
    const { navigate, goBack } = useNavigation();

    const validationQueue = useQuery(api.changa.validation.listValidationQueue, { limit: 50 });
    const submitVoteMutation = useMutation(api.changa.validation.submitValidationVote);

    const moderationItems = (validationQueue || []).map((item: { _id: string; sourceText?: string; targetText?: string; languageCode?: string; voteCount?: number; acceptCount?: number; rejectCount?: number; submissionType?: string }) => ({
        id: item._id,
        content: item.sourceText || item.targetText || "Submission",
        translation: item.targetText,
        languageCode: item.languageCode || "en",
        type: item.submissionType || "Word",
        language: item.languageCode || "en",
        status: "pending" as const,
        submittedAt: Date.now(),
        submittedBy: { id: item._id, name: "Anonymous", avatar: "" },
        voteCount: item.voteCount || 0,
        acceptCount: item.acceptCount || 0,
        rejectCount: item.rejectCount || 0,
        sentiment: "neutral",
    }));

    return (
        <ModerationDashboardScreen
            navigate={navigate}
            goBack={goBack}
            moderationItems={moderationItems as any}
            onVote={async (itemId: string, vote: "approved" | "critiqued" | "rejected", comment?: string) => {
                const voteMap: Record<string, string> = {
                    approved: "accept",
                    critiqued: "minor_fix",
                    rejected: "reject"
                };
                const _ = voteMap;
                await submitVoteMutation({
                    submissionId: itemId as any,
                    vote: voteMap[vote] as any,
                    comment,
                });
            }}
        />
    );
}
