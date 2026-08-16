"use client";

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Screen } from '@/types';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
    unreadCount: number;
    onNavigate: (screen: Screen) => void;
    className?: string;
    iconClassName?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
    unreadCount,
    onNavigate,
    className,
    iconClassName
}) => {
    const [shouldWobble, setShouldWobble] = useState(false);
    const [prevCount, setPrevCount] = useState(unreadCount);

    // Wobble when the unread count increases. Adjusting state during render,
    // guarded by the previous value, is React's documented pattern for
    // deriving state from a prop change — it avoids an effect round-trip.
    if (unreadCount !== prevCount) {
        const increased = unreadCount > prevCount;
        setPrevCount(unreadCount);
        if (increased) {
            setShouldWobble(true);
        }
    }

    useEffect(() => {
        if (!shouldWobble) return;
        const timer = setTimeout(() => setShouldWobble(false), 600);
        return () => clearTimeout(timer);
    }, [shouldWobble]);

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate(Screen.NOTIFICATIONS)}
            className={cn("relative rounded-full transition-colors", className)}
        >
            <Bell className={cn(
                "w-5 h-5 transition-transform",
                shouldWobble && "animate-wobble",
                iconClassName
            )} />
            {unreadCount > 0 && (
                <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 flex items-center justify-center font-bold text-[8px] rounded-full ring-2 ring-background animate-in zoom-in duration-300"
                >
                    {unreadCount}
                </Badge>
            )}
        </Button>
    );
};
