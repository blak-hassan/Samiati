"use client";

import { Suspense } from "react";
import ValidationRunner from "@/components/changa/ValidationRunner";
import { useNavigation } from "@/hooks/useNavigation";
import { useSearchParams } from "next/navigation";

function ValidationContent() {
    const { goBack } = useNavigation();
    const searchParams = useSearchParams();
    const languageCode = searchParams.get("language") || undefined;

    return <ValidationRunner languageCode={languageCode} goBack={goBack} />;
}

export default function ValidationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background p-8">Loading the review queue…</div>}>
            <ValidationContent />
        </Suspense>
    );
}