import React from 'react';
import { Screen, User as UserType } from '@/types';
import {
    ArrowLeft,
    ChevronRight,
    Zap,
    User,
    Bell,
    Lock,
    Moon,
    Languages,
    HelpCircle,
    Info,
    LogOut,
    Shield,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useEffect, useState } from 'react';

interface Props {
    navigate: (screen: Screen) => void;
    goBack: () => void;
    onSignOut: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    user: UserType;
}

const SettingsScreen: React.FC<Props> = ({ navigate, goBack, onSignOut, isDarkMode, toggleTheme, user }) => {
    const [accentColor, setAccentColor] = useState<'brown' | 'red' | 'gold' | 'green'>('brown');

    useEffect(() => {
        const root = document.documentElement;
        const colors = {
            brown: { primary: '#8B4513', hover: '#6B3410' },
            red: { primary: '#C8102E', hover: '#A00D25' },
            gold: { primary: '#FFD700', hover: '#E6C200' },
            green: { primary: '#009B3A', hover: '#007C2E' },
        };

        const selected = colors[accentColor];
        root.style.setProperty('--active-accent', selected.primary);
        root.style.setProperty('--active-accent-hover', selected.hover);
    }, [accentColor]);

    return (
        <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
            <header className="flex items-center px-4 h-16 sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-30">
                <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg font-black text-foreground ml-2 tracking-tight">Settings</h1>
            </header>

            <main className="flex-1 overflow-y-auto pb-12 px-6 space-y-8 mt-4">
                {/* Profile Card */}
                <Card
                    className="flex items-center gap-4 bg-muted/20 p-5 rounded-3xl border-border/50 cursor-pointer hover:bg-muted/30 transition-all active:scale-[0.98] group shadow-none"
                    onClick={() => navigate(Screen.PROFILE)}
                >
                    <Avatar className="w-16 h-16 rounded-full border-2 border-background shadow-xl">
                        <AvatarImage src={user.avatar} className="object-cover" />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h2 className="text-lg font-black text-foreground tracking-tight">{user.name}</h2>
                        <p className="text-xs font-bold text-muted-foreground opacity-60 font-mono italic">{user.handle}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Card>

                {/* Premium Banner */}
                <Card className="bg-gradient-to-br from-primary via-orange-500 to-orange-600 rounded-[32px] p-6 text-white shadow-2xl shadow-primary/20 relative overflow-hidden border-none group">
                    <div className="absolute right-0 top-0 w-48 h-48 bg-white/20 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex items-start justify-between">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-black text-2xl mb-1 tracking-tighter">Samiati+</h3>
                                <p className="text-xs text-white/80 leading-relaxed max-w-[200px] font-medium">Unlock unlimited translations, exclusive cultural badges, and an ad-free journey.</p>
                            </div>
                            <Button className="bg-white text-primary hover:bg-stone-50 px-6 h-10 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 transition-all active:scale-95 border-none">
                                Upgrade Now
                            </Button>
                        </div>
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                            <Zap className="w-8 h-8 text-white fill-current" />
                        </div>
                    </div>
                </Card>

                {/* General Settings */}
                <div className="space-y-3 px-1">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Personalization</h3>
                    <Card className="bg-muted/10 border-border/50 rounded-[32px] overflow-hidden shadow-none">
                        <button onClick={() => navigate(Screen.SETTINGS_ACCOUNT)} className="w-full flex items-center gap-4 p-5 hover:bg-muted/30 transition-all border-b border-border/30 last:border-0 group">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                <User className="w-5 h-5 fill-current" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-black text-foreground tracking-tight">Account Security</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Passkeys, Recovery, Linked Accounts</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </button>
                        <button onClick={() => navigate(Screen.SETTINGS_NOTIFICATIONS)} className="w-full flex items-center gap-4 p-5 hover:bg-muted/30 transition-all border-b border-border/30 last:border-0 group">
                            <div className="w-10 h-10 rounded-2xl bg-rasta-red/10 text-rasta-red flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Bell className="w-5 h-5 fill-current" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-black text-foreground tracking-tight">System Notifications</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Push, Email, In-App Alerts</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </button>
                        <button onClick={() => navigate(Screen.SETTINGS_PRIVACY)} className="w-full flex items-center gap-4 p-5 hover:bg-muted/30 transition-all border-b border-border/30 last:border-0 group">
                            <div className="w-10 h-10 rounded-2xl bg-rasta-green/10 text-rasta-green flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Shield className="w-5 h-5 fill-current" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-black text-foreground tracking-tight">Data & Privacy</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Visibility, Blocked users, Tracking</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </button>
                    </Card>
                </div>

                {/* App Experience */}
                <div className="space-y-3 px-1">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">App Experience</h3>
                    <Card className="bg-muted/10 border-border/50 rounded-[32px] overflow-hidden shadow-none">
                        <div className="flex items-center justify-between p-5 border-b border-border/30 last:border-0 group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Moon className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-foreground tracking-tight">Dark Mode</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">High contrast interface</p>
                                </div>
                            </div>
                            <Switch checked={isDarkMode} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-primary" />
                        </div>
                        <div className="p-5 border-b border-border/30 last:border-0">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined">palette</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-foreground tracking-tight">Accent Color</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Personalize your interface</p>
                                </div>
                            </div>
                            <div className="flex gap-3 px-2">
                                {[
                                    { id: 'brown', color: '#8B4513', name: 'Brown' },
                                    { id: 'red', color: '#C8102E', name: 'Red' },
                                    { id: 'gold', color: '#FFD700', name: 'Gold' },
                                    { id: 'green', color: '#009B3A', name: 'Green' }
                                ].map((choice) => (
                                    <button
                                        key={choice.id}
                                        onClick={() => setAccentColor(choice.id as any)}
                                        className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative group",
                                            accentColor === choice.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-105"
                                        )}
                                        style={{ backgroundColor: choice.color }}
                                        title={choice.name}
                                    >
                                        {accentColor === choice.id && (
                                            <div className="w-2 h-2 bg-white rounded-full shadow-lg" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => navigate(Screen.MANAGE_LANGUAGES)} className="w-full flex items-center gap-4 p-5 hover:bg-muted/30 transition-all border-b border-border/30 last:border-0 group">
                            <div className="w-10 h-10 rounded-2xl bg-rasta-gold/10 text-rasta-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Languages className="w-5 h-5" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-black text-foreground tracking-tight">Content Language</p>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest">English (US)</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </button>
                    </Card>
                </div>

                {/* Community & Moderation */}
                <div className="space-y-3 px-1">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Community</h3>
                    <Card className="bg-muted/10 border-border/50 rounded-[32px] overflow-hidden shadow-none">
                        {/* If user is NOT a moderator */}
                        {(!user.role || user.role === 'member') && (
                            <button onClick={() => navigate(Screen.MODERATION_APPLICATION)} className="w-full flex items-center gap-4 p-5 hover:bg-muted/30 transition-all border-b border-border/30 last:border-0 group">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-black text-foreground tracking-tight">Become a Moderator</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Help Keep Samiati Safe</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </button>
                        )}

                        {/* If user IS a moderator or admin */}
                        {(user.role === 'moderator' || user.role === 'admin') && (
                            <>
                                <button onClick={() => navigate(Screen.MODERATION_DASHBOARD)} className="w-full flex items-center gap-4 p-5 hover:bg-muted/30 transition-all border-b border-border/30 last:border-0 group">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Shield className="w-5 h-5 fill-current" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-black text-foreground tracking-tight">Moderation Dashboard</p>
                                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Active Moderator</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                </button>
                                <button onClick={() => navigate(Screen.MODERATION_LOG)} className="w-full flex items-center gap-4 p-5 hover:bg-muted/30 transition-all border-b border-border/30 last:border-0 group">
                                    <div className="w-10 h-10 rounded-2xl bg-stone-500/10 text-stone-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-black text-foreground tracking-tight">Moderation History</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">View Past Actions</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                </button>
                            </>
                        )}
                    </Card>
                </div>

                {/* Support */}
                <div className="space-y-3 px-1">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Support & Info</h3>
                    <Card className="bg-muted/10 border-border/50 rounded-[32px] overflow-hidden shadow-none">
                        <button onClick={() => navigate(Screen.SETTINGS_HELP)} className="w-full flex items-center gap-4 p-5 hover:bg-muted/30 transition-all border-b border-border/30 last:border-0 group">
                            <div className="w-10 h-10 rounded-2xl bg-rasta-gold/10 text-rasta-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                                <HelpCircle className="w-5 h-5 fill-current" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-black text-foreground tracking-tight">Help Center</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">FAQs, Guides, Contact Support</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </button>
                        <button onClick={() => navigate(Screen.SETTINGS_ABOUT)} className="w-full flex items-center gap-4 p-5 hover:bg-muted/30 transition-all border-b border-border/30 last:border-0 group">
                            <div className="w-10 h-10 rounded-2xl bg-stone-500/10 text-stone-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Info className="w-5 h-5 fill-current" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-black text-foreground tracking-tight">Legal & Version</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Terms, Privacy Policy, Build Info</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </button>
                    </Card>
                </div>

                <div className="pt-4">
                    <Button
                        variant="ghost"
                        onClick={onSignOut}
                        className="w-full h-16 rounded-[24px] bg-destructive/5 text-destructive font-black uppercase tracking-[0.2em] text-[11px] hover:bg-destructive/10 transition-all border border-destructive/10 active:scale-95 gap-3"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </Button>
                </div>

                <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 py-6">Samiati v1.0.0 • Build 240</p>
            </main>
        </div>
    );
};

export default SettingsScreen;