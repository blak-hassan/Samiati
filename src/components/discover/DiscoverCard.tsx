"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Clock,
  Bookmark,
  BookmarkCheck,
  Share2,
  Newspaper,
  X,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

interface DiscoverCardProps {
  cluster: {
    _id: string;
    topicTitle: string;
    summary: string;
    whyTrending: string;
    suggestedQuery: string;
    category: string;
    country: string;
    sourceCount: number;
    sourceDomains: string[];
    newestPublishedAt: number;
    trendScore: number;
    imageUrl?: string;
  };
  onExplore: (query: string, clusterId: string) => void;
  onSave?: (clusterId: string) => void;
  onDismiss?: (clusterId: string) => void;
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    kenya: "bg-rasta-green/10 text-rasta-green",
    africa: "bg-rasta-gold/10 text-rasta-gold",
    tech: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    culture: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    trending: "bg-rasta-red/10 text-rasta-red",
    world: "bg-muted text-muted-foreground",
  };
  return colors[category] || colors.world;
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    kenya: "Kenya",
    africa: "Africa",
    tech: "Technology",
    culture: "Culture",
    trending: "Trending",
    world: "World",
  };
  return labels[category] || category;
}

function getCountryLabel(country: string): string {
  const labels: Record<string, string> = {
    KE: "Kenya",
    UG: "Uganda",
    TZ: "Tanzania",
    ET: "Ethiopia",
    NG: "Nigeria",
    ZA: "South Africa",
    RW: "Rwanda",
  };
  return labels[country] || country;
}

export const DiscoverCard: React.FC<DiscoverCardProps> = ({
  cluster,
  onExplore,
  onSave,
  onDismiss,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  // Feedback goes through the app-wide ToastProvider (mounted in
  // src/app/layout.tsx) so every message is announced to assistive tech via
  // its aria-live region instead of living in a silent, unannounced div.
  const { toast } = useToast();

  const handleExplore = () => {
    onExplore(cluster.suggestedQuery, cluster._id);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // One-way control: there is no unsave mutation yet, so once a topic is
    // saved we keep the saved state and only show the "saved" feedback.
    if (isSaved) return;
    setIsSaved(true);
    onSave?.(cluster._id);
    toast("Topic saved", "success");
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: cluster.topicTitle,
      text: cluster.summary,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled the native share sheet — stay silent.
      }
    } else {
      try {
        await copyToClipboard(shareData.url);
        toast("Link copied to clipboard", "success");
      } catch {
        // Clipboard copy failure is a real error — surface it to the user.
        toast("Couldn't copy the link. Please copy it manually.", "error");
      }
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.(cluster._id);
    toast("Topic dismissed");
  };

  const isTrending = cluster.trendScore > 60;
  const topSources = cluster.sourceDomains.slice(0, 3);

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card/50 p-3 transition-all duration-200",
        "hover:bg-card hover:shadow-md hover:border-primary/20",
        "active:scale-[0.99]",
        isTrending && "border-primary/20"
      )}
    >
      {/* Header: Category badge + Time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className={cn("text-[10px] font-bold px-1.5 py-0", getCategoryColor(cluster.category))}
          >
            {getCategoryLabel(cluster.category)}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {getCountryLabel(cluster.country)}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {getTimeAgo(cluster.newestPublishedAt)}
        </div>
      </div>

      {/* Tappable body — the whole topic is one real button, so the
          Discover → Chat funnel is reachable by pointer and by keyboard.
          Deliberately contains no nested interactive elements. */}
      <button
        type="button"
        onClick={handleExplore}
        aria-label={`Explore ${cluster.topicTitle} with Samiati`}
        className={cn(
          "block w-full text-left rounded-lg cursor-pointer",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {cluster.imageUrl && (
          <img
            src={cluster.imageUrl}
            alt={`Thumbnail for ${cluster.topicTitle}`}
            className="mb-2 w-full h-32 object-cover rounded-lg"
          />
        )}

        <h3 className="text-sm font-bold text-foreground leading-snug mb-1.5 line-clamp-2">
          {cluster.topicTitle}
        </h3>

        {cluster.summary && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">
            {cluster.summary}
          </p>
        )}

        {cluster.whyTrending && (
          <p className="text-xs text-muted-foreground mb-2 italic">
            {cluster.whyTrending}
          </p>
        )}

        {/* Low-noise affordance so the card reads as tappable without
            repeating a full-width CTA on every row. */}
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
          <Compass className="w-3 h-3" aria-hidden="true" />
          Explore with Samiati
        </span>
      </button>

      {/* Footer: Sources + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Newspaper className="w-3 h-3" />
            <span>{cluster.sourceCount} source{cluster.sourceCount !== 1 ? "s" : ""}</span>
          </div>

          {topSources.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {topSources.map((domain) => (
                <span
                  key={domain}
                  className="text-[9px] text-muted-foreground/60 bg-muted/50 px-1 py-0.5 rounded"
                >
                  {domain.replace("www.", "")}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions — every control here is icon-only, so each carries an
            accessible name, and each is sized to a 44×44 minimum target. */}
        <div className="flex items-center gap-0.5">
          {isTrending && (
            <Badge variant="destructive" className="text-[9px] px-1 py-0 mr-0.5 gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" aria-hidden="true" />
              Trending
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={handleSave}
            aria-label={isSaved ? "Topic saved" : "Save topic"}
            title={isSaved ? "Topic saved" : "Save topic"}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-primary" aria-hidden="true" />
            ) : (
              <Bookmark className="w-4 h-4" aria-hidden="true" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={handleShare}
            aria-label="Share topic"
            title="Share topic"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
          </Button>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              onClick={handleDismiss}
              aria-label="Dismiss topic"
              title="Dismiss topic"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
