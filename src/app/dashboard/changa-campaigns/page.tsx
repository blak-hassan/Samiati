"use client";

import ChangaCampaignsScreen from "@/components/screens/ChangaCampaignsScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function ChangaCampaignsPage() {
    const { goBack, navigate } = useNavigation();

    return <ChangaCampaignsScreen goBack={goBack} navigate={navigate} />;
}
