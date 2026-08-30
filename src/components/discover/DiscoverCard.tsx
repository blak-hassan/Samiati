"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, Clock, Bookmark, BookmarkCheck, Share2, Newspaper, X, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils";

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleExplore = () => {
    onExplore(cluster.suggestedQuery, cluster._id);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    onSave?.(cluster._id);
    showToast(isSaved ? "Removed from saved" : "Topic saved");
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: cluster.topicTitle,
      text: cluster.summary,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyToClipboard(shareData.url);
        showToast("Link copied to clipboard");
      }
    } catch {
      // User cancelled share
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.(cluster._id);
    showToast("Topic dismissed");
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

      {/* Image thumbnail */}
      {cluster.imageUrl && (
        <div className="mb-2 -mx-1">
          <img
            src={cluster.imageUrl}
            alt=""
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Title */}
      <h3 className="text-sm font-bold text-foreground leading-snug mb-1.5 line-clamp-2">
        {cluster.topicTitle}
      </h3>

      {/* Summary */}
      {cluster.summary && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">
          {cluster.summary}
        </p>
      )}

      {/* Why trending */}
      {cluster.whyTrending && (
        <p className="text-xs text-muted-foreground mb-2 italic">
          {cluster.whyTrending}
        </p>
      )}

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

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          {isTrending && (
            <Badge variant="destructive" className="text-[9px] px-1 py-0 mr-0.5 gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" />
              Trending
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleSave}
          >
            {isSaved ? (
              <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleShare}
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleDismiss}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-full shadow-lg text-xs font-bold z-50 animate-in fade-in slide-in-from-bottom-4">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
