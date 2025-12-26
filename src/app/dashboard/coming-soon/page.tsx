"use client";

import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ComingSoonPage() {
    const { goBack } = useNavigation();

    return (
        <div className="flex flex-col h-screen bg-background transition-colors">
            <header className="flex items-center px-4 h-16 border-b">
                <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg font-bold ml-2">Feature Coming Soon</h1>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl text-primary">🚧</span>
                </div>
                <h2 className="text-2xl font-black mb-2 tracking-tight">Under Construction</h2>
                <p className="text-muted-foreground font-medium max-w-sm">
                    We're working hard to bring this cultural preservation feature to life. Stay tuned!
                </p>
                <Button onClick={goBack} className="mt-8 px-8 rounded-full font-bold">
                    Go Back
                </Button>
            </main>
        </div>
    );
}
