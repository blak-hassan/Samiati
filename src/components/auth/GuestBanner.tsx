"use client";

import { Screen } from "@/types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

interface GuestBannerProps {
  navigate: (screen: Screen) => void;
}

export default function GuestBanner({ navigate }: GuestBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-primary/5 border-b border-primary/10">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <p className="text-sm text-foreground">
          <span className="font-bold">Sign in</span> to save conversations,
          contribute content, and message others.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => navigate(Screen.SIGN_IN)}
            className="h-8 px-4 text-xs font-bold"
          >
            Sign In
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
