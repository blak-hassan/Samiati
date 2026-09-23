
import React from 'react';
import { Screen, User } from '@/types';
import { useChangaQuery as useQuery } from "@/hooks/useChangaData";
import { useAppUser } from '@/hooks/useAppUser';
import { isDemoMode } from '@/lib/appMode';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

interface Props {
    navigate: (screen: Screen, params?: Record<string, unknown>) => void;
    goBack: () => void;
    onViewProfile: (user: User) => void;
    challengeId?: string;
}

interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    avatar: string;
    submissionCount: number;
}

// Static sample used in demo mode (no Convex backend). Demonstrates the
// intended UX without depending on a live query.
const DEMO_RESULT = {
    campaign: {
        _id: 'demo' as Id<"changaCampaigns">,
        title: 'Kikuyu Folklore: Trickster Tales',
        description: 'A community-driven archive of Kikuyu oral traditions.',
        languageCode: 'ki',
        goalCount: 100,
        currentCount: 84,
        status: 'completed' as const,
        startAt: Date.now() - 60 * 86400000,
        endAt: Date.now() - 30 * 86400000,
        taskTypes: ['cultural_context' as const],
    },
    leaderboard: [
        { rank: 1, userId: 'demo-u1', name: 'Amina Diallo', avatar: '', submissionCount: 28 },
        { rank: 2, userId: 'demo-u2', name: 'Chike Okoro', avatar: '', submissionCount: 22 },
        { rank: 3, userId: 'demo-u3', name: 'Fatou Sow', avatar: '', submissionCount: 18 },
        { rank: 4, userId: 'demo-u4', name: 'Kwame Asante', avatar: '', submissionCount: 14 },
        { rank: 5, userId: 'demo-u5', name: 'Zahra Hassan', avatar: '', submissionCount: 11 },
    ] as LeaderboardEntry[],
};

const formatEndedDate = (timestamp?: number) => {
    if (!timestamp) return 'Date unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const initialsOf = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
};

