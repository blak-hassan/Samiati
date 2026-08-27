"use client";

import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function FeedPage() {
  const { goBack } = useNavigation();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={goBack}
        className="rounded-full absolute top-4 left-4"
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-5xl font-extrabold tracking-tight text-stone-900 dark:text-white font-display">
          Muchenee
        </h1>

        <p className="text-lg font-medium text-stone-700 dark:text-stone-300">
          Coming Soon
        </p>
      </div>
    </main>
  );
}
