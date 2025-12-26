"use client";

import React, { use } from "react";
import SubmitEntryScreen from "@/components/screens/SubmitEntryScreen";
import { useNavigation } from "@/hooks/useNavigation";

export default function SubmitEntryPage({ searchParams }: { searchParams: Promise<any> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);
    const challenge = resolvedSearchParams.challenge ? JSON.parse(resolvedSearchParams.challenge as string) : undefined;

    return (
        <SubmitEntryScreen
            navigate={navigate}
            goBack={goBack}
            challenge={challenge}
        />
    );
}
