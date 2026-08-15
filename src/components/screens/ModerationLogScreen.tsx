"use client";

import React, { useState } from 'react';
import { Screen } from '@/types';
import {
    FileText,
    Filter,
    Download,
    ArrowLeft,
    ChevronDown,
    StickyNote,
    SearchX
} from 'lucide-react';

interface Props {
    navigate: (screen: Screen) => void;
    goBack: () => void;
}

interface ModerationAction {
    id: string;
    action: string;
    moderator: {
        name: string;
        handle: string;
        avatar: string;
    };
    report: {
        type: 'comment' | 'link' | 'post';
        content: string;
        contextTitle: string;
    };
    timestamp: number;
    notes?: string;
}

export const ModerationLogContent: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded = false }) => {
  const [actions] = useState<ModerationAction[]>([]);
  const [filterAction, setFilterAction] = useState<string>('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [referenceTime] = useState(() => Date.now());

    const filteredActions = actions.filter(action =>
        filterAction === 'All' || action.action === filterAction
    );

    const getActionColor = (action: string) => {
        switch (action) {
            case 'Delete': return 'text-error';
            case 'Warn User': return 'text-warning';
            case 'Hide': return 'text-orange-500';
            case 'Approve': return 'text-success';
            default: return 'text-stone-600 dark:text-text-muted';
        }
    };

    const getActionBgColor = (action: string) => {
        switch (action) {
            case 'Delete': return 'bg-error/10';
            case 'Warn User': return 'bg-warning/10';
            case 'Hide': return 'bg-orange-500/10';
            case 'Approve': return 'bg-success/10';
            default: return 'bg-stone-100 dark:bg-white/5';
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const diff = referenceTime - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className={`flex flex-col ${!isEmbedded ? 'min-h-screen bg-background-light dark:bg-background-dark' : 'h-full'} transition-colors duration-300`}>


            {/* Filter Bar */}
            <div className="px-4 py-3 flex gap-2 items-center border-b border-black/5 dark:border-white/5">
                <div className="relative flex-1">
                    <button
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-black/5 dark:bg-[#473324] text-stone-900 dark:text-white hover:bg-black/10 dark:hover:bg-[#5a4230] transition-colors w-full"
                    >
                        <Filter className="w-4 h-4" />
                        <span className="flex-1 text-left">{filterAction === 'All' ? 'All Actions' : filterAction}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilterMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showFilterMenu && (
                        <>
                            <div className="fixed inset-0 z-20" onClick={() => setShowFilterMenu(false)}></div>
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#32241a] shadow-xl rounded-xl z-30 border border-stone-200 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                {['All', 'Delete', 'Hide', 'Approve', 'Warn User'].map(action => (
                                    <button
                                        key={action}
                                        onClick={() => { setFilterAction(action); setShowFilterMenu(false); }}
                                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${filterAction === action
                                            ? 'bg-primary text-white font-bold'
                                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-stone-800 dark:text-white'
                                            }`}
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>


            </div>

            {/* Actions List */}
            <main className="flex-1 p-4 space-y-3 pb-24">
                {filteredActions.length > 0 ? (
                    filteredActions.map((action) => (
                        <div
                            key={action.id}
                            className="bg-white dark:bg-[#32241a] rounded-xl p-4 shadow-sm space-y-3 transition-colors animate-in fade-in slide-in-from-bottom-2"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1">
                                    <img
                                        src={action.moderator.avatar}
                                        alt={action.moderator.name}
                                        className="w-10 h-10 rounded-full"
                                     loading="lazy" decoding="async" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-stone-900 dark:text-white truncate">
                                            {action.moderator.name}
                                        </p>
                                        <p className="text-xs text-stone-500 dark:text-text-muted">
                                            {action.moderator.handle}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${getActionBgColor(action.action)} ${getActionColor(action.action)}`}>
                                        {action.action}
                                    </span>
                                    <p className="text-xs text-stone-400 dark:text-text-muted/60 mt-1">
                                        {formatTimestamp(action.timestamp)}
                                    </p>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="bg-stone-50 dark:bg-black/20 rounded-lg p-3">
                                <p className="text-xs text-stone-500 dark:text-text-muted font-bold mb-1">
                                    {action.report.type.toUpperCase()} • {action.report.contextTitle}
                                </p>
                                <p className="text-sm text-stone-700 dark:text-text-muted break-words">
                                    {action.report.content}
                                </p>
                            </div>

                            {/* Notes */}
                            {action.notes && (
                                <div className="flex items-start gap-2 text-xs text-stone-600 dark:text-text-muted">
                                    <StickyNote className="w-4 h-4 mt-0.5" />
                                    <p className="flex-1">{action.notes}</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-stone-200 dark:border-white/10 rounded-xl mt-4">
                        <SearchX className="w-16 h-16 text-stone-300 dark:text-white/10 mb-4" />
                        <h3 className="text-lg font-bold text-stone-900 dark:text-white">No actions found</h3>
                        <p className="text-stone-600 dark:text-text-muted text-center">
                            No moderation actions match the selected filter
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

const ModerationLogScreen: React.FC<Props> = ({ navigate, goBack }) => {
    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
            <header className="flex items-center p-4 sticky top-0 bg-background-light dark:bg-background-dark z-10 border-b border-black/5 dark:border-transparent">
                <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="flex-1 text-center text-lg font-bold text-stone-900 dark:text-white pr-8">
                    Moderation History
                </h1>
            </header>
            <ModerationLogContent />
        </div>
    );
};

export default ModerationLogScreen;
