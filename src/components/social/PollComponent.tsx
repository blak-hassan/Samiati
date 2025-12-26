
import React, { useState } from 'react';
import { Post } from '@/types';
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface PollComponentProps {
    poll: Post['poll'];
}

export const PollComponent: React.FC<PollComponentProps> = ({ poll }) => {
    if (!poll) return null;
    const [localPoll, setLocalPoll] = useState(poll);

    const handleVote = (optionId: string) => {
        if (localPoll.userVotedOptionId) return; // Already voted

        setLocalPoll(prev => ({
            ...prev,
            totalVotes: prev.totalVotes + 1,
            userVotedOptionId: optionId,
            options: prev.options.map(opt =>
                opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            )
        }));
    };

    return (
        <div className="mt-3 flex flex-col gap-2">
            {localPoll.options.map(option => {
                const percentage = localPoll.totalVotes > 0
                    ? Math.round((option.votes / localPoll.totalVotes) * 100)
                    : 0;
                const isWinner = localPoll.userVotedOptionId && Math.max(...localPoll.options.map(o => o.votes)) === option.votes;
                const isSelected = localPoll.userVotedOptionId === option.id;

                return (
                    <div
                        key={option.id}
                        onClick={(e) => { e.stopPropagation(); handleVote(option.id); }}
                        className={`relative h-9 rounded-md overflow-hidden cursor-pointer group ${!localPoll.userVotedOptionId ? 'hover:bg-stone-100 dark:hover:bg-white/5' : ''}`}
                    >
                        {/* Progress Bar Background */}
                        {localPoll.userVotedOptionId && (
                            <div
                                className={`absolute inset-y-0 left-0 transition-all duration-500 ${isSelected ? 'bg-primary/20' : 'bg-stone-200 dark:bg-white/10'}`}
                                style={{ width: `${percentage}%` }}
                            />
                        )}

                        {/* Text Content */}
                        <div className="absolute inset-0 flex items-center justify-between px-3">
                            <span className={cn(
                                "text-sm font-medium z-10 flex items-center gap-2",
                                isSelected ? 'text-primary' : 'text-stone-900 dark:text-white'
                            )}>
                                {localPoll.userVotedOptionId && isSelected && <CheckCircle2 className="w-4 h-4" />}
                                {option.label}
                            </span>
                            {localPoll.userVotedOptionId && (
                                <span className="text-sm font-bold text-stone-600 dark:text-stone-400 z-10">{percentage}%</span>
                            )}
                        </div>
                    </div>
                );
            })}
            <div className="text-xs text-stone-500 dark:text-text-muted mt-1">
                {localPoll.totalVotes} votes • {localPoll.endsAt}
            </div>
        </div>
    );
};
