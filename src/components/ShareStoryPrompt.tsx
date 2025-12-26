import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface ShareStoryPromptProps {
    onShareClick: () => void;
    promptOfTheDay?: string;
    className?: string;
}

export const ShareStoryPrompt: React.FC<ShareStoryPromptProps> = ({
    onShareClick,
    promptOfTheDay = "What word did your grandmother teach you?",
    className
}) => {
    return (
        <div className={cn(
            "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-xl border border-primary/20 rounded-2xl p-6 shadow-xl shadow-primary/10 relative overflow-hidden",
            className
        )}>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary text-xl animate-pulse fill-active">auto_awesome</span>
                    <h3 className="text-lg font-black text-foreground">Share Your Voice</h3>
                </div>

                <p className="text-sm text-muted-foreground mb-4 italic">
                    "{promptOfTheDay}"
                </p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                    <QuickActionButton icon={<span className="material-symbols-outlined">mic</span>} label="Story" />
                    <QuickActionButton icon={<span className="material-symbols-outlined">menu_book</span>} label="Proverb" />
                    <QuickActionButton icon={<span className="material-symbols-outlined">music_note</span>} label="Song" />
                </div>

                <Button
                    onClick={onShareClick}
                    className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 group"
                >
                    <span>Add Your Voice to History</span>
                    <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Button>

                <p className="text-[10px] text-center text-muted-foreground mt-3 font-medium">
                    Join 10,000+ cultural guardians preserving our heritage
                </p>
            </div>
        </div>
    );
};

interface QuickActionButtonProps {
    icon: React.ReactNode;
    label: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label }) => {
    return (
        <button className="bg-card/50 hover:bg-card border border-border/50 hover:border-primary/30 rounded-lg p-3 flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95">
            <div className="text-primary">{icon}</div>
            <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
        </button>
    );
};
