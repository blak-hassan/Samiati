"use client";

import React, { useState } from 'react';
import { NavigateFn, ContributionItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconRenderer } from '@/components/shared/IconRenderer';

interface Props {
    navigate: NavigateFn;
    goBack: () => void;
    pendingItems?: ContributionItem[];
    promotedItems?: ContributionItem[];
    onPromote?: (itemId: string, exampleType: string, split?: string) => Promise<void>;
    onApprove?: (itemId: string, status: string) => Promise<void>;
    typeMap?: Record<string, { label: string; desc: string }>;
}

const CurationScreen: React.FC<Props> = ({ 
    navigate, 
    goBack, 
    pendingItems = [], 
    promotedItems = [],
    onPromote,
    onApprove,
    typeMap = {}
}) => {
    const [activeTab, setActiveTab] = useState<'candidates' | 'curated'>('candidates');
    const [selectedItem, setSelectedItem] = useState<ContributionItem | null>(null);
    const [selectedType, setSelectedType] = useState<string>('lexicon_entry');
    const [selectedSplit, setSelectedSplit] = useState<string>('train');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePromote = async () => {
        if (!selectedItem || !onPromote) return;
        
        setIsSubmitting(true);
        try {
            await onPromote(selectedItem.id, selectedType, selectedSplit);
            setSelectedItem(null);
        } catch (error) {
            console.error('Failed to promote:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-background-dark">
            <header className="flex items-center p-4 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-30">
                <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white hover:bg-muted rounded-full">
                    <IconRenderer name="arrow_back" size={24} />
                </button>
                <h1 className="text-lg font-bold ml-2 flex-1">Curation</h1>
                <Badge variant="secondary" className="bg-success/10 text-success text-[10px] font-black">
                    {pendingItems.length} ready
                </Badge>
            </header>

            <div className="flex p-2 border-b border-border bg-muted/30">
                {['candidates', 'curated'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as typeof activeTab)}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                            activeTab === tab 
                                ? 'bg-white dark:bg-surface-dark shadow-sm' 
                                : 'text-muted-foreground'
                        }`}
                    >
                        {tab === 'candidates' ? 'Candidates' : 'Curated'}
                    </button>
                ))}
            </div>

            <main className="flex-1 overflow-y-auto p-4">
                {activeTab === 'candidates' ? (
                    selectedItem ? (
                        <div className="animate-in fade-in slide-in-from-right-4">
                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="flex items-center gap-2 text-sm font-bold text-muted-foreground mb-4"
                            >
                                <IconRenderer name="arrow_back" size={16} /> Back
                            </button>

                            <div className="bg-muted/30 rounded-2xl p-4 space-y-4">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-muted-foreground">Source</span>
                                    <p className="text-lg font-semibold">{selectedItem.title}</p>
                                </div>
                                {selectedItem.subtitle && (
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-muted-foreground">Target</span>
                                        <p className="text-stone-600">{selectedItem.subtitle}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 space-y-4">
                                <div>
                                    <span className="text-xs font-black uppercase text-muted-foreground">Example Type</span>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {Object.entries(typeMap).map(([key, info]) => (
                                            <button
                                                key={key}
                                                onClick={() => setSelectedType(key)}
                                                className={`p-3 rounded-xl text-left text-sm transition-all ${
                                                    selectedType === key
                                                        ? 'bg-primary text-white shadow-lg'
                                                        : 'bg-muted border border-border hover:border-primary/50'
                                                }`}
                                            >
                                                <div className="font-bold">{info.label}</div>
                                                <div className={`text-xs ${selectedType === key ? 'text-white/70' : 'text-muted-foreground'}`}>
                                                    {info.desc}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-xs font-black uppercase text-muted-foreground">Split</span>
                                    <div className="flex gap-2 mt-2">
                                        {['train', 'dev', 'test'].map(split => (
                                            <button
                                                key={split}
                                                onClick={() => setSelectedSplit(split)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold uppercase ${
                                                    selectedSplit === split
                                                        ? 'bg-primary text-white'
                                                        : 'bg-muted border border-border'
                                                }`}
                                            >
                                                {split}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button 
                                onClick={handlePromote}
                                disabled={isSubmitting}
                                className="w-full mt-6 h-12 rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50"
                            >
                                {isSubmitting ? 'Promoting...' : 'Promote to Curated'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingItems.length === 0 ? (
                                <div className="text-center py-12">
                                    <IconRenderer name="fact_check" size={48} className="text-muted-foreground mx-auto mb-3" />
                                    <p className="font-medium text-muted-foreground">No validated submissions yet</p>
                                    <p className="text-sm text-muted-foreground">Complete the validation flow first</p>
                                </div>
                            ) : (
                                pendingItems.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className="bg-muted/30 border border-border/50 rounded-2xl p-4 cursor-pointer hover:bg-muted/50 hover:border-success/30 transition-all"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                                                <IconRenderer name="check_circle" className="text-success" size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase">{item.type}</span>
                                                    <Badge variant="outline" className="text-[8px]">Validated</Badge>
                                                </div>
                                                <h3 className="font-semibold text-sm line-clamp-2">{item.title}</h3>
                                                <p className="text-xs text-muted-foreground mt-1">{item.language}</p>
                                            </div>
                                            <IconRenderer name="chevron_right" className="text-muted-foreground" size={20} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )
                ) : (
                    <div className="space-y-3">
                        {promotedItems.length === 0 ? (
                            <div className="text-center py-12">
                                <IconRenderer name="auto_awesome" size={48} className="text-muted-foreground mx-auto mb-3" />
                                <p className="font-medium text-muted-foreground">No curated examples yet</p>
                                <p className="text-sm text-muted-foreground">Promote validated submissions to start</p>
                            </div>
                        ) : (
                            promotedItems.map(item => (
                                <div
                                    key={item.id}
                                    className="bg-muted/30 border border-border/50 rounded-2xl p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <IconRenderer name="auto_awesome" className="text-primary" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="secondary" className="text-[8px]">{item.status}</Badge>
                                                <Badge variant="outline" className="text-[8px]">{item.language}</Badge>
                                            </div>
                                            <h3 className="font-semibold text-sm line-clamp-2">{item.title}</h3>
                                            {item.subtitle && (
                                                <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
                                            )}
                                        </div>
                                    </div>
                                    {item.status === 'Under Review' && (
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                                            <Button 
                                                size="sm" 
                                                onClick={() => onApprove?.(item.id, 'approved')}
                                                className="flex-1 h-8 rounded-lg text-xs font-bold"
                                            >
                                                Approve
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => onApprove?.(item.id, 'retired')}
                                                className="flex-1 h-8 rounded-lg text-xs font-bold"
                                            >
                                                Retire
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CurationScreen;