"use client";

import { Suspense } from "react";
import MyChangaActivity from "@/components/changa/MyChangaActivity";
import { useNavigation } from "@/hooks/useNavigation";

function ChangaActivityContent() {
    const { navigate, goBack } = useNavigation();
    return <MyChangaActivity navigate={navigate} goBack={goBack} />;
}

export default function ChangaActivityPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-amber-50 p-8 dark:bg-stone-950">Loading your activity…</div>}>
            <ChangaActivityContent />
        </Suspense>
    );
}