const ChallengeWinnersScreen: React.FC<Props> = ({ navigate, goBack, onViewProfile, challengeId }) => {
    const { user: currentUser } = useAppUser();
    const liveData = useQuery(
        api.changa.campaigns.getCampaignWithLeaderboard,
        challengeId && !isDemoMode && challengeId !== 'demo'
            ? { campaignId: challengeId as Id<"changaCampaigns"> }
            : "skip"
    );

    // Demo mode has no live backend, so always fall back to the static sample.
    const data = isDemoMode || challengeId === 'demo' ? DEMO_RESULT : (liveData as typeof DEMO_RESULT | null | undefined);

    // Loading state
    if (data === undefined && challengeId) {
        return (
            <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-stone-900 dark:text-white transition-colors duration-300">
                <header className="flex items-center p-4 sticky top-0 bg-background-light dark:bg-background-dark z-20 transition-colors border-b border-black/5 dark:border-white/5">
                    <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="flex-1 text-center text-lg font-bold pr-8">Challenge Results</h1>
                </header>
                <main className="flex-1 p-4 space-y-4">
                    <div className="h-20 w-20 mx-auto rounded-xl bg-stone-200 dark:bg-white/10 skeleton-shimmer" />
                    <div className="h-6 w-48 mx-auto bg-stone-200 dark:bg-white/10 rounded skeleton-shimmer" />
                    <div className="h-4 w-32 mx-auto bg-stone-100 dark:bg-white/5 rounded skeleton-shimmer" />
                    <div className="h-40 bg-stone-100 dark:bg-white/5 rounded-2xl skeleton-shimmer" />
                </main>
            </div>
        );
    }

    // Empty / not-found state
    if (!data) {
        return (
            <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-stone-900 dark:text-white transition-colors duration-300">
                <header className="flex items-center p-4 sticky top-0 bg-background-light dark:bg-background-dark z-20 transition-colors border-b border-black/5 dark:border-white/5">
                    <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="flex-1 text-center text-lg font-bold pr-8">Challenge Results</h1>
                </header>
                <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <span className="material-symbols-outlined text-6xl text-stone-300 dark:text-white/20 mb-4">search_off</span>
                    <h2 className="text-xl font-bold mb-2">Challenge Not Found</h2>
                    <p className="text-sm text-stone-500 dark:text-text-muted mb-6 max-w-xs">
                        This challenge may have been removed or the link is no longer valid.
                    </p>
                    <button
                        onClick={goBack}
                        className="bg-[#cf6317] hover:bg-[#b05210] text-white font-bold py-3 px-6 rounded-xl shadow-lg active:scale-[0.98] transition-all"
                    >
                        Go Back
                    </button>
                </main>
            </div>
        );
    }

    const { campaign, leaderboard } = data;
    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);
    const first = top3[0];
    const second = top3[1];
    const third = top3[2];

    const myEntry = leaderboard.find(
        (e: LeaderboardEntry) => e.userId === (currentUser as { id?: string } | null)?.id
    );

    const renderAvatar = (entry: LeaderboardEntry | undefined, size: 'sm' | 'md' | 'lg', ringColor?: string) => {
        if (!entry) {
            return (
                <div className={`${size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'} rounded-full bg-stone-200 dark:bg-white/10 flex items-center justify-center text-stone-400 font-bold`}>
                    ?
                </div>
            );
        }
        const sizeClass = size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
        const ringClass = ringColor ?? 'border-stone-300';
        if (entry.avatar) {
            return (
                <img
                    src={entry.avatar}
                    alt={entry.name}
                    onClick={() => onViewProfile({ name: entry.name, avatar: entry.avatar, isGuest: false })}
                    className={`${sizeClass} rounded-full border-2 ${ringClass} object-cover cursor-pointer`}
                    loading="lazy"
                    decoding="async"
                />
            );
        }
        return (
            <div
                onClick={() => onViewProfile({ name: entry.name, avatar: '', isGuest: false })}
                className={`${sizeClass} rounded-full border-2 ${ringClass} bg-[#cf6317] text-white flex items-center justify-center font-bold cursor-pointer`}
            >
                {initialsOf(entry.name).toUpperCase()}
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-stone-900 dark:text-white transition-colors duration-300">
            <header className="flex items-center p-4 sticky top-0 bg-background-light dark:bg-background-dark z-20 transition-colors border-b border-black/5 dark:border-white/5">
                <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="flex-1 text-center text-lg font-bold pr-8">Challenge Results</h1>
            </header>

            <main className="flex-1 p-4 pb-24 space-y-6">
                {/* Header Info */}
                <div className="text-center space-y-2">
                    <div className="w-20 h-20 mx-auto rounded-xl bg-gradient-to-br from-[#cf6317] to-amber-500 flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-white text-4xl">emoji_events</span>
                    </div>
                    <h2 className="text-2xl font-bold">{campaign.title}</h2>
                    <p className="text-stone-500 dark:text-text-muted">
                        {campaign.taskTypes?.[0]?.replace(/_/g, ' ') ?? 'Challenge'} • Ended {formatEndedDate(campaign.endAt)}
                    </p>
                    <div className="inline-block px-3 py-1 bg-stone-200 dark:bg-white/10 rounded-full text-xs font-bold text-stone-600 dark:text-text-muted uppercase tracking-wide">
                        Completed
                    </div>
                </div>

                {/* Podium */}
                {top3.length > 0 ? (
                    <div className="flex justify-center items-end gap-4 py-6 relative">
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center gap-2">
                            {renderAvatar(second, 'sm', 'border-stone-300')}
                            <div className="flex flex-col items-center">
                                <p className="text-xs font-bold text-stone-600 dark:text-text-muted line-clamp-1 max-w-[64px]">{second?.name ?? '—'}</p>
                                <div className="w-16 h-24 bg-gradient-to-t from-stone-400 to-stone-300 rounded-t-lg flex items-center justify-center text-white font-bold text-xl shadow-lg relative">
                                    2
                                </div>
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center gap-2 -mb-2 z-10">
                            <div className="relative">
                                <span className="material-symbols-outlined text-yellow-400 text-3xl absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-sm">crown</span>
                                {renderAvatar(first, 'lg', 'border-yellow-400')}
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-sm font-bold text-primary dark:text-white line-clamp-1 max-w-[80px]">{first?.name ?? '—'}</p>
                                <div className="w-20 h-32 bg-gradient-to-t from-rasta-gold to-amber-400 rounded-t-lg flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                                    1
                                </div>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center gap-2">
                            {renderAvatar(third, 'sm', 'border-amber-700')}
                            <div className="flex flex-col items-center">
                                <p className="text-xs font-bold text-stone-600 dark:text-text-muted line-clamp-1 max-w-[64px]">{third?.name ?? '—'}</p>
                                <div className="w-16 h-16 bg-gradient-to-t from-orange-700 to-amber-600 rounded-t-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    3
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-stone-50 dark:bg-white/5 rounded-2xl p-8 text-center">
                        <span className="material-symbols-outlined text-5xl text-stone-300 dark:text-white/20">trophy</span>
                        <p className="text-stone-500 dark:text-text-muted mt-2">No winners yet — this challenge had no validated submissions.</p>
                    </div>
                )}

                {/* My Result */}
                {myEntry ? (
                    <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-primary">Your Result</p>
                            <p className="text-stone-900 dark:text-white">
                                You ranked <span className="font-bold text-[#cf6317]">#{myEntry.rank}</span> with {myEntry.submissionCount} contribution{myEntry.submissionCount === 1 ? '' : 's'}!
                            </p>
                        </div>
                        <span className="material-symbols-outlined text-3xl text-primary">emoji_events</span>
                    </div>
                ) : (
                    <div className="bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/5 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-stone-600 dark:text-text-muted">Your Result</p>
                            <p className="text-stone-700 dark:text-stone-300 text-sm">You didn&apos;t participate in this challenge.</p>
                        </div>
                        <span className="material-symbols-outlined text-3xl text-stone-300 dark:text-white/20">sentiment_dissatisfied</span>
                    </div>
                )}

                {/* Winner List */}
                {rest.length > 0 && (
                    <div>
                        <h3 className="font-bold text-lg mb-3">Top Stories</h3>
                        <div className="space-y-3">
                            {rest.map((entry) => (
                                <div
                                    key={entry.userId}
                                    className="bg-white dark:bg-surface-dark border border-stone-200 dark:border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors active:scale-[0.98]"
                                >
                                    <span className={`w-8 font-bold text-center text-lg ${entry.rank <= 3 ? 'text-primary' : 'text-stone-400'}`}>#{entry.rank}</span>
                                    <div
                                        className="w-10 h-10 rounded-full bg-[#cf6317] text-white flex items-center justify-center font-bold text-sm shrink-0"
                                    >
                                        {initialsOf(entry.name).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-stone-900 dark:text-white truncate">{entry.name}</h4>
                                        <p
                                            className="text-sm text-stone-500 dark:text-text-muted hover:text-primary transition-colors cursor-pointer"
                                            onClick={() => onViewProfile({ name: entry.name, avatar: entry.avatar, isGuest: false })}
                                        >
                                            {entry.userId}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-stone-500 dark:text-text-muted shrink-0">
                                        <span className="material-symbols-outlined text-sm">star</span>
                                        <span className="text-sm font-medium">{entry.submissionCount}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {leaderboard.length > 0 && (
                    <button
                        onClick={() => navigate(Screen.CHALLENGE_DETAILS, { challenge: { id: campaign._id, title: campaign.title, type: 'STANDARD' } })}
                        className="w-full py-4 text-center font-bold text-primary hover:text-primary-hover transition-colors"
                    >
                        View Full Leaderboard
                    </button>
                )}
            </main>
        </div>
    );
};

export default ChallengeWinnersScreen;
