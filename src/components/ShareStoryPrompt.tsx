import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { CONTRIBUTION_TYPES } from '@/lib/constants';

interface ShareStoryPromptProps {
    onShareClick: () => void;
    onTypeClick?: (type: string) => void;
    promptOfTheDay?: string;
    className?: string;
}

const CULTURAL_PROMPTS = [
    "What word did your grandmother teach you?",
    "What is a lullaby your mother sang to you?",
    "Which proverb did your elders use for luck?",
    "What story was told in your family during harvest?",
    "How did your community celebrate a new name?",
    "What was the first riddle you ever solved?"
];

export const ShareStoryPrompt: React.FC<ShareStoryPromptProps> = ({
    onShareClick,
    onTypeClick,
    promptOfTheDay,
    className
}) => {
    const [currentPrompt, setCurrentPrompt] = React.useState(promptOfTheDay || CULTURAL_PROMPTS[0]);
    const typesScrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (promptOfTheDay) return;

        // Rotate prompt every 10 seconds or on mount
        const interval = setInterval(() => {
            setCurrentPrompt(prev => {
                const currentIndex = CULTURAL_PROMPTS.indexOf(prev);
                return CULTURAL_PROMPTS[(currentIndex + 1) % CULTURAL_PROMPTS.length];
            });
        }, 10000);

        return () => clearInterval(interval);
    }, [promptOfTheDay]);

    return (
        <div className={cn(
            "bg-gradient-to-br from-primary/15 via-primary/5 to-transparent backdrop-blur-xl border border-primary/20 rounded-2xl p-6 shadow-xl shadow-primary/10 relative overflow-hidden",
            className
        )}>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl animate-pulse fill-active">auto_awesome</span>
                    <h3 className="text-lg font-black text-foreground">Share Your Voice</h3>
                </div>

                <div className="max-w-md mx-auto mb-8">
                    <p className="text-sm text-muted-foreground italic min-h-[48px] flex items-center justify-center text-center animate-in fade-in duration-500 px-8 leading-relaxed">
                        "{currentPrompt}"
                    </p>
                </div>

                <div className="relative mb-6">
                    {/* Navigation Arrows for Types */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between -mx-3 pointer-events-none z-20">
                        <button
                            onClick={() => typesScrollRef.current?.scrollBy({ left: -140, behavior: 'smooth' })}
                            className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all pointer-events-auto"
                            title="Previous Type"
                        >
                            <span className="material-symbols-outlined text-sm font-black">chevron_left</span>
                        </button>
                        <button
                            onClick={() => typesScrollRef.current?.scrollBy({ left: 140, behavior: 'smooth' })}
                            className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all pointer-events-auto"
                            title="Next Type"
                        >
                            <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
                        </button>
                    </div>

                    <div
                        ref={typesScrollRef}
                        className="flex overflow-x-auto no-scrollbar gap-3 px-1 py-1 snap-x snap-mandatory scroll-smooth"
                    >
                        {CONTRIBUTION_TYPES.map((type: any) => (
                            <div key={type.id} className="snap-center shrink-0">
                                <QuickActionButton
                                    icon={<span className="material-symbols-outlined">{type.icon}</span>}
                                    label={type.label}
                                    onClick={() => onTypeClick?.(type.id)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <Button
                    onClick={onShareClick}
                    className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 group bg-primary hover:bg-primary-hover text-white transition-all"
                >
                    <span>Changia Historia</span>
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
    onClick?: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="w-24 h-24 bg-white/50 dark:bg-card/40 hover:bg-white/80 dark:hover:bg-primary/10 border border-primary/10 hover:border-primary/30 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 group shadow-sm backdrop-blur-sm"
        >
            <div className="text-primary group-hover:scale-110 transition-transform">{icon}</div>
            <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300 group-hover:text-primary transition-colors text-center leading-tight">{label}</span>
        </button>
    );
};
