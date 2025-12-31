"use client";

import AddContributionScreen from "@/components/screens/AddContributionScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useUser } from "../../MockProviders";
import { useSearchParams } from "next/navigation";

export default function AddContributionPage() {
    const { navigate, goBack } = useNavigation();
    const { setMyContributions } = useUser();
    const searchParams = useSearchParams();

    // Attempt to get initialData from params
    const initialDataRaw = searchParams.get('initialData');
    let initialData: any;
    if (initialDataRaw) {
        try {
            initialData = JSON.parse(initialDataRaw);
        } catch (e) {
            console.error("Failed to parse initialData", e);
        }
    }

    const handleSave = (newItem: any) => {
        setMyContributions(prev => {
            const index = prev.findIndex(c => c.id === newItem.id);
            if (index !== -1) {
                // Update existing
                const updated = [...prev];
                updated[index] = newItem;
                return updated;
            }
            return [newItem, ...prev]; // Create new
        });
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
