"use client";

import React, { use } from "react";
import WordDetailScreen from "@/components/screens/WordDetailScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { RouteSearchParams } from "@/types";

export default function WordDetailPage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
    const { navigate, goBack } = useNavigation();
    use(searchParams);

    return (
        <WordDetailScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
