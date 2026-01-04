
"use client";

import React from "react";
import IdeaSubmittedScreen from "@/components/screens/IdeaSubmittedScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function IdeaSubmittedPage() {
    const { navigate } = useNavigation();

    return (
        <IdeaSubmittedScreen
            navigate={navigate}
        />
    );
}
