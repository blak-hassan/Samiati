import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ContributionStreakBadgeProps {
    streakDays: number;
    nextMilestone: number;
    className?: string;
}

interface DayData {
    day: number;
    level: number; // 0-3
    count: number;
    date: string;
    isEmpty: boolean;
}

export const ContributionStreakBadge: React.FC<ContributionStreakBadgeProps> = ({
    streakDays,
    nextMilestone,
    className
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const progress = (streakDays / nextMilestone) * 100;

    const calendarData = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        const monthName = now.toLocaleString('default', { month: 'long' });
        const days: DayData[] = [];

        // Padding for the first week
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push({ day: 0, level: 0, count: 0, date: '', isEmpty: true });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            // Mock logic for demonstration, similar to ProfileScreen
            const seed = (i * 7 + streakDays * 3) % 100;
            let level = 0;
            let count = 0;

            if (seed > 30) {
                if (seed > 85) { level = 3; count = Math.floor(seed / 10); }
                else if (seed > 60) { level = 2; count = Math.floor(seed / 15); }
                else { level = 1; count = 1; }
            }

            // Current day always has some contribution for the streak
            if (i === now.getDate()) {
                level = 2;
                count = 3;
            }

            days.push({
                day: i,
                level,
                count,
                date: new Date(year, month, i).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                isEmpty: false
            });
        }

        return { monthName, year, days };
    }, [streakDays]);

    const getLevelColor = (level: number) => {
        switch (level) {
            case 0: return 'bg-stone-200 dark:bg-stone-800 opacity-30';
            case 1: return 'bg-primary/20 text-primary-foreground dark:text-primary';
            case 2: return 'bg-primary/60 text-white';
            case 3: return 'bg-primary text-white';
            default: return 'bg-stone-200';
        }
    };

    return (
        <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
                "bg-gradient-to-r from-orange-500/20 to-amber-500/20 backdrop-blur-xl border border-orange-500/30 rounded-xl px-4 py-3 shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                isExpanded && "from-stone-800/20 to-stone-700/20 border-stone-500/50 dark:from-stone-900/40 dark:to-stone-800/40",
                className
            )}
        >
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
                        <span className={cn(
                            "material-symbols-outlined text-sm transition-transform duration-300 ml-auto",
                            isExpanded ? "rotate-180 text-primary" : "text-orange-500"
                        )}>
                            expand_more
                        </span>
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

            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-stone-500/20 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-black text-stone-600 dark:text-sand-beige uppercase tracking-widest">
                            {calendarData.monthName} Activity
                        </p>
                        <div className="flex gap-1">
                            {[0, 1, 2, 3].map(lvl => (
                                <div key={lvl} className={cn("w-2 h-2 rounded-sm", getLevelColor(lvl))} />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-center text-[8px] font-black text-muted-foreground/50">{d}</div>
                        ))}
                        {calendarData.days.map((day, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-4 rounded-[2px] transition-all flex items-center justify-center text-[6px] font-bold",
                                    day.isEmpty ? "invisible" : getLevelColor(day.level)
                                )}
                                title={!day.isEmpty ? `${day.count} Changa on ${day.date}` : ''}
                            >
                                {!day.isEmpty && day.day}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {streakDays >= 7 && (
                <p className="text-[10px] text-center text-orange-600 dark:text-orange-400 font-bold mt-2 uppercase tracking-wide">
                    🔥 Keep the fire burning
                </p>
            )}
        </div>
    );
};
