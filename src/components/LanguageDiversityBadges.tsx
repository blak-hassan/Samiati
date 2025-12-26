import React from 'react';
import { cn } from '@/lib/utils';

interface LanguageDiversityBadgesProps {
    languages: Array<{
        name: string;
        code: string;
        contributionCount: number;
    }>;
    className?: string;
}

export const LanguageDiversityBadges: React.FC<LanguageDiversityBadgesProps> = ({
    languages,
    className
}) => {
    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">language</span>
                    Language Diversity
                </h4>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                    {languages.length} {languages.length === 1 ? 'Language' : 'Languages'}
                </span>
            </div>

            <div className="flex flex-wrap gap-2">
                {languages.map((lang, idx) => (
                    <LanguageBadge
                        key={lang.code}
                        language={lang}
                        index={idx}
                    />
                ))}
            </div>

            {languages.length >= 3 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">emoji_events</span>
                    <p className="text-xs font-bold text-primary">
                        Cultural Guardian Badge Unlocked! 🎉
                    </p>
                </div>
            )}
        </div>
    );
};

interface LanguageBadgeProps {
    language: {
        name: string;
        code: string;
        contributionCount: number;
    };
    index: number;
}

const LanguageBadge: React.FC<LanguageBadgeProps> = ({ language, index }) => {
    const colors = [
        'from-red-500/20 to-red-600/20 border-red-500/30 text-red-700 dark:text-red-400', // Rasta Red
        'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-700 dark:text-yellow-400', // Rasta Gold
        'from-green-500/20 to-green-600/20 border-green-500/30 text-green-700 dark:text-green-400', // Rasta Green
        'from-red-600/20 to-red-700/20 border-red-600/30 text-red-800 dark:text-red-500', // Rasta Red (darker)
        'from-yellow-600/20 to-yellow-700/20 border-yellow-600/30 text-yellow-800 dark:text-yellow-500', // Rasta Gold (darker)
    ];

    const colorClass = colors[index % colors.length];

    return (
        <div
            className={cn(
                "bg-gradient-to-r backdrop-blur-sm border rounded-lg px-3 py-2 flex items-center gap-2 animate-in fade-in zoom-in duration-300",
                colorClass
            )}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <span className="material-symbols-outlined text-sm fill-active">star</span>
            <div>
                <div className="text-xs font-black leading-tight">{language.name}</div>
                <div className="text-[10px] font-bold opacity-70">{language.contributionCount} contributions</div>
            </div>
        </div>
    );
};
