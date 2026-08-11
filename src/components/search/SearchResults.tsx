"use client";

import React from "react";
import SourceCard, { Source } from "./SourceCard";
import FollowUpChips from "./FollowUpChips";
import { cn } from "@/lib/utils";
import { Copy, Check, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchResultsProps {
  answer: string;
  sources: Source[];
  followUps: string[];
  onFollowUpSelect: (query: string) => void;
  isPlaying?: boolean;
  onPlayAudio?: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  answer,
  sources,
  followUps,
  onFollowUpSelect,
  isPlaying = false,
  onPlayAudio,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render answer with inline citation links
  const renderAnswer = (text: string) => {
    // Replace [1], [2], etc. with styled citation badges
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const num = parseInt(match[1]);
        return (
          <sup
            key={i}
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-black mx-0.5 cursor-pointer hover:bg-primary/20 transition-colors"
            title={`Source ${num}`}
          >
            {num}
          </sup>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-2xl space-y-5 animate-in fade-in duration-500">
      {/* Sources Row */}
      {sources.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2.5">
            Sources
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {sources.map((source, i) => (
              <SourceCard key={i} source={source} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Answer */}
      <div className="bg-card/30 border border-border/20 rounded-2xl p-5">
        <p className="text-sm md:text-base leading-relaxed tracking-tight font-medium text-foreground whitespace-pre-wrap">
          {renderAnswer(answer)}
        </p>

        {/* Answer actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/20">
          {onPlayAudio && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayAudio}
              className={cn(
                "h-7 w-7 rounded-full transition-all",
                isPlaying
                  ? "text-primary bg-primary/10 animate-pulse"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              title={isPlaying ? "Stop audio" : "Listen to answer"}
            >
              {isPlaying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-7 w-7 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
            title="Copy answer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Follow-up Suggestions */}
      <FollowUpChips suggestions={followUps} onSelect={onFollowUpSelect} />
    </div>
  );
};

export default SearchResults;
