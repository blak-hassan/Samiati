"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";

const MAX_SYNC_RETRIES = 5;

export function UserSync() {
    const { userId, isLoaded } = useAuth();
    const { user: clerkUser } = useUser();
    const storeUser = useMutation(api.users.mutations.store);
    const hasSynced = useRef(false);
    const syncRetries = useRef(0);

    useEffect(() => {
        if (!isLoaded || !userId || !clerkUser || hasSynced.current) return;

        hasSynced.current = true;

        const name = clerkUser.fullName || clerkUser.firstName || "User";
        const handle = clerkUser.username || `user_${userId.slice(-8)}`;
        const avatar = clerkUser.imageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + userId;
        const email = clerkUser.emailAddresses?.[0]?.emailAddress;

        // `emailVerified` is intentionally not sent: the server derives it from
        // the trusted Clerk identity claim, never from the client payload.
        storeUser({
            name,
            handle,
            avatar,
            email,
        }).catch((err) => {
            // Reset so a later render can retry, but cap retries to avoid an
            // infinite loop if the Convex backend is unreachable. This closes
            // the Clerk↔Convex sync gap: a Clerk identity without a Convex
            // record would otherwise silently block all data operations.
            syncRetries.current += 1;
            if (syncRetries.current < MAX_SYNC_RETRIES) {
                hasSynced.current = false;
            } else {
                console.error("UserSync: failed to sync Clerk user to Convex after retries", err);
            }
        });
    }, [isLoaded, userId, clerkUser, storeUser]);

    // Note: the onboarding flag is written by the `completeOnboarding`
    // mutation. There is no onboarding screen yet, so no redirect is issued
    // here — pointing at a missing route would strand the user on a 404.

    return null;
}
