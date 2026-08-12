"use client";

import { Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import CurationScreen from "@/components/screens/CurationScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useSearchParams } from "next/navigation";
import { ContributionItem } from "@/types";
import { Id } from "../../../../convex/_generated/dataModel";
import type {
    changaExampleTypeValidator,
    changaSplitRecommendationValidator,
    changaReleaseStatusValidator,
} from "../../../../convex/changa/validators";

const EXAMPLE_TYPE_MAP: Record<string, { label: string; desc: string }> = {
    lexicon_entry: { label: 'Word/Lexicon', desc: 'Single word with translation' },
    phrase_translation: { label: 'Phrase', desc: 'Common phrase' },
    sentence_translation: { label: 'Sentence', desc: 'Full sentence translation' },
    audio_reading: { label: 'Audio Reading', desc: 'Text read aloud' },
    transcription: { label: 'Transcription', desc: 'Audio to text' },
    cultural_context: { label: 'Cultural', desc: 'Cultural context' },
};

function CurationContent() {
    const { navigate, goBack } = useNavigation();
    const searchParams = useSearchParams();
    
    const languageFilter = searchParams.get('language') || undefined;
    const candidates = useQuery(api.changa.curation.listCuratedCandidates, { 
        languageCode: languageFilter,
        limit: 50 
    });
    const curatedExamples = useQuery(api.changa.curation.listDatasetReleaseCandidates, { limit: 50 });

    const promoteMutation = useMutation(api.changa.curation.promoteSubmissionToCuratedExample);
    const approveMutation = useMutation(api.changa.curation.approveCuratedExample);

    const pendingItems: ContributionItem[] = (candidates || []).map((item: { 
        _id: string; 
        sourceText?: string; 
        targetText?: string; 
        languageCode?: string; 
        submissionType?: string;
        contextNote?: string;
    }) => ({
        id: item._id,
        type: (item.submissionType as ContributionItem["type"]) || "Word",
        title: item.sourceText || "Submission",
        subtitle: item.targetText || item.contextNote || "",
        status: "Live",
        statusColor: "text-success",
        dotColor: "bg-success",
        icon: "check_circle",
        language: item.languageCode || "en",
        likes: 0,
        dislikes: 0,
        commentsCount: 0,
        userVote: null,
        comments: [],
        showComments: false,
    }));

    const promotedItems: ContributionItem[] = (curatedExamples || []).map((item: {
        _id: string;
        sourceText?: string;
        targetText?: string;
        languageCode?: string;
        exampleType?: string;
        releaseStatus?: string;
    }) => ({
        id: item._id,
        type: (item.exampleType as ContributionItem["type"]) || "Word",
        title: item.sourceText || "Example",
        subtitle: item.targetText || "",
        status: item.releaseStatus === 'approved' ? 'Live' : 'Under Review',
        statusColor: item.releaseStatus === 'approved' ? 'text-success' : 'text-warning',
        dotColor: item.releaseStatus === 'approved' ? 'bg-success' : 'bg-warning',
        icon: "auto_awesome",
        language: item.languageCode || "en",
        likes: 0,
        dislikes: 0,
        commentsCount: 0,
        userVote: null,
        comments: [],
        showComments: false,
    }));

    const handlePromote = async (itemId: string, exampleType: string, split?: string) => {
        await promoteMutation({
            submissionId: itemId as Id<"changaSubmissions">,
            exampleType: exampleType as typeof changaExampleTypeValidator.type,
            splitRecommendation: split as typeof changaSplitRecommendationValidator.type | undefined,
            qualityScore: 80,
        });
    };

    const handleApprove = async (itemId: string, status: string) => {
        await approveMutation({
            exampleId: itemId as Id<"changaCuratedExamples">,
            releaseStatus: status as typeof changaReleaseStatusValidator.type,
        });
    };

    return (
        <CurationScreen
            navigate={navigate}
            goBack={goBack}
            pendingItems={pendingItems}
            promotedItems={promotedItems}
            onPromote={handlePromote}
            onApprove={handleApprove}
            typeMap={EXAMPLE_TYPE_MAP}
        />
    );
}

export default function CurationPage() {
    return (
        <Suspense fallback={<div className="p-4">Loading...</div>}>
            <CurationContent />
        </Suspense>
    );
}