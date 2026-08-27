"use client";
import React, { useState } from 'react';
import { Screen, User as UserType } from '@/types';
import {
    ArrowLeft,
    ChevronRight,
    Zap,
    Bell,
    Moon,
    HelpCircle,
    LogOut,
    User,
    Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
    navigate: (screen: Screen) => void;
    goBack: () => void;
    onSignOut: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    user: UserType;
}

const SettingsScreen: React.FC<Props> = ({ navigate, goBack, onSignOut, isDarkMode, toggleTheme, user }) => {
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
            <header className="flex items-center px-4 h-14 sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-border/50">
                <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full" aria-label="Go back">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-lg font-bold text-foreground ml-2 tracking-tight">Settings</h1>
            </header>

            <main className="flex-1 overflow-y-auto pb-12 px-4 sm:px-6 space-y-6 mt-4">
                {/* Profile Card */}
                <button
                    type="button"
                    className="w-full text-left flex items-center gap-4 bg-muted/20 p-5 rounded-2xl border border-border/50 cursor-pointer hover:bg-muted/30 transition-all active:scale-[0.98] group shadow-none"
                    onClick={() => navigate(Screen.PROFILE)}
                >
                    <Avatar className="w-14 h-14 rounded-full border-2 border-background shadow-lg">
                        <AvatarImage src={user.avatar} className="object-cover" />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-foreground tracking-tight truncate">{user.name}</h2>
                        <p className="text-xs text-muted-foreground font-medium truncate">{user.handle}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </button>

                {/* Premium Banner */}
                <Card className="bg-gradient-to-br from-primary via-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-primary/20 relative overflow-hidden border-none group">
                    <div className="absolute right-0 top-0 w-40 h-40 bg-white/20 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex items-start justify-between">
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-bold text-xl mb-1 tracking-tight">Samiati+</h3>
                                <p className="text-xs text-white/80 leading-relaxed max-w-[200px]">Unlock unlimited translations, exclusive cultural badges, and an ad-free journey.</p>
                            </div>
                            <Button
                                onClick={() => window.location.href = "/pricing"}
                                className="bg-white text-primary hover:bg-stone-50 px-5 h-9 rounded-full text-xs font-bold shadow-lg transition-all active:scale-95 border-none"
                            >
                                Upgrade Now
                            </Button>
                        </div>
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                            <Zap className="w-7 h-7 text-white fill-current" />
                        </div>
                    </div>
                </Card>

                {/* Settings Links */}
                <Card className="bg-muted/10 border-border/50 rounded-2xl overflow-hidden shadow-none">
                    <button onClick={() => navigate(Screen.SETTINGS_ACCOUNT)} className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-all border-b border-border/30 last:border-0 group">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-foreground tracking-tight">Account</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">Password, 2FA, Delete</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </button>
                    <button onClick={() => navigate(Screen.SETTINGS_NOTIFICATIONS)} className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-all border-b border-border/30 last:border-0 group">
                        <div className="w-10 h-10 rounded-xl bg-rasta-red/10 text-rasta-red flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-foreground tracking-tight">Notifications</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">Push, Email, In-App</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </button>
                    <button onClick={() => navigate(Screen.SETTINGS_PRIVACY)} className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-all border-b border-border/30 last:border-0 group">
                        <div className="w-10 h-10 rounded-xl bg-rasta-green/10 text-rasta-green flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-foreground tracking-tight">Privacy</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">Blocked, Muted, Data</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </button>
                    <div className="flex items-center justify-between p-4 border-b border-border/30 last:border-0 group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Moon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground tracking-tight">Dark Mode</p>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">High contrast interface</p>
                            </div>
                        </div>
                        <Switch checked={isDarkMode} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-primary" />
                    </div>
                    <button onClick={() => navigate(Screen.SETTINGS_HELP)} className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-all last:border-0 group">
                        <div className="w-10 h-10 rounded-xl bg-rasta-gold/10 text-rasta-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-foreground tracking-tight">Help & Support</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">FAQ, Contact</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </button>
                </Card>

                {/* Sign Out */}
                <div className="pt-2">
                    <Button
                        variant="ghost"
                        onClick={() => setShowSignOutDialog(true)}
                        className="w-full h-12 rounded-2xl bg-destructive/5 text-destructive font-bold text-sm hover:bg-destructive/10 transition-all border border-destructive/10 active:scale-95 gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </Button>
                </div>
            </main>

            {/* Sign Out Confirmation Dialog */}
            <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Log out of Samiati?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will need to sign in again to access your account and saved content.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onSignOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Log Out
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default SettingsScreen;

