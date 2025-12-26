import React from 'react';
import { cn } from '@/lib/utils';

interface CulturalImpactCardProps {
    wordsPreserved: number;
    storiesShared: number;
    communityReach: number;
    heritagePoints: number;
    className?: string;
}

export const CulturalImpactCard: React.FC<CulturalImpactCardProps> = ({
    wordsPreserved,
    storiesShared,
    communityReach,
    heritagePoints,
    className
}) => {
    return (
        <div className={cn(
            "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-xl border border-primary/20 rounded-2xl p-6 shadow-xl shadow-primary/5",
            className
        )}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl fill-active">auto_awesome</span>
                    Your Cultural Impact
                </h3>
                <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
                    {heritagePoints} Points
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <StatItem
                    icon={<span className="material-symbols-outlined text-lg">translate</span>}
                    value={wordsPreserved}
                    label="Words"
                    color="text-amber-500"
                />
                <StatItem
                    icon={<span className="material-symbols-outlined text-lg">menu_book</span>}
                    value={storiesShared}
                    label="Stories"
                    color="text-rose-500"
                />
                <StatItem
                    icon={<span className="material-symbols-outlined text-lg">public</span>}
                    value={communityReach}
                    label="Reach"
                    color="text-primary"
                />
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center italic">
                "Every word you save is a gift to future generations"
            </p>
        </div>
    );
};

interface StatItemProps {
    icon: React.ReactNode;
    value: number;
    label: string;
    color: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label, color }) => {
    return (
        <div className="flex flex-col items-center text-center">
            <div className={cn("mb-1", color)}>
                {icon}
            </div>
            <div className="text-2xl font-black text-foreground">{value}</div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</div>
        </div>
    );
};
