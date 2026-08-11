"use client";

import React from 'react';
import { IconRenderer } from '@/components/shared/IconRenderer';
import { Badge } from '@/components/ui/badge';

interface Stats {
    totalTasks: number;
    openTasks: number;
    totalSubmissions: number;
    pendingValidation: number;
    validated: number;
    curated: number;
    rejected: number;
    campaigns: number;
    activeCampaigns: number;
}

interface Metric {
    language?: string;
    type?: string;
    count: number;
}

interface QualityMetrics {
    acceptanceRate: number;
    rejectionRate: number;
    curationRate: number;
    pendingRate: number;
}

interface Props {
    goBack: () => void;
    stats: Stats;
    topLanguages: Metric[];
    topTypes: Metric[];
    qualityMetrics: QualityMetrics;
}

const StatCard: React.FC<{ label: string; value: number | string; icon: string; color?: string; subtitle?: string }> = ({ 
    label, value, icon, color = 'text-primary', subtitle 
}) => (
    <div className="bg-muted/30 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
            <IconRenderer name={icon} className={color} size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-black">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
);

const ProgressBar: React.FC<{ label: string; value: number; max?: number; color: string }> = ({ 
    label, value, max = 100, color 
}) => (
    <div className="space-y-1">
        <div className="flex justify-between text-xs">
            <span className="font-bold uppercase">{label}</span>
            <span className="text-muted-foreground">{value}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
                className={`h-full ${color} transition-all duration-500`} 
                style={{ width: `${Math.min(value, 100)}%` }}
            />
        </div>
    </div>
);

const AnalyticsScreen: React.FC<Props> = ({ 
    goBack, 
    stats, 
    topLanguages, 
    topTypes, 
    qualityMetrics 
}) => {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-background-dark">
            <header className="flex items-center p-4 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-30">
                <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white hover:bg-muted rounded-full">
                    <IconRenderer name="arrow_back" size={24} />
                </button>
                <h1 className="text-lg font-bold ml-2 flex-1">Analytics</h1>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] font-black">
                    Live
                </Badge>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Overview Stats */}
                <section>
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Overview</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard 
                            label="Total Submissions" 
                            value={stats.totalSubmissions} 
                            icon="inventory_2" 
                            color="text-primary"
                        />
                        <StatCard 
                            label="Open Tasks" 
                            value={stats.openTasks} 
                            icon="assignment" 
                            color="text-success"
                            subtitle={`of ${stats.totalTasks} total`}
                        />
                        <StatCard 
                            label="Campaigns" 
                            value={stats.activeCampaigns} 
                            icon="celebration" 
                            color="text-warning"
                            subtitle={`${stats.campaigns} total`}
                        />
                        <StatCard 
                            label="Curated Examples" 
                            value={stats.curated} 
                            icon="auto_awesome" 
                            color="text-primary"
                            subtitle="for training"
                        />
                    </div>
                </section>

                {/* Pipeline Status */}
                <section>
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Pipeline</h2>
                    <div className="bg-muted/30 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-warning" />
                                <span className="text-sm font-bold">Pending</span>
                            </div>
                            <span className="text-lg font-black">{stats.pendingValidation}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-success" />
                                <span className="text-sm font-bold">Validated</span>
                            </div>
                            <span className="text-lg font-black">{stats.validated}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary" />
                                <span className="text-sm font-bold">Curated</span>
                            </div>
                            <span className="text-lg font-black">{stats.curated}</span>
                        </div>
                        {stats.rejected > 0 && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-error" />
                                    <span className="text-sm font-bold">Rejected</span>
                                </div>
                                <span className="text-lg font-black">{stats.rejected}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Quality Metrics */}
                <section>
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Quality</h2>
                    <div className="bg-muted/30 rounded-2xl p-4 space-y-4">
                        <ProgressBar 
                            label="Acceptance Rate" 
                            value={qualityMetrics.acceptanceRate} 
                            color="bg-success" 
                        />
                        <ProgressBar 
                            label="Curation Rate" 
                            value={qualityMetrics.curationRate} 
                            color="bg-primary" 
                        />
                        <ProgressBar 
                            label="Pending" 
                            value={qualityMetrics.pendingRate} 
                            color="bg-warning" 
                        />
                        {qualityMetrics.rejectionRate > 0 && (
                            <ProgressBar 
                                label="Rejection Rate" 
                                value={qualityMetrics.rejectionRate} 
                                color="bg-error" 
                            />
                        )}
                    </div>
                </section>

                {/* Language Breakdown */}
                {topLanguages.length > 0 && (
                    <section>
                        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Top Languages</h2>
                        <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
                            {topLanguages.map((lang, idx) => (
                                <div key={lang.language} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-muted-foreground w-6">{idx + 1}.</span>
                                        <Badge variant="outline" className="text-[10px] font-black">
                                            {lang.language}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary" 
                                                style={{ width: `${(lang.count / stats.totalSubmissions) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold w-8 text-right">{lang.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Type Breakdown */}
                {topTypes.length > 0 && (
                    <section>
                        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Submission Types</h2>
                        <div className="flex flex-wrap gap-2">
                            {topTypes.map(t => (
                                <div 
                                    key={t.type}
                                    className="bg-muted/50 rounded-full px-3 py-1.5 flex items-center gap-2"
                                >
                                    <span className="text-xs font-bold text-muted-foreground uppercase">{t.type}</span>
                                    <span className="text-sm font-black">{t.count}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {stats.totalSubmissions === 0 && (
                    <div className="text-center py-12">
                        <IconRenderer name="insights" size={64} className="text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">No Data Yet</h3>
                        <p className="text-sm text-muted-foreground">
                            Start contributing to see your impact metrics here.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AnalyticsScreen;