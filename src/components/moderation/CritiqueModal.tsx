"use client";

import React, { useState } from 'react';
import { X, MessageSquare, Check, Sparkles } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (comment: string) => void;
    itemTitle: string;
}

const TEMPLATES = [
    "Translation seems inaccurate for this regional dialect.",
    "Great contribution! Could you add more cultural context?",
    "This proverb is perfect, but the meaning could be deeper.",
    "Check for spelling errors in the original text.",
    "The audio quality is a bit low, could you re-record?"
];

export const CritiqueModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSubmit,
    itemTitle
}) => {
    const [comment, setComment] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#32241a] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-rasta-gold flex items-center justify-center text-stone-900 shadow-lg shadow-rasta-gold/20">
                                <MessageSquare className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-stone-900 dark:text-white">Add Critique</h3>
                                <p className="text-xs font-bold text-stone-500 dark:text-text-muted">Reviewing: {itemTitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <X className="size-6 text-stone-400" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
                                <Sparkles className="size-3" />
                                Quick Templates
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {TEMPLATES.map((tmpl) => (
                                    <button
                                        key={tmpl}
                                        onClick={() => setComment(tmpl)}
                                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-stone-600 dark:text-sand-beige hover:bg-primary/10 hover:text-primary transition-all text-left"
                                    >
                                        {tmpl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Write your constructive feedback here..."
                                className="w-full h-32 bg-black/5 dark:bg-black/40 border-none rounded-2xl p-4 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-text-muted/40 focus:ring-2 focus:ring-rasta-gold transition-all resize-none outline-none"
                                maxLength={500}
                            />
                            <div className="absolute bottom-3 right-3 text-[10px] font-bold text-stone-400">
                                {comment.length}/500
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 text-sm font-black text-stone-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!comment.trim()}
                                onClick={() => {
                                    onSubmit(comment);
                                    setComment('');
                                }}
                                className="flex-1 py-3 bg-rasta-gold text-stone-900 text-sm font-black rounded-2xl shadow-lg shadow-rasta-gold/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                <Check className="size-4" />
                                Submit Critique
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
