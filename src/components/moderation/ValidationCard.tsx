"use client";

import React, { useState, useEffect } from 'react';
import { ValidationItem } from '@/types';
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

type ViewerRole = 'moderator' | 'contributor';
type CardDensity = 'comfortable' | 'compact';

interface Props {
    item: ValidationItem;
    currentUserId: string;
    isUserModerator: boolean;
    viewer?: ViewerRole;
    density?: CardDensity;
    onApprove?: (id: string) => void;
    onCritique?: (id: string) => void;
    onReport?: (id: string) => void;
    onViewProfile: () => void;
    onVote: (id: string, direction: 'up' | 'down' | null) => void;
    hotkeysEnabled?: boolean;
}

const ReadOnlyActions: React.FC<{ item: ValidationItem; isAuthor: boolean }> = ({ item, isAuthor }) => {
    const latestReview = [...(item.reviews || [])].reverse().find((r) => r.comment?.trim());
    const StatusIcon = (() => {
        switch (item.status) {
            case 'approved':
                return CheckCircle;
            case 'needs_revision':
                return MessageSquare;
            case 'rejected':
                return Flag;
            default:
                return Clock;
        }
    })();
    const statusLabel = (() => {
        switch (item.status) {
            case 'approved':
                return 'Approved';
            case 'needs_revision':
                return 'Needs revision';
            case 'rejected':
                return 'Declined';
            default:
                return 'Under review';
        }
    })();

    return (
        <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-stone-600 dark:text-text-muted">
                <StatusIcon className="size-4" />
                <span className="text-xs font-bold">{statusLabel}</span>
                {isAuthor && (
                    <span className="text-[10px] uppercase tracking-widest font-black text-stone-400 dark:text-text-muted/60 ml-1">
                        · Your submission
                    </span>
                )}
            </div>
            {latestReview?.comment ? (
                <p className="text-[11px] text-stone-600 dark:text-text-muted leading-relaxed italic bg-black/5 dark:bg-black/20 p-2 rounded-lg">
                    &quot;{latestReview.comment}&quot;
                </p>
            ) : (
                <p className="text-[11px] text-stone-400 dark:text-text-muted/60">
                    {item.status === 'pending'
                        ? 'No moderator feedback yet. Hang tight.'
                        : 'No moderator note left on this item.'}
                </p>
            )}
        </div>
    );
};

