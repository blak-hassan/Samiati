"use client";

import { useState } from "react";
import AddChallengeScreen from "@/components/screens/AddChallengeScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ChallengeType } from "@/types";
import { changaTaskTypeValues } from "../../../../convex/changa/validators";

type ChangaTaskType = typeof changaTaskTypeValues[number];

const TYPE_MAP: Record<string, ChangaTaskType[]> = {
    ACCENT: ['audio_reading'],
    DIALECT: ['dialect_mapping'],
    ALPHABET: ['lexicon_entry'],
    TOTEM: ['cultural_context'],
    CUSTOM: ['lexicon_entry'],
    TRANSLATION: ['sentence_translation'],
    STANDARD: ['lexicon_entry'],
};

export default function AddChallengePage() {
    const { navigate, goBack } = useNavigation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createCampaign = useMutation(api.changa.campaigns.createCampaign);

    const handleLaunch = async (challenge: {
        title: string;
        description: string;
        type: ChallengeType;
        goalCount: number;
    }) => {
        setIsSubmitting(true);
        try {
            await createCampaign({
                title: challenge.title,
                description: challenge.description,
                taskTypes: (TYPE_MAP[challenge.type] || ['lexicon_entry']),
                goalCount: challenge.goalCount,
                status: 'active' as const,
            });
            window.location.href = '/dashboard/challenges';
        } catch (error) {
            console.error('Failed to create campaign:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <AddChallengeScreen
            navigate={navigate}
            goBack={goBack}
            onLaunch={handleLaunch}
            isSubmitting={isSubmitting}
        />
    );
}