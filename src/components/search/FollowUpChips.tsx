"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowUpChipsProps {
  suggestions: string[];
  onSelect: (query: string) => void;
}

const FollowUpChips: React.FC<FollowUpChipsProps> = ({
  suggestions,
  onSelect,
}) => {
  if (!suggestions.length) return null;

  return (
    <div className="w-full">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2.5">
        Ask follow-up
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, i) => (
          <Button
            key={i}
            variant="ghost"
            size="sm"
            onClick={() => onSelect(suggestion)}
            className={cn(
              "h-auto py-2 px-3.5 rounded-xl text-xs font-bold",
              "bg-card/40 border border-border/30 text-muted-foreground",
              "hover:bg-card hover:text-foreground hover:border-border/60",
              "hover:shadow-md transition-all duration-200",
              "gap-2 group"
            )}
          >
            <span className="text-left leading-snug">{suggestion}</span>
            <ArrowRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        ))}
      </div>
    </div>
  );
};

export default FollowUpChips;
