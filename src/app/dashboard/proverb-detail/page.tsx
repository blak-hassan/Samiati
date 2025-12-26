"use client";

import React, { use } from "react";
import ProverbDetailScreen from "@/components/screens/ProverbDetailScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function ProverbDetailPage({ searchParams }: { searchParams: Promise<any> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);

    return (
        <ProverbDetailScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
