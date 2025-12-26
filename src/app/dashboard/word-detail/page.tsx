"use client";

import React, { use } from "react";
import WordDetailScreen from "@/components/screens/WordDetailScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function WordDetailPage({ searchParams }: { searchParams: Promise<any> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);

    return (
        <WordDetailScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
