"use client";

import React from "react";
import { Target, X } from "lucide-react";
import { logChangaEvent } from "@/lib/changaTelemetry";
import type { Id } from "../../../convex/_generated/dataModel";

interface AttachToChallengeChipProps {
  campaignId: Id<"changaCampaigns">;
  campaignTitle: string;
  onAttach: (campaignId: Id<"changaCampaigns">) => void;
  onDismiss: () => void;
}

/**
 * Non-blocking suggestion shown after the user picks a language and there is
 * an active campaign that might be a fit. Attaching is optional; the user
 * can dismiss and the chip won't reappear for the same campaign during the
 * current session.
 */
export default function AttachToChallengeChip({
  campaignId,
  campaignTitle,
  onAttach,
  onDismiss,
}: AttachToChallengeChipProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-2xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-900 shadow-sm dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-100"
    >
      <Target className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        Looks like a fit for{" "}
        <span className="font-semibold">{campaignTitle}</span> — attach?
      </span>
      <button
        type="button"
        onClick={() => {
          logChangaEvent({ name: "attach_chip_attach" });
          onAttach(campaignId);
        }}
        className="rounded-full bg-amber-700 px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-amber-800 dark:bg-amber-500 dark:hover:bg-amber-400"
      >
        Attach
      </button>
      <button
        type="button"
        aria-label="Dismiss suggestion"
        onClick={() => {
          logChangaEvent({ name: "attach_chip_dismiss" });
          onDismiss();
        }}
        className="rounded-full p-1 text-amber-900/60 transition-colors hover:bg-amber-200/60 hover:text-amber-900 dark:text-amber-100/60 dark:hover:bg-amber-800/60"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
