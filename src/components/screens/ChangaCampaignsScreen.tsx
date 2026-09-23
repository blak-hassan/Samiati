"use client";

import React, { useState } from "react";
import { useChangaQuery as useQuery } from "@/hooks/useChangaData";
import { api } from "../../../convex/_generated/api";
import { Screen } from "@/types";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import EmptyState from "@/components/settings/EmptyState";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";

interface CampaignRow {
    _id: string;
    title: string;
    description: string;
    languageCode?: string;
    taskTypes: string[];
    goalCount: number;
    currentCount: number;
    status: string;
    createdAt: number;
}

const LANGUAGE_FILTERS = [
    { id: null, label: "All" },
    { id: "sheng", label: "Sheng" },
    { id: "sw", label: "Kiswahili" },
    { id: "yo", label: "Yoruba" },
    { id: "ig", label: "Igbo" },
] as const;

const ChangaCampaignsScreen: React.FC<{ goBack: () => void; navigate: (screen: Screen, params?: Record<string, unknown>) => void }> = ({ goBack, navigate }) => {
    const [langFilter, setLangFilter] = useState<string | null>(null);
    const campaigns = useQuery(api.changa.campaigns.listActiveCampaigns, { limit: 50, languageCode: langFilter ?? undefined }) as CampaignRow[] | undefined;
    const progress = (c: CampaignRow) => c.goalCount > 0 ? Math.min(100, Math.round((c.currentCount / c.goalCount) * 100)) : 0;

    return (
        <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
            <SettingsPageHeader title="Changa Campaigns" onBack={goBack} />

            <div className="flex flex-wrap gap-2 px-4 pt-3">
                {LANGUAGE_FILTERS.map((lang) => (
                    <button
                        key={lang.label}
                        onClick={() => setLangFilter(lang.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            langFilter === lang.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {!campaigns ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : campaigns.length === 0 ? (
                    <EmptyState
                        icon={<Users size={48} />}
                        title="No active campaigns"
                        description="Check back later or propose a new campaign to get started."
                    />
                ) : (
                    campaigns.map((campaign) => (
                        <div
                            key={campaign._id}
                            className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden"
                        >
                            <div className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-bold text-foreground text-sm">{campaign.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {campaign.description}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-full">
                                        {campaign.status}
                                    </span>
                                </div>

                                {campaign.languageCode && (
                                    <p className="text-xs text-muted-foreground">
                                        Language: <span className="font-medium text-foreground">{campaign.languageCode.toUpperCase()}</span>
                                    </p>
                                )}

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-medium text-foreground">
                                            {campaign.currentCount} / {campaign.goalCount} submissions
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-500"
                                            style={{ width: `${progress(campaign)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Users size={14} />
                                        <span>{campaign.taskTypes.length} task type{campaign.taskTypes.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(Screen.CHANGA_ACTIVITY)}
                                        className="text-xs text-primary hover:text-primary/80"
                                    >
                                        View Activity
                                        <ArrowRight size={14} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
};

export default ChangaCampaignsScreen;
