"use client";

import React from 'react';
import { NavigateFn, Screen, ContributionItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconRenderer } from '@/components/shared/IconRenderer';

interface Props {
    navigate: NavigateFn;
    goBack: () => void;
    tasks?: ContributionItem[];
    campaigns?: any[];
    onTaskSelect?: (task: ContributionItem) => void;
    onAddNew?: () => void;
}

const ChallengesScreen: React.FC<Props> = ({ navigate, goBack, tasks = [], campaigns = [], onTaskSelect, onAddNew }) => {
    const hasTasks = tasks.length > 0;
    const hasCampaigns = campaigns.length > 0;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-background-dark">
            <header className="flex items-center p-4 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-30">
                <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white hover:bg-muted rounded-full transition-colors">
                    <IconRenderer name="arrow_back" size={24} />
                </button>
                <h1 className="text-lg font-bold ml-2 text-stone-900 dark:text-white flex-1">Missions</h1>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] font-black">
                    {tasks.length} active
                </Badge>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {hasCampaigns && (
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <IconRenderer name="celebration" className="text-primary" size={18} />
                            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Campaigns</h2>
                        </div>
                        <div className="grid gap-3">
                            {campaigns.map((campaign: any) => (
                                <div 
                                    key={campaign._id}
                                    className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transition-transform"
                                    onClick={() => onTaskSelect?.({ id: campaign._id, type: 'Campaign', title: campaign.title, subtitle: campaign.description, status: 'Live', statusColor: 'text-primary', dotColor: 'bg-primary', icon: 'celebration', likes: 0, dislikes: 0, commentsCount: 0 } as ContributionItem)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge className="bg-primary text-white text-[8px] font-black uppercase">{campaign.status}</Badge>
                                        <span className="text-xs font-bold text-primary">{campaign.currentCount || 0}/{campaign.goalCount}</span>
                                    </div>
                                    <h3 className="font-bold text-sm mb-1">{campaign.title}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{campaign.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <IconRenderer name="assignment" className="text-primary" size={18} />
                        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Available Tasks</h2>
                    </div>

                    {hasTasks ? (
                        <div className="grid gap-3">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="bg-muted/30 border border-border/50 rounded-2xl p-4 cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all group"
                                    onClick={() => onTaskSelect?.(task)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${task.statusColor?.replace('text-', 'bg-') || 'bg-muted'}/10`}>
                                            <IconRenderer name={task.icon} className={task.statusColor || 'text-muted-foreground'} size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0 h-5">
                                                    {task.type}
                                                </Badge>
                                                <span className={`w-2 h-2 rounded-full ${task.dotColor}`} />
                                            </div>
                                            <h3 className="font-bold text-sm mb-1 line-clamp-2">{task.title}</h3>
                                            <p className="text-xs text-muted-foreground">{task.subtitle}</p>
                                        </div>
                                        <IconRenderer name="chevron_right" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                                    </div>
                                    
                                    {task.tags && task.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {task.tags.map((tag, idx) => (
                                                <span key={idx} className="text-[9px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                                <IconRenderer name="assignment" className="text-muted-foreground" size={40} />
                            </div>
                            <h3 className="font-bold text-stone-900 dark:text-white mb-2">No Tasks Available</h3>
                            <p className="text-sm text-muted-foreground mb-4">Check back soon for new missions or contribute your own!</p>
                        </div>
                    )}
                </section>
            </div>

            <footer className="p-4 border-t border-border bg-background/95 backdrop-blur-md">
                <Button 
                    onClick={onAddNew}
                    className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                >
                    <IconRenderer name="add" size={20} className="mr-2" />
                    Start New Task
                </Button>
                <Button 
                    onClick={() => window.location.href = '/dashboard/validate'}
                    variant="outline"
                    className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                    <IconRenderer name="fact_check" size={20} className="mr-2" />
                    Validate
                </Button>
                <Button 
                    onClick={() => window.location.href = '/dashboard/curation'}
                    variant="outline"
                    className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                    <IconRenderer name="auto_awesome" size={20} className="mr-2" />
                    Curate
                </Button>
                <Button 
                    onClick={() => window.location.href = '/dashboard/analytics'}
                    variant="outline"
                    className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                    <IconRenderer name="insights" size={20} className="mr-2" />
                    Analytics
                </Button>
            </footer>
        </div>
    );
};

export default ChallengesScreen;