"use client";

import { Suspense } from "react";
import AddContributionScreen from "@/components/screens/AddContributionScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../../MockProviders";
import { useSearchParams } from "next/navigation";
import { ContributionItem } from "@/types";

function AddContributionContent() {
    const { navigate, goBack } = useNavigation();
    const { saveContribution } = useUser();
    const searchParams = useSearchParams();

    // Attempt to get initialData from params
    const initialDataRaw = searchParams.get('initialData');
    let initialData: ContributionItem | undefined;
    if (initialDataRaw) {
        try {
            initialData = JSON.parse(initialDataRaw);
        } catch (e) {
            console.error("Failed to parse initialData", e);
        }
    }

    const handleSave = (newItem: ContributionItem) => {
        saveContribution(newItem);
    };

    return (
        <AddContributionScreen
            navigate={navigate}
            goBack={goBack}
            onSave={handleSave}
            initialData={initialData}
        />
    );
}

export default function AddContributionPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AddContributionContent />
        </Suspense>
    );
}
