import React from 'react';
import { cn } from '@/lib/utils';

interface ContributionStreakBadgeProps {
    streakDays: number;
    nextMilestone: number;
    className?: string;
}

export const ContributionStreakBadge: React.FC<ContributionStreakBadgeProps> = ({
    streakDays,
    nextMilestone,
    className
}) => {
    const progress = (streakDays / nextMilestone) * 100;

    return (
        <div className={cn(
            "bg-gradient-to-r from-orange-500/20 to-amber-500/20 backdrop-blur-xl border border-orange-500/30 rounded-xl px-4 py-3 shadow-lg",
            className
        )}>
            <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                    <span className="material-symbols-outlined text-orange-500 animate-pulse text-2xl fill-active">local_fire_department</span>
                    {streakDays >= 7 && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5">
                            <span className="material-symbols-outlined text-[10px] text-white font-bold">bolt</span>
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-lg font-black text-foreground">{streakDays}</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Day Streak</span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-xs font-bold text-muted-foreground">Next</div>
                    <div className="text-sm font-black text-orange-500">{nextMilestone}</div>
                </div>
            </div>

            {streakDays >= 7 && (
                <p className="text-[10px] text-center text-orange-600 dark:text-orange-400 font-bold mt-2 uppercase tracking-wide">
                    🔥 Keep the culture alive!
                </p>
            )}
        </div>
    );
};
