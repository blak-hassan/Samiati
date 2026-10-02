"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchPhaseIndicatorProps {
  isSearching: boolean;
  className?: string;
}

const SearchPhaseIndicator: React.FC<SearchPhaseIndicatorProps> = ({
  isSearching,
  className,
}) => {
  if (!isSearching) return null;

  return (
    // Announced politely: previously the status text appeared and disappeared
    // silently, so screen-reader users got no signal that a search had begun.
    <div
      role="status"
      aria-live="polite"
      className={cn("flex items-center gap-2 py-3", className)}
    >
      <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
      <span className="text-xs font-bold text-muted-foreground animate-pulse">
        Searching...
      </span>
    </div>
  );
};

export default SearchPhaseIndicator;
