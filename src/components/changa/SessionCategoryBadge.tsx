"use client";
import React from "react";
import { BookOpen, History, MessageSquare, Music, Scroll, Type } from "lucide-react";
import { cn } from "@/lib/utils";

export type SessionCategory = "proverb" | "story" | "song" | "history" | "word" | "general";

interface SessionCategoryBadgeProps {
    category?: SessionCategory | string;
    size?: "sm" | "md";
    className?: string;
}

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
    history: History,
    music: Music,
    song: Music,
    literature: BookOpen,
    story: BookOpen,
    stories: BookOpen,
    proverb: Scroll,
    word: Type,
    general: MessageSquare,
};

const TONE: Record<string, string> = {
    proverb: "bg-rasta-red/10 text-rasta-red",
    story: "bg-rasta-gold/10 text-amber-600 dark:text-rasta-gold",
    song: "bg-rasta-gold/20 text-amber-700 dark:text-rasta-gold/80",
    history: "bg-rasta-red/20 text-red-800 dark:text-rasta-red/80",
    word: "bg-rasta-green/10 text-rasta-green",
    general: "bg-primary/10 text-primary",
};

const LABEL: Record<string, string> = {
    proverb: "Proverb",
    story: "Story",
    song: "Song",
    history: "History",
    word: "Word",
    general: "Chat",
};

/**
 * Visual badge + icon for a conversation's cultural category. Uses brand color
 * tokens (rasta-red / rasta-gold / rasta-green) so the category is legible
 * regardless of theme. Pass `showLabel` to render the human-readable name
 * alongside the icon — used in card footers and detail headers.
 */
const SessionCategoryBadge: React.FC<SessionCategoryBadgeProps> = ({
    category,
    size = "md",
    className,
}) => {
    const key = (category ?? "general").toLowerCase();
    const Icon = ICON[key] ?? MessageSquare;
    const tone = TONE[key] ?? TONE.general;
    const label = LABEL[key] ?? "Chat";

    const dims = size === "sm" ? "w-9 h-9" : "w-12 h-12";
    const iconSize = size === "sm" ? "w-4 h-4" : "w-6 h-6";

    return (
        <div
            className={cn(
                "rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0",
                tone,
                dims,
                className
            )}
            aria-label={`Category: ${label}`}
            title={label}
        >
            <Icon className={iconSize} />
        </div>
    );
};

export default SessionCategoryBadge;
