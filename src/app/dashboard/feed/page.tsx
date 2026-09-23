"use client";

import { useNavigation } from "@/hooks/useNavigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { WaitlistForm } from "@/components/WaitlistForm";

export default function FeedPage() {
  const { goBack } = useNavigation();

  return (
    <main id="main" tabIndex={-1} className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={goBack}
        className="rounded-full absolute top-4 left-4"
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>

      <div className="text-center space-y-6 max-w-md w-full">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground font-display">
          Muchenee
        </h1>

        <p className="text-lg font-medium text-muted-foreground">
          Coming Soon
        </p>

        <WaitlistForm
          source="mushenee"
          title="Join the Muchenee waitlist"
          description="Get notified the moment Muchenee launches."
        />
      </div>
    </main>
  );
}
