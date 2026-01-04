"use client";

import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Check } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, details?: string) => void;
}

const REASONS = [
    { id: 'inaccurate', label: 'Inaccurate Translation', desc: 'The translation does not match the original text.' },
    { id: 'low-quality', label: 'Low Linguistic Quality', desc: 'Grammar or spelling is poor.' },
    { id: 'spam', label: 'Spam / Commercial', desc: 'Post is promotional or repetitive.' },
    { id: 'duplicate', label: 'Duplicate Content', desc: 'This contribution already exists.' },
    { id: 'inappropriate', label: 'Inappropriate Content', desc: 'Violates community guidelines.' },
    { id: 'other', label: 'Other / Custom Reason', desc: 'Something else is wrong.' },
];

export const ReportModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSubmit
}) => {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [details, setDetails] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#32241a] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-rasta-red flex items-center justify-center text-white shadow-lg shadow-rasta-red/20">
                                <Flag className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-stone-900 dark:text-white">Flag Content</h3>
                                <p className="text-xs font-bold text-stone-500 dark:text-text-muted">Report low quality or issues</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <X className="size-6 text-stone-400" />
                        </button>
                    </div>

                    <div className="space-y-3 mb-6">
                        {REASONS.map((reason) => (
                            <button
                                key={reason.id}
                                onClick={() => setSelectedReason(reason.id)}
                                className={`w-full p-3 rounded-2xl border text-left transition-all ${selectedReason === reason.id
                                        ? 'border-rasta-red bg-rasta-red/5 ring-1 ring-rasta-red/20'
                                        : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:bg-black/10'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className={`text-sm font-black ${selectedReason === reason.id ? 'text-rasta-red' : 'text-stone-900 dark:text-white'}`}>
                                        {reason.label}
                                    </span>
                                    {selectedReason === reason.id && <div className="size-2 rounded-full bg-rasta-red" />}
                                </div>
                                <p className="text-[10px] font-medium text-stone-500 dark:text-text-muted">
                                    {reason.desc}
                                </p>
                            </button>
                        ))}
                    </div>

                    {selectedReason === 'other' && (
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Please provide more details..."
                            className="w-full h-24 mb-4 bg-black/5 dark:bg-black/40 border-none rounded-2xl p-4 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-text-muted/40 focus:ring-2 focus:ring-rasta-red transition-all resize-none outline-none"
                        />
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-sm font-black text-stone-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={!selectedReason || (selectedReason === 'other' && !details.trim())}
                            onClick={() => {
                                const reasonLabel = REASONS.find(r => r.id === selectedReason)?.label || 'Other';
                                onSubmit(reasonLabel, details);
                                setSelectedReason(null);
                                setDetails('');
                            }}
                            className="flex-1 py-3 bg-rasta-red text-white text-sm font-black rounded-2xl shadow-lg shadow-rasta-red/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            <AlertTriangle className="size-4" />
                            Flag Content
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
