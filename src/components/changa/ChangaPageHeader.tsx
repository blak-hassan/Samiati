"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell } from "lucide-react";

interface Props {
    title: string;
    onBack: () => void;
    onNotifications?: () => void;
}

export function ChangaPageHeader({ title, onBack, onNotifications }: Props) {
    return (
        <header className="flex items-center justify-between px-4 h-14 sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-border/50">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 rounded-full" aria-label="Go back">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-base font-bold text-foreground tracking-tight truncate">{title}</h1>
            </div>
            {onNotifications ? (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNotifications}
                    aria-label="Notifications"
                    className="rounded-full"
                >
                    <Bell className="w-5 h-5" />
                </Button>
            ) : null}
        </header>
    );
}