export const ValidationCard: React.FC<Props> = ({
    item,
    currentUserId,
    isUserModerator,
    viewer = isUserModerator ? 'moderator' : 'contributor',
    density = 'comfortable',
    onApprove,
    onCritique,
    onReport,
    onViewProfile,
    onVote,
    hotkeysEnabled = false,
}) => {
    const [showHistory, setShowHistory] = useState(false);
    const [showDetails, setShowDetails] = useState(density === 'comfortable');
    const [voteAnimating, setVoteAnimating] = useState<'up' | 'down' | null>(null);
    const isAuthor = item.author.id === currentUserId;

    const localVote = item.sentiment.userVote || null;
    const localVotes = {
        up: item.sentiment.upvotes,
        down: item.sentiment.downvotes,
    };

    useEffect(() => {
        if (!hotkeysEnabled || viewer !== 'moderator' || isAuthor) return;
        if (item.reviews.some((r) => r.moderator.id === currentUserId)) return;

        const isEditable = (el: EventTarget | null) => {
            if (!(el instanceof HTMLElement)) return false;
            const tag = el.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
            return el.isContentEditable;
        };

        const handler = (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            if (isEditable(event.target)) return;
            const key = event.key.toLowerCase();
            if (key === 'a' && onApprove) {
                event.preventDefault();
                onApprove(item.id);
            } else if (key === 'c' && onCritique) {
                event.preventDefault();
                onCritique(item.id);
            } else if (key === 'r' && onReport) {
                event.preventDefault();
                onReport(item.id);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [hotkeysEnabled, viewer, isAuthor, currentUserId, item.id, item.reviews, onApprove, onCritique, onReport]);

    const handleVote = (direction: 'up' | 'down') => {
        if (isAuthor) return;
        setVoteAnimating(direction);
        setTimeout(() => setVoteAnimating(null), 300);
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

    const isCompact = density === 'compact';
    const cardPadding = isCompact ? 'p-4' : 'p-5';

    return (
        <div
            data-viewer={viewer}
            data-density={density}
            className={`bg-white dark:bg-[#32241a] rounded-2xl ${cardPadding} shadow-sm space-y-${isCompact ? '3' : '4'} border border-black/5 dark:border-white/5 transition-all overflow-hidden ${isAuthor ? 'ring-1 ring-primary/20 bg-primary/5' : ''}`}
        >
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
                    {viewer === 'moderator' ? (
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${statusColors[item.status]}`}>
                            {item.status.replace('_', ' ')}
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold text-stone-500 dark:text-text-muted/80 flex items-center gap-1">
                            {(() => {
                                switch (item.status) {
                                    case 'approved': return <CheckCircle className="size-3 text-rasta-green" />;
                                    case 'needs_revision': return <MessageSquare className="size-3 text-rasta-gold" />;
                                    case 'rejected': return <Flag className="size-3 text-rasta-red" />;
                                    default: return <Clock className="size-3 text-stone-400" />;
                                }
                            })()}
                            {item.status === 'needs_revision'
                                ? 'Needs revision'
                                : item.status === 'rejected'
                                    ? 'Declined'
                                    : item.status === 'approved'
                                        ? 'Approved'
                                        : 'Under review'}
                        </span>
                    )}
                    <span className="text-[10px] font-bold text-stone-400 dark:text-text-muted/60 flex items-center gap-1">
                        <Clock className="size-3" />
                        {item.timestamp}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
                {isCompact ? (
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-stone-900 dark:text-white leading-relaxed line-clamp-2">
                            {item.content.original}
                        </p>
                        {(item.content.translation || item.content.meaning) && (
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                            >
                                {showDetails ? 'Hide details' : 'Show details'}
                            </button>
                        )}
                    </div>
                ) : (
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
                )}

                {isCompact && showDetails && (item.content.translation || item.content.meaning) && (
                    <div className="p-3 bg-black/5 dark:bg-black/20 rounded-xl space-y-2">
                        {item.content.translation && (
                            <p className="text-xs text-stone-600 dark:text-sand-beige italic">
                                {item.content.translation}
                            </p>
                        )}
                        {item.content.meaning && (
                            <p className="text-[11px] text-stone-500 dark:text-text-muted">
                                <span className="font-bold">Meaning: </span>{item.content.meaning}
                            </p>
                        )}
                    </div>
                )}

                {/* Sentiment & Author */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            disabled={isAuthor}
                            onClick={() => handleVote('up')}
                            className={`flex items-center gap-1.5 transition-colors active:scale-95 ${localVote === 'up' ? 'text-primary' : 'text-stone-400 dark:text-text-muted hover:text-primary'} ${isAuthor ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ThumbsUp className={`size-4 transition-transform ${localVote === 'up' ? 'fill-current' : ''} ${voteAnimating === 'up' ? 'animate-vote-pop' : ''}`} />
                            <span className={`text-xs font-bold ${localVote === 'up' ? 'text-primary' : 'text-stone-600 dark:text-text-muted'}`}>
                                {localVotes.up}
                            </span>
                        </button>

                        <button
                            disabled={isAuthor}
                            onClick={() => handleVote('down')}
                            className={`flex items-center gap-1.5 transition-colors active:scale-95 ${localVote === 'down' ? 'text-rasta-red' : 'text-stone-400 dark:text-text-muted hover:text-rasta-red'} ${isAuthor ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ThumbsDown className={`size-4 transition-transform ${localVote === 'down' ? 'fill-current' : ''} ${voteAnimating === 'down' ? 'animate-vote-pop' : ''}`} />
                            <span className={`text-xs font-bold ${localVote === 'down' ? 'text-rasta-red' : 'text-stone-600 dark:text-text-muted'}`}>
                                {localVotes.down}
                            </span>
                        </button>

                        {viewer === 'moderator' && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-rasta-green/10 rounded-lg">
                                <CheckCircle className="size-3 text-rasta-green" />
                                <span className="text-xs font-black text-rasta-green">
                                    {item.reviews.filter((r) => r.action === 'approved').length}
                                </span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => onViewProfile()}
                        className="flex items-center gap-2 group"
                    >
                        <div className="text-right">
                            <p className="text-xs font-black text-stone-900 dark:text-white group-hover:text-primary transition-colors">
                                {isAuthor ? 'You' : item.author.name}
                            </p>
                            <p className="text-[10px] font-bold text-stone-500 dark:text-text-muted/60">
                                {isAuthor ? 'Your post' : ''}
                            </p>
                        </div>
                        <img
                            src={item.author.avatar}
                            alt={item.author.name}
                            className="size-8 rounded-full border border-black/5 dark:border-white/10"
                         loading="lazy" decoding="async" />
                    </button>
                </div>
            </div>



            {/* Review History / Avatars */}
            {viewer === 'moderator' && (
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
                                         loading="lazy" decoding="async" />
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
                                    <img src={review.moderator.avatar} alt={review.moderator.name} className="size-8 rounded-full h-fit mt-1"  loading="lazy" decoding="async" />
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
            )}

            {/* Action Bar */}
            {viewer === 'contributor' ? (
                <ReadOnlyActions item={item} isAuthor={isAuthor} />
            ) : (
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
                            {item.reviews.some((r) => r.moderator.id === currentUserId) ? (
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
                                            onClick={() => onApprove?.(item.id)}
                                            title="Approve (A)"
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rasta-green text-white font-black text-xs shadow-lg shadow-rasta-green/20 active:scale-95 transition-all duration-200 hover:bg-rasta-green/90 disabled:opacity-50 disabled:grayscale ripple-container"
                                        >
                                            <CheckCircle className="size-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => onCritique?.(item.id)}
                                            title="Critique (C)"
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rasta-gold text-stone-900 font-black text-xs shadow-lg shadow-rasta-gold/20 active:scale-95 transition-all duration-200 hover:bg-rasta-gold/90 disabled:opacity-50 disabled:grayscale ripple-container"
                                        >
                                            <MessageSquare className="size-4" />
                                            Critique
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => onReport?.(item.id)}
                                        title="Report / Reject (R)"
                                        className="ml-2 p-2.5 rounded-xl bg-rasta-red/10 text-rasta-red hover:bg-rasta-red/20 transition-colors disabled:opacity-30 disabled:grayscale"
                                    >
                                        <Flag className="size-4" />
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
