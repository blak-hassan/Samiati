"use client";

import React, { use } from "react";
import SubmitEntryScreen from "@/components/screens/SubmitEntryScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { Challenge, RouteSearchParams } from "@/types";

export default function SubmitEntryPage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);
    const challenge = resolvedSearchParams.challenge ? (JSON.parse(resolvedSearchParams.challenge as string) as Challenge) : undefined;

    return (
        <SubmitEntryScreen
            navigate={navigate}
            goBack={goBack}
            challenge={challenge}
        />
    );
}
