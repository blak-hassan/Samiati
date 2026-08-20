"use client";

import React from "react";
import SourceCard, { Source, getSourceDomain } from "./SourceCard";
import FollowUpChips from "./FollowUpChips";
import { SearchImage } from "@/services/sunflowerService";
import { cn } from "@/lib/utils";
import {
  Copy,
  Check,
  Volume2,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Link2,
  ImageOff,
  Link2Off,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchResultsProps {
  answer: string;
  sources: Source[];
  followUps: string[];
  images?: SearchImage[];
  onFollowUpSelect: (query: string) => void;
  isPlaying?: boolean;
  onPlayAudio?: () => void;
}

type ResultTab = "answer" | "images" | "links";

interface TabDef {
  id: ResultTab;
  label: string;
  icon: LucideIcon;
  count: number | null;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  answer,
  sources,
  followUps,
  images = [],
  onFollowUpSelect,
  isPlaying = false,
  onPlayAudio,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<ResultTab>("answer");
  const [highlighted, setHighlighted] = React.useState<number | null>(null);
  const highlightTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Jump to the source card and flash-highlight it (Perplexity behavior)
  const handleCitationClick = (num: number) => {
    const el = document.getElementById(`source-${num}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setHighlighted(num);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => setHighlighted(null), 2200);
    }
  };

  // Render answer with inline citation links
  const renderAnswer = (text: string) => {
    // Replace [1], [2], etc. with styled citation badges
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const num = parseInt(match[1]);
        const exists = num >= 1 && num <= sources.length;
        return (
          <button
            key={i}
            onClick={() => exists && handleCitationClick(num)}
            disabled={!exists}
            className={cn(
              "inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-black mx-0.5 align-baseline cursor-pointer hover:bg-primary/25 hover:scale-110 active:scale-95 transition-all",
              !exists && "opacity-40 cursor-default"
            )}
            title={exists ? `Source ${num}: ${sources[num - 1].title}` : `No source ${num}`}
          >
            {num}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const tabs: TabDef[] = [
    { id: "answer", label: "Answer", icon: Sparkles, count: null },
    { id: "images", label: "Images", icon: ImageIcon, count: images.length },
    { id: "links", label: "Links", icon: Link2, count: sources.length },
  ];

  return (
    <div className="w-full max-w-2xl space-y-4 animate-in fade-in duration-500">
      {/* Tab bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shrink-0",
                isActive
                  ? "bg-card border border-border/60 text-foreground shadow-sm"
                  : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive && "text-primary")} />
              {tab.label}
              {tab.count !== null && (
                <span
                  className={cn(
                    "text-[10px] font-black tabular-nums",
                    isActive ? "text-primary" : "text-muted-foreground/70"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Answer Tab */}
      {activeTab === "answer" && (
        <div className="space-y-5">
          {/* Sources Row */}
          {sources.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2.5">
                Sources
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {sources.map((source, i) => (
                  <div
                    key={i}
                    id={`source-${i + 1}`}
                    className={cn(
                      "rounded-2xl transition-all duration-300",
                      highlighted === i + 1 && "ring-2 ring-primary/60 bg-primary/5"
                    )}
                  >
                    <SourceCard source={source} index={i} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer — plain text, no bubble */}
          <div>
            <p className="text-sm md:text-base leading-relaxed tracking-tight font-medium text-foreground whitespace-pre-wrap">
              {renderAnswer(answer)}
            </p>

            {/* Answer actions */}
            <div className="flex items-center gap-2 mt-3">
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
      )}

      {/* Images Tab */}
      {activeTab === "images" &&
        (images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, i) => (
              <a
                key={i}
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl overflow-hidden border border-border/30 bg-card/40 hover:bg-card/70 hover:border-border/60 hover:shadow-md transition-all duration-200"
              >
                <div className="aspect-square overflow-hidden bg-muted/20">
                  <img
                    src={img.thumbnail}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="p-2.5 flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-foreground leading-snug line-clamp-2">
                    {img.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">
                    {getSourceDomain(img.url)}
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <ImageOff className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-bold text-muted-foreground">No images found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Try a more specific query
            </p>
          </div>
        ))}

      {/* Links Tab */}
      {activeTab === "links" &&
        (sources.length > 0 ? (
          <div className="space-y-2.5">
            {sources.map((source, i) => (
              <SourceCard key={i} source={source} index={i} variant="list" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Link2Off className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-bold text-muted-foreground">No links found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Try a more specific query
            </p>
          </div>
        ))}
    </div>
  );
};

export default SearchResults;