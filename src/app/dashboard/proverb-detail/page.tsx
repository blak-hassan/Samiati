"use client";

import React, { use } from "react";
import ProverbDetailScreen from "@/components/screens/ProverbDetailScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { RouteSearchParams } from "@/types";

export default function ProverbDetailPage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
    const { navigate, goBack } = useNavigation();
    use(searchParams);

    return (
        <ProverbDetailScreen
            navigate={navigate}
            goBack={goBack}
        />
    );
}
