import React, { useState } from 'react';
import { Screen } from '@/types';
import {
    ArrowLeft,
    Bookmark,
    Share2,
    Volume2,
    Sparkles,
    Heart,
    Eye,
    CheckCircle2,
    Trophy,
    Clock,
    BookOpen,
    Info,
    History,
    Languages,
    RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Props {
    navigate: (screen: Screen) => void;
    goBack: () => void;
}

const WordDetailScreen: React.FC<Props> = ({ goBack }) => {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const handleToggleBookmark = () => {
        setIsBookmarked(!isBookmarked);
        setToastMessage(!isBookmarked ? "Saved to your collection" : "Removed from collection");
        setTimeout(() => setToastMessage(null), 3000);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
            <header className="flex items-center p-4 sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30 transition-colors">
                <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div className="flex-1" />
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleBookmark}
                        className={cn("rounded-full transition-all active:scale-95", isBookmarked && "text-primary")}
                    >
                        <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Share2 className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-6 pb-24 max-w-2xl mx-auto w-full space-y-10">
                {/* Header Section */}
                <div className="flex flex-col items-center space-y-6 pt-4">
                    <div className="flex flex-col items-center gap-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-[0.2em] px-3 h-6">Swahili • Noun</Badge>
                        <h1 className="text-6xl font-black text-foreground tracking-tighter text-center">Umoja</h1>
                    </div>

                    <div className="flex items-center gap-4 bg-muted/40 backdrop-blur-sm rounded-2xl p-2 border border-border/50 shadow-inner group">
                        <Button
                            size="icon"
                            className="w-12 h-12 bg-primary text-white rounded-xl shadow-xl shadow-primary/20 hover:scale-110 active:scale-90 transition-all"
                        >
                            <Volume2 className="w-6 h-6 fill-current" />
                        </Button>
                        <div className="h-8 w-px bg-border/50 mx-1"></div>
                        <div className="pr-4 py-1">
                            <span className="font-mono text-xl font-bold text-foreground/80 opacity-70 tracking-tight">/u-mo-ja/</span>
                        </div>
                    </div>
                </div>

                {/* Definition Card */}
                <Card className="bg-muted/10 border-border p-8 rounded-3xl space-y-4 shadow-none">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Core Meaning</h2>
                    <p className="text-2xl font-bold text-foreground leading-tight tracking-tight">
                        Unity; oneness. The state of being united or joined as a whole.
                    </p>
                </Card>

                {/* Usage Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">Example Usage</h2>
                    </div>
                    <Card className="bg-primary/5 dark:bg-primary/5 rounded-2xl p-6 border-l-4 border-primary border-y-border border-r-border shadow-none space-y-3">
                        <p className="text-xl font-bold text-foreground leading-relaxed italic tracking-tight underline decoration-primary/20 decoration-4">"Umoja ni nguvu, utengano ni udhaifu."</p>
                        <Separator className="bg-primary/10 w-12 h-1 rounded-full" />
                        <p className="text-sm font-bold text-muted-foreground/80 tracking-tight leading-relaxed font-mono italic">Unity is strength, division is weakness.</p>
                    </Card>
                </section>

                {/* Cultural Context */}
                <section className="space-y-4 pt-4 border-t border-border/50">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80 flex items-center gap-2 px-1">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Cultural Context
                    </h2>
                    <Card className="bg-muted/10 border-border p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Trophy className="w-20 h-20 -mr-4 -mt-4 rotate-12" />
                        </div>
                        <p className="text-muted-foreground leading-relaxed font-medium text-sm">
                            <span className="font-black text-primary uppercase tracking-widest text-xs">Umoja</span> is the first principle of Kwanzaa, representing the value of striving for and maintaining unity in the family, community, nation, and race. It emphasizes that individual success is tied to the well-being of the collective.
                        </p>
                    </Card>
                </section>

                {/* Metadata/Stats */}
                <div className="flex items-center justify-between border-t border-border pt-8 mt-10">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 rounded-2xl border border-border shadow-sm">
                            <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKkfM9WqTPsqCfuM1KQIQ1QzsbiAaq2rab_EQ2MwL_8b9sbJ3-mIl3CjDCR888PPrsBNhkpl7tkden40rCqo3pJe3Sepe18k46KUvejTidyoAK941vcqejBnqRrcfC5hPZop_XFQ7S9jkteso1RvDSjv8s1JfGwGhOYE1uQ1M1J93quDxOniTqTNGD-1WZq2GOu_Z1EpzGjMzNeyvhYbuIwiqYK1TDLfGX5mpdg--_df6DoewiFO-RhrraeKpwY7MetQ94avb6spo" className="object-cover" />
                            <AvatarFallback>YU</AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                            <p className="text-xs font-black text-foreground tracking-tight">Changa by You</p>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                12 Oct 2023
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-9 gap-2 px-3 rounded-xl hover:bg-primary/5 hover:text-primary active:scale-95 transition-all text-muted-foreground group">
                                <Heart className="w-4 h-4 group-hover:fill-primary" />
                                <span className="font-black text-xs font-mono">25</span>
                            </Button>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-9 gap-2 px-3 rounded-xl hover:bg-muted active:scale-95 transition-all text-muted-foreground cursor-default">
                                <Eye className="w-4 h-4" />
                                <span className="font-black text-xs font-mono">142</span>
                            </Button>
                        </div>
                    </div>
                </div>

            </main>

            {/* Toast */}
            <div className={cn(
                "fixed bottom-10 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 transition-all duration-500 z-[60] border border-background/20 backdrop-blur-md",
                toastMessage ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-90 pointer-events-none"
            )}>
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <p className="font-black text-[11px] uppercase tracking-[0.2em]">{toastMessage}</p>
            </div>
        </div>
    );
};

export default WordDetailScreen;
