"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, Clock, Bookmark, Share2, ExternalLink, TrendingUp, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

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
    kenya: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    africa: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    tech: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    culture: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    trending: "bg-red-500/10 text-red-600 dark:text-red-400",
    world: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
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
  const handleExplore = () => {
    onExplore(cluster.suggestedQuery, cluster._id);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave?.(cluster._id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: cluster.topicTitle,
        text: cluster.summary,
        url: window.location.href,
      });
    }
  };

  const isTrending = cluster.trendScore > 60;
  const topSources = cluster.sourceDomains.slice(0, 3);

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card/50 p-4 transition-all duration-200",
        "hover:bg-card hover:shadow-md hover:border-primary/20",
        "active:scale-[0.99]",
        isTrending && "border-primary/20"
      )}
    >
      {/* Header: Category badge + Time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn("text-[10px] font-bold px-1.5 py-0", getCategoryColor(cluster.category))}
          >
            {getCategoryLabel(cluster.category)}
          </Badge>
          {cluster.country !== "KE" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {getCountryLabel(cluster.country)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {getTimeAgo(cluster.newestPublishedAt)}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-foreground leading-snug mb-2 line-clamp-2">
        {cluster.topicTitle}
      </h3>

      {/* Summary */}
      {cluster.summary && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
          {cluster.summary}
        </p>
      )}

      {/* Footer: Sources + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Source count */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Newspaper className="w-3 h-3" />
            <span>{cluster.sourceCount} source{cluster.sourceCount !== 1 ? "s" : ""}</span>
          </div>

          {/* Top source domains */}
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
        <div className="flex items-center gap-1">
          {isTrending && (
            <Badge variant="destructive" className="text-[9px] px-1 py-0 mr-1 gap-0.5">
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
            <Bookmark className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleShare}
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Why trending */}
      {cluster.whyTrending && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground/70 italic">
            {cluster.whyTrending}
          </p>
        </div>
      )}

      {/* Explore button - full width, always visible */}
      <Button
        onClick={handleExplore}
        className="w-full mt-3 h-9 text-xs font-bold gap-2"
        variant="default"
      >
        <Compass className="w-3.5 h-3.5" />
        Explore with Samiati
      </Button>
    </div>
  );
};
