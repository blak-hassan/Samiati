"use client";

import ModerationDashboardScreen from "@/components/screens/ModerationDashboardScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ValidationItem } from "@/types";
import { Id } from "../../../../convex/_generated/dataModel";
import type { changaValidationVoteValidator } from "../../../../convex/changa/validators";

export default function ModerationDashboardPage() {
    const { navigate, goBack } = useNavigation();

    const validationQueue = useQuery(api.changa.validation.listValidationQueue, { limit: 50 });
    const submitVoteMutation = useMutation(api.changa.validation.submitValidationVote);

    const moderationItems: ValidationItem[] = (validationQueue || []).map((item: { _id: string; sourceText?: string; targetText?: string; languageCode?: string; voteCount?: number; acceptCount?: number; rejectCount?: number; submissionType?: string }) => ({
        id: item._id,
        type: (item.submissionType || "Word") as ValidationItem['type'],
        language: item.languageCode || "en",
        languageCode: item.languageCode || "en",
        content: {
            original: item.sourceText || item.targetText || "Submission",
            translation: item.targetText,
        },
        author: { id: item._id, name: "Anonymous", handle: "", avatar: "" },
        status: "pending",
        sentiment: { upvotes: 0, downvotes: 0, validations: 0 },
        reviews: [],
        timestamp: new Date().toISOString(),
    }));

    return (
        <ModerationDashboardScreen
            navigate={navigate}
            goBack={goBack}
            moderationItems={moderationItems}
            onVote={async (itemId: string, vote: "approved" | "critiqued" | "rejected", comment?: string) => {
                const voteMap: Record<string, string> = {
                    approved: "accept",
                    critiqued: "minor_fix",
                    rejected: "reject"
                };
                const _ = voteMap;
                await submitVoteMutation({
                    submissionId: itemId as Id<"changaSubmissions">,
                    vote: voteMap[vote] as typeof changaValidationVoteValidator.type,
                    comment,
                });
            }}
        />
    );
}
