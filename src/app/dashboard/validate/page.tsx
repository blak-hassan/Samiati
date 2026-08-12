"use client";

import { Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import ValidationScreen from "@/components/screens/ValidationScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useSearchParams } from "next/navigation";
import { ContributionItem } from "@/types";
import { Id } from "../../../../convex/_generated/dataModel";
import type { changaValidationVoteValidator } from "../../../../convex/changa/validators";

function ValidationContent() {
    const { navigate, goBack } = useNavigation();
    const searchParams = useSearchParams();
    
    const languageFilter = searchParams.get('language') || undefined;
    const validationQueue = useQuery(api.changa.validation.listValidationQueue, { 
        languageCode: languageFilter,
        limit: 20 
    });

    const submitVoteMutation = useMutation(api.changa.validation.submitValidationVote);

    const validationItems: ContributionItem[] = (validationQueue || []).map((item: { 
        _id: string; 
        sourceText?: string; 
        targetText?: string; 
        transcriptText?: string;
        languageCode?: string; 
        voteCount?: number; 
        acceptCount?: number; 
        rejectCount?: number; 
        submissionType?: string;
        contextNote?: string;
    }) => ({
        id: item._id,
        type: (item.submissionType as ContributionItem["type"]) || "Word",
        title: item.sourceText || item.transcriptText || "Submission",
        subtitle: item.targetText || item.contextNote || "",
        status: "Live",
        statusColor: "text-warning",
        dotColor: "bg-warning",
        icon: "rate_review",
        language: item.languageCode || "en",
        likes: item.voteCount || 0,
        dislikes: item.rejectCount || 0,
        commentsCount: item.acceptCount || 0,
        userVote: null,
        comments: [],
        showComments: false,
    }));

    const handleVote = async (itemId: string, vote: "approved" | "critiqued" | "rejected", comment?: string) => {
        const voteMap: Record<string, string> = {
            approved: "accept",
            critiqued: "minor_fix", 
            rejected: "reject"
        };
        
        await submitVoteMutation({
            submissionId: itemId as Id<"changaSubmissions">,
            vote: voteMap[vote] as typeof changaValidationVoteValidator.type,
            comment,
        });
    };

    return (
        <ValidationScreen
            navigate={navigate}
            goBack={goBack}
            items={validationItems}
            onVote={handleVote}
        />
    );
}

export default function ValidationPage() {
    return (
        <Suspense fallback={<div className="p-4">Loading...</div>}>
            <ValidationContent />
        </Suspense>
    );
}