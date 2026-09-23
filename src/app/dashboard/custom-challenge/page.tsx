"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import CustomChallengeBuilder from "@/components/changa/CustomChallengeBuilder";

function CustomChallengePageContent() {
    const searchParams = useSearchParams();
    return (
        <CustomChallengeBuilder
            initialTitle={searchParams.get("title") ?? ""}
            initialLanguageCode={searchParams.get("languageCode") ?? "sheng"}
            initialCampaignId={searchParams.get("campaignId") ?? undefined}
        />
    );
}

export default function CustomChallengePage() {
    return (
        <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
            <CustomChallengePageContent />
        </Suspense>
    );
}
