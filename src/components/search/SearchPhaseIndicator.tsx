"use client";

import React from "react";
import { Search, BookOpen, PenTool, Loader2 } from "lucide-react";
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
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <Loader2 className="w-4 h-4 animate-spin text-primary" />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground animate-pulse">
          <Search className="w-4 h-4 text-primary" />
          <span>Searching the web</span>
        </div>
        <span className="text-muted-foreground/30">→</span>
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground/40">
          <BookOpen className="w-4 h-4" />
          <span>Reading sources</span>
        </div>
        <span className="text-muted-foreground/30">→</span>
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground/40">
          <PenTool className="w-4 h-4" />
          <span>Writing answer</span>
        </div>
      </div>
    </div>
  );
};

export default SearchPhaseIndicator;
