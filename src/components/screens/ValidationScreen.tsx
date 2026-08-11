"use client";

import React, { useState } from 'react';
import { NavigateFn, ContributionItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconRenderer } from '@/components/shared/IconRenderer';

interface Props {
    navigate: NavigateFn;
    goBack: () => void;
    items?: ContributionItem[];
    onVote?: (itemId: string, vote: "approved" | "critiqued" | "rejected", comment?: string) => Promise<void>;
}

const ValidationScreen: React.FC<Props> = ({ navigate, goBack, items = [], onVote }) => {
    const [selectedItem, setSelectedItem] = useState<ContributionItem | null>(null);
    const [selectedVote, setSelectedVote] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleVote = async () => {
        if (!selectedItem || !selectedVote || !onVote) return;
        
        setIsSubmitting(true);
        try {
            const voteMap: Record<string, "approved" | "critiqued" | "rejected"> = {
                accept: "approved",
                minor_fix: "critiqued",
                reject: "rejected"
            };
            
            await onVote(
                selectedItem.id, 
                voteMap[selectedVote] || "rejected",
                comment || undefined
            );
            
            setSelectedItem(null);
            setSelectedVote(null);
            setComment('');
        } catch (error) {
            console.error('Failed to vote:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-background-dark">
                <header className="flex items-center p-4 border-b border-border">
                    <button onClick={goBack} className="p-2 -ml-2">
                        <IconRenderer name="arrow_back" size={24} />
                    </button>
                    <h1 className="text-lg font-bold flex-1">Validate</h1>
                </header>
                <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <IconRenderer name="fact_check" size={64} className="text-muted-foreground mb-4" />
                    <h2 className="text-lg font-bold mb-2">No Items to Validate</h2>
                    <p className="text-sm text-muted-foreground">Check back soon for submissions to review.</p>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-background-dark">
            <header className="flex items-center p-4 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-30">
                <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white hover:bg-muted rounded-full">
                    <IconRenderer name="arrow_back" size={24} />
                </button>
                <h1 className="text-lg font-bold ml-2 flex-1">Peer Review</h1>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] font-black">
                    {items.length} pending
                </Badge>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedItem ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <button 
                                onClick={() => setSelectedItem(null)}
                                className="flex items-center gap-2 text-sm font-bold text-muted-foreground"
                            >
                                <IconRenderer name="arrow_back" size={16} /> Back
                            </button>
                        </div>

                        <div className="bg-muted/30 rounded-2xl p-4 space-y-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source</span>
                                <p className="text-lg font-semibold mt-1">{selectedItem.title}</p>
                            </div>
                            
                            {selectedItem.subtitle && (
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target</span>
                                    <p className="text-stone-600 dark:text-stone-300 mt-1">{selectedItem.subtitle}</p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Badge variant="outline">{selectedItem.language || 'en'}</Badge>
                                <Badge variant="outline">{selectedItem.type}</Badge>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Your Review</span>
                            
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setSelectedVote('accept')}
                                    className={`py-4 rounded-xl font-bold text-sm transition-all flex flex-col items-center gap-2 ${
                                        selectedVote === 'accept' 
                                            ? 'bg-success text-white shadow-lg shadow-success/20' 
                                            : 'bg-muted hover:bg-success/10 text-muted-foreground border border-border'
                                    }`}
                                >
                                    <IconRenderer name="check_circle" size={24} />
                                    Approve
                                </button>
                                
                                <button
                                    onClick={() => setSelectedVote('minor_fix')}
                                    className={`py-4 rounded-xl font-bold text-sm transition-all flex flex-col items-center gap-2 ${
                                        selectedVote === 'minor_fix'
                                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                            : 'bg-muted hover:bg-amber-500/10 text-muted-foreground border border-border'
                                    }`}
                                >
                                    <IconRenderer name="edit" size={24} />
                                    Needs Fix
                                </button>
                                
                                <button
                                    onClick={() => setSelectedVote('reject')}
                                    className={`py-4 rounded-xl font-bold text-sm transition-all flex flex-col items-center gap-2 ${
                                        selectedVote === 'reject'
                                            ? 'bg-error text-white shadow-lg shadow-error/20'
                                            : 'bg-muted hover:bg-error/10 text-muted-foreground border border-border'
                                    }`}
                                >
                                    <IconRenderer name="cancel" size={24} />
                                    Reject
                                </button>
                            </div>
                        </div>

                        <div className="mt-4">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Optional comment..."
                                className="w-full h-20 bg-muted/50 border border-border rounded-xl p-3 text-sm resize-none"
                            />
                        </div>

                        <Button 
                            onClick={handleVote}
                            disabled={!selectedVote || isSubmitting}
                            className="w-full mt-4 h-12 rounded-xl font-black text-sm uppercase tracking-widest disabled:opacity-50"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="bg-muted/30 border border-border/50 rounded-2xl p-4 cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <IconRenderer name="rate_review" className="text-primary" size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-muted-foreground uppercase">{item.type}</span>
                                            <span className="w-2 h-2 rounded-full bg-warning" />
                                        </div>
                                        <h3 className="font-semibold text-sm line-clamp-2">{item.title}</h3>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                            <span>{item.language || 'en'}</span>
                                            <span>•</span>
                                            <span>{item.likes} votes</span>
                                            <span>•</span>
                                            <span>{item.commentsCount} approve</span>
                                        </div>
                                    </div>
                                    <IconRenderer name="chevron_right" className="text-muted-foreground" size={20} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ValidationScreen;