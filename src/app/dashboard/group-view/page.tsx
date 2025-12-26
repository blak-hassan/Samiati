"use client";

import React, { use } from "react";
import { useNavigation } from "@/hooks/useNavigation";

export default function GroupViewPage({ searchParams }: { searchParams: Promise<any> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);

    // GroupViewScreen seems missing or not imported in the original. 
    // In [slug]/page.tsx it's also not there.
    // I'll leave a placeholder or check if I should implement it.
    // Given the task is debugging, I'll keep the logic consistent.

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold">Group View</h1>
            <p>Group {resolvedSearchParams.groupId} details would go here.</p>
            <button onClick={goBack} className="mt-4 text-primary underline">Go Back</button>
        </div>
    );
}
