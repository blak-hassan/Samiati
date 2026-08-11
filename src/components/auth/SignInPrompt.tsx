"use client";

import { Screen } from "@/types";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface SignInPromptProps {
  feature: string;
  description?: string;
  navigate: (screen: Screen) => void;
}

export default function SignInPrompt({
  feature,
  description,
  navigate,
}: SignInPromptProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-primary" />
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2">
        Sign in to {feature}
      </h2>

      <p className="text-muted-foreground max-w-sm mb-8">
        {description ||
          `Join Samiati to ${feature} and connect with the community.`}
      </p>

      <div className="flex gap-3">
        <Button
          onClick={() => navigate(Screen.SIGN_IN)}
          className="px-8"
        >
          Sign In
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(Screen.SIGN_UP)}
          className="px-8"
        >
          Create Account
        </Button>
      </div>
    </div>
  );
}
