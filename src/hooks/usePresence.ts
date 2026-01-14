"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const HEARTBEAT_INTERVAL = 60000; // 1 minute

/**
 * Hook to manage user presence (online status)
 * Call this in your main layout or dashboard to keep user online status updated
 */
export function usePresence() {
    const heartbeat = useMutation(api.presence.mutations.heartbeat);
    const goOffline = useMutation(api.presence.mutations.goOffline);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const sendHeartbeat = useCallback(async () => {
        try {
            await heartbeat();
        } catch (error) {
            console.error('Failed to send presence heartbeat:', error);
        }
    }, [heartbeat]);

    const handleOffline = useCallback(async () => {
        try {
            await goOffline();
        } catch (error) {
            console.error('Failed to set offline status:', error);
        }
    }, [goOffline]);

    useEffect(() => {
        // Send initial heartbeat
        sendHeartbeat();

        // Set up periodic heartbeat
        intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        // Handle page visibility changes
        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleOffline();
            } else {
                sendHeartbeat();
            }
        };

        // Handle page unload
        const handleBeforeUnload = () => {
            handleOffline();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            handleOffline();
        };
    }, [sendHeartbeat, handleOffline]);

    return {
        sendHeartbeat,
        goOffline: handleOffline,
    };
}
