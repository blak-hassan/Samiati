"use client";

import React, { useState } from 'react';
import { ValidationItem, Screen } from '@/types';
import {

    ShieldAlert,
    MessageSquare,
    CheckCircle,
    Flag,
    ChevronDown,
    ThumbsUp,
    ThumbsDown,
    Clock,
    BookOpen,
    Languages,
    Quote,
    Music,
    FileText,
    User
} from 'lucide-react';

interface Props {
    item: ValidationItem;
    currentUserId: string;
    isUserModerator: boolean;
    onApprove: (id: string) => void;
    onCritique: (id: string) => void;
    onReport: (id: string) => void;
    onViewProfile: (handle: string) => void;
    onNavigate: (screen: Screen) => void;
    onVote: (id: string, direction: 'up' | 'down' | null) => void;
}

export const ValidationCard: React.FC<Props> = ({
    item,
    currentUserId,
    isUserModerator,
    onApprove,
    onCritique,
    onReport,
    onViewProfile,
    onNavigate,
    onVote
}) => {

    const [showHistory, setShowHistory] = useState(false);
    const isAuthor = item.author.id === currentUserId;

    const localVote = item.sentiment.userVote || null;
    const localVotes = {
        up: item.sentiment.upvotes,
        down: item.sentiment.downvotes,
    };

    const handleVote = (direction: 'up' | 'down') => {
        if (isAuthor) return;
        onVote(item.id, localVote === direction ? null : direction);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Story': return <BookOpen className="size-4" />;
            case 'Word': return <Languages className="size-4" />;
            case 'Proverb': return <Quote className="size-4" />;
            case 'Song': return <Music className="size-4" />;
            default: return <FileText className="size-4" />;
        }
    };

    const statusColors = {
        pending: 'text-rasta-gold bg-rasta-gold/10',
        approved: 'text-rasta-green bg-rasta-green/10',
        needs_revision: 'text-rasta-red bg-rasta-red/10',
        rejected: 'text-rasta-red bg-rasta-red/10',
    };

    return (
        <div className={`bg-white dark:bg-[#32241a] rounded-2xl p-5 shadow-sm space-y-4 border border-black/5 dark:border-white/5 transition-all overflow-hidden ${isAuthor ? 'ring-1 ring-primary/20 bg-primary/5' : ''}`}>
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-stone-600 dark:text-sand-beige">
                        {getTypeIcon(item.type)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-primary">
                                {item.type}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-stone-500 dark:text-text-muted">
                                {item.language}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-sm font-bold text-stone-900 dark:text-white">
                                {item.content.original.length > 30 ? item.content.original.substring(0, 30) + '...' : item.content.original}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${statusColors[item.status]}`}>
                        {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400 dark:text-text-muted/60 flex items-center gap-1">
                        <Clock className="size-3" />
                        {item.timestamp}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
                <div className="p-4 bg-black/5 dark:bg-black/20 rounded-xl relative group">
                    <p className="text-base font-medium text-stone-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                        {item.content.original}
                    </p>
                    {item.content.translation && (
                        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                            <p className="text-sm text-stone-600 dark:text-sand-beige italic">
                                {item.content.translation}
                            </p>
                        </div>
                    )}
                    {item.content.meaning && (
                        <p className="mt-2 text-xs text-stone-500 dark:text-text-muted">
                            <span className="font-bold">Meaning: </span>{item.content.meaning}
                        </p>
                    )}
                </div>

                {/* Sentiment & Author */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            disabled={isAuthor}
                            onClick={() => handleVote('up')}
                            className={`flex items-center gap-1.5 transition-colors ${localVote === 'up' ? 'text-primary' : 'text-stone-400 dark:text-text-muted hover:text-primary'} ${isAuthor ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ThumbsUp className={`size-4 ${localVote === 'up' ? 'fill-current' : ''}`} />
                            <span className={`text-xs font-bold ${localVote === 'up' ? 'text-primary' : 'text-stone-600 dark:text-text-muted'}`}>
                                {localVotes.up}
                            </span>
                        </button>

                        <button
                            disabled={isAuthor}
                            onClick={() => handleVote('down')}
                            className={`flex items-center gap-1.5 transition-colors ${localVote === 'down' ? 'text-rasta-red' : 'text-stone-400 dark:text-text-muted hover:text-rasta-red'} ${isAuthor ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ThumbsDown className={`size-4 ${localVote === 'down' ? 'fill-current' : ''}`} />
                            <span className={`text-xs font-bold ${localVote === 'down' ? 'text-rasta-red' : 'text-stone-600 dark:text-text-muted'}`}>
                                {localVotes.down}
                            </span>
                        </button>

                        <div className="flex items-center gap-1.5 px-2 py-1 bg-rasta-green/10 rounded-lg">
                            <CheckCircle className="size-3 text-rasta-green" />
                            <span className="text-xs font-black text-rasta-green">
                                {item.reviews.filter(r => r.action === 'approved').length}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => onViewProfile(item.author.handle)}
                        className="flex items-center gap-2 group"
                    >
                        <div className="text-right">
                            <p className="text-xs font-black text-stone-900 dark:text-white group-hover:text-primary transition-colors">
                                {isAuthor ? 'You' : item.author.name}
                            </p>
                            <p className="text-[10px] font-bold text-stone-500 dark:text-text-muted/60">
                                {isAuthor ? 'Your post' : item.author.handle}
                            </p>
                        </div>
                        <img
                            src={item.author.avatar}
                            alt={item.author.name}
                            className="size-8 rounded-full border border-black/5 dark:border-white/10"
                        />
                    </button>
                </div>
            </div>



            {/* Review History / Avatars */}
            <div className="pt-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {item.reviews.length > 0 ? (
                                item.reviews.slice(0, 3).map((review, i) => (
                                    <img
                                        key={i}
                                        src={review.moderator.avatar}
                                        alt={review.moderator.name}
                                        className="size-6 rounded-full border-2 border-white dark:border-[#32241a] shadow-sm hover:z-10 transition-transform hover:scale-110 cursor-pointer"
                                        title={review.moderator.name}
                                    />
                                ))
                            ) : (
                                <div className="size-6 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center border-2 border-white dark:border-[#32241a]">
                                    <User className="size-3 text-stone-400" />
                                </div>
                            )}
                            {item.reviews.length > 3 && (
                                <div className="size-6 rounded-full bg-stone-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-stone-500 dark:text-text-muted border-2 border-white dark:border-[#32241a]">
                                    +{item.reviews.length - 3}
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-stone-500 dark:text-text-muted/60">
                            {item.reviews.length > 0 ? `${item.reviews.length} reviews so far` : 'Waiting for review'}
                        </p>
                    </div>

                    <button
                        disabled={item.reviews.length === 0}
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-[10px] font-black text-primary hover:underline disabled:opacity-30 flex items-center gap-1"
                    >
                        {showHistory ? 'Hide History' : 'View History'}
                        <ChevronDown className={`size-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showHistory && item.reviews.length > 0 && (
                    <div className="mt-3 space-y-2 pt-3 border-t border-black/5 dark:border-white/5 animate-in fade-in duration-300">
                        {item.reviews.map((review, i) => (
                            <div key={i} className="flex gap-3">
                                <img src={review.moderator.avatar} alt={review.moderator.name} className="size-8 rounded-full h-fit mt-1" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-xs font-black text-stone-900 dark:text-white">{review.moderator.name}</p>
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${review.action === 'approved' ? 'text-rasta-green bg-rasta-green/10' :
                                            review.action === 'critiqued' ? 'text-rasta-gold bg-rasta-gold/10' : 'text-rasta-red bg-rasta-red/10'
                                            }`}>
                                            {review.action}
                                        </span>
                                    </div>
                                    {review.comment && (
                                        <p className="text-[11px] text-stone-600 dark:text-text-muted leading-relaxed italic bg-black/5 dark:bg-black/20 p-2 rounded-lg">
                                            &quot;{review.comment}&quot;
                                        </p>
                                    )}
                                    <p className="text-[8px] text-stone-400 dark:text-text-muted/40 mt-1">
                                        {new Date(review.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                {isAuthor ? (
                    <div className="flex flex-1 items-center justify-center p-2 bg-black/5 dark:bg-white/5 rounded-xl border border-dashed border-stone-200 dark:border-white/10">
                        <p className="text-[10px] font-bold text-stone-400 dark:text-text-muted uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert className="size-3" />
                            Progress View Only (Author)
                        </p>
                    </div>
                ) : (
                    <>
                        {item.reviews.some(r => r.moderator.id === currentUserId) ? (
                            <div className="flex-1 flex items-center justify-center p-2 bg-black/5 dark:bg-white/5 rounded-xl border border-stone-200 dark:border-white/10">
                                <p className="text-[10px] font-bold text-stone-500 dark:text-text-muted uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle className="size-3" />
                                    You have reviewed this
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2 flex-1">
                                    <button
                                        disabled={!isUserModerator}
                                        onClick={() => onApprove(item.id)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rasta-green text-white font-black text-xs shadow-lg shadow-rasta-green/20 active:scale-95 transition-all hover:bg-rasta-green/90 disabled:opacity-50 disabled:grayscale"
                                    >
                                        <CheckCircle className="size-4" />
                                        Approve
                                    </button>
                                    <button
                                        disabled={!isUserModerator}
                                        onClick={() => onCritique(item.id)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rasta-gold text-stone-900 font-black text-xs shadow-lg shadow-rasta-gold/20 active:scale-95 transition-all hover:bg-rasta-gold/90 disabled:opacity-50 disabled:grayscale"
                                    >
                                        <MessageSquare className="size-4" />
                                        Critique
                                    </button>
                                </div>
                                <button
                                    disabled={!isUserModerator}
                                    onClick={() => onReport(item.id)}
                                    className="ml-2 p-2.5 rounded-xl bg-rasta-red/10 text-rasta-red hover:bg-rasta-red/20 transition-colors disabled:opacity-30 disabled:grayscale"
                                    title="Report/Reject Quality"
                                >
                                    <Flag className="size-4" />
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
