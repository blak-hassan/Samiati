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
    <div className={cn("flex items-center gap-2 py-3", className)}>
      <Loader2 className="w-4 h-4 animate-spin text-primary" />
      <span className="text-xs font-bold text-muted-foreground animate-pulse">
        Searching...
      </span>
    </div>
  );
};

export default SearchPhaseIndicator;
