"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  onBack: () => void;
  /** Optional "return to the main app" action, rendered next to the back button. */
  onExit?: () => void;
  children?: React.ReactNode;
  /** Optional "Saved · just now" status pill shown in the header. */
  status?: string;
  saving?: boolean;
}

/**
 * Round icon button that leaves Settings and returns to the main app (the
 * dashboard with the primary sidebar). Exported so the self-headered screens
 * (edit profile, view profile) render the exact same control in their own
 * headers — one look everywhere.
 */
export const SettingsExitButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <>
    <span aria-hidden className="mx-0.5 h-5 w-px bg-border/70" />
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="rounded-full text-muted-foreground hover:text-foreground"
      aria-label="Back to main menu"
      title="Back to main menu"
    >
      <Home className="w-5 h-5" />
    </Button>
  </>
);

const SettingsPageHeader: React.FC<Props> = ({ title, onBack, onExit, children, status, saving }) => {
  return (
    <header className="flex items-center px-4 h-14 sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-border/50">
      <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 rounded-full" aria-label="Go back">
        <ArrowLeft className="w-5 h-5" />
      </Button>
      {onExit && <SettingsExitButton onClick={onExit} />}
      <h1 className="text-base font-bold text-foreground ml-2 tracking-tight truncate">{title}</h1>
      {(status || saving) && (
        <span
          className={cn(
            "ml-2 inline-flex items-center gap-1 rounded-full px-2.5 h-6 text-[10px] font-bold border transition-opacity",
            saving
              ? "bg-muted text-muted-foreground border-border/60"
              : "bg-[var(--color-success)/10] text-[var(--color-success)] border-[var(--color-success)/30] dark:bg-[var(--color-success)/20] dark:text-[var(--color-success)] dark:border-[var(--color-success)/40]",
          )}
          aria-live="polite"
        >
          {saving ? "Saving…" : (
            <>
              <Check className="w-3 h-3" />
              {status ?? "Saved"}
            </>
          )}
        </span>
      )}
      {children && <div className="ml-auto">{children}</div>}
    </header>
  );
};

export default SettingsPageHeader;

