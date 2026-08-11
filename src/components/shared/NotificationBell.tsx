"use client";

import React, { useState, useRef, useEffect } from 'react';
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
    const prevCount = useRef(unreadCount);

    useEffect(() => {
        if (unreadCount > prevCount.current) {
            setShouldWobble(true);
            const timer = setTimeout(() => setShouldWobble(false), 600);
            prevCount.current = unreadCount;
            return () => clearTimeout(timer);
        }
        prevCount.current = unreadCount;
    }, [unreadCount]);

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
