"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Screen } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DiscoverCard } from "@/components/discover/DiscoverCard";
import {
  Compass,
  ArrowLeft,
  TrendingUp,
  Globe,
  MapPin,
  Cpu,
  Music,
  Newspaper,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface DiscoverScreenProps {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
}

const CATEGORIES = [
  { id: "for_you", label: "For You", icon: Compass },
  { id: "kenya", label: "Kenya", icon: MapPin },
  { id: "africa", label: "Africa", icon: Globe },
  { id: "tech", label: "Tech", icon: Cpu },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "culture", label: "Culture", icon: Music },
  { id: "world", label: "World", icon: Newspaper },
];

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({ navigate }) => {
  const [activeCategory, setActiveCategory] = useState("for_you");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const feed = useQuery(api.discover.feed.getFeed, {
    category: activeCategory,
    limit: 20,
  });

  const trending = useQuery(api.discover.feed.getTrending, { limit: 5 });
  const categoryCounts = useQuery(api.discover.feed.getCategoryCounts);

  const trackEngagement = useMutation(api.discover.feed.trackEngagement);
  const saveTopic = useMutation(api.discover.feed.saveTopic);
  const dismissTopic = useMutation(api.discover.feed.dismissTopic);

  const handleExplore = async (query: string, clusterId: string) => {
    // Track click engagement
    await trackEngagement({
      clusterId: clusterId as Id<"discoverClusters">,
      action: "explore",
    });

    // Navigate to home chat with the search query pre-filled
    navigate(Screen.HOME_CHAT, { q: query });
  };

  const handleSave = async (clusterId: string) => {
    await saveTopic({
      clusterId: clusterId as Id<"discoverClusters">,
    });
  };

  const handleDismiss = async (clusterId: string) => {
    await dismissTopic({
      clusterId: clusterId as Id<"discoverClusters">,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // The query will automatically refetch when the data changes
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const isLoading = feed === undefined || trending === undefined;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(Screen.HOME_CHAT)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              <h1 className="text-base font-bold">Discover</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-full"
          >
            <RefreshCw
              className={cn(
                "w-4 h-4 transition-transform",
                isRefreshing && "animate-spin"
              )}
            />
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="px-2 pb-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const count = categoryCounts?.[cat.id] ?? 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {cat.label}
                  {count > 0 && (
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className="text-[8px] px-1 py-0 h-3.5 min-w-[14px] justify-center"
                    >
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading Discover...</p>
          </div>
        ) : !feed || feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Compass className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              No topics yet. Content will appear as Samiati ingests news from Kenyan and African sources.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Trending section for for_you tab */}
            {activeCategory === "for_you" && trending && trending.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" />
                  Trending Now
                </h2>
                <div className="space-y-2">
                  {trending.slice(0, 3).map((topic: (typeof trending)[0]) => (
                    <DiscoverCard
                      key={topic._id}
                      cluster={topic}
                      onExplore={handleExplore}
                      onSave={handleSave}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Main feed */}
            <div>
              {activeCategory !== "for_you" && (
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-3">
                  {CATEGORIES.find((c) => c.id === activeCategory)?.label || activeCategory}
                </h2>
              )}
              <div className="space-y-2">
                {feed.map((topic: (typeof feed)[0]) => (
                  <DiscoverCard
                    key={topic._id}
                    cluster={topic}
                    onExplore={handleExplore}
                    onSave={handleSave}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
