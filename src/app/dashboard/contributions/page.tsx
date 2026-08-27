"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page is deprecated. All Changa functionality has moved to /dashboard/changa.
// Redirect any direct navigation here to the new Changa flow.
export default function ContributionsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/changa");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Redirecting to Changa...</p>
            </div>
        </div>
    );
}
