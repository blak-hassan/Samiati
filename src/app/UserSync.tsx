"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";

const MAX_SYNC_RETRIES = 5;

export function UserSync() {
    const { userId, isLoaded } = useAuth();
    const { user: clerkUser } = useUser();
    const storeUser = useMutation(api.users.mutations.store);
    const user = useQuery(api.users.queries.getProfile, {});
    const router = useRouter();
    const hasSynced = useRef(false);
    const syncRetries = useRef(0);

    useEffect(() => {
        if (!isLoaded || !userId || !clerkUser || hasSynced.current) return;

        hasSynced.current = true;

        const name = clerkUser.fullName || clerkUser.firstName || "User";
        const handle = clerkUser.username || `user_${userId.slice(-8)}`;
        const avatar = clerkUser.imageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + userId;
        const email = clerkUser.emailAddresses?.[0]?.emailAddress;
        const emailVerified = clerkUser.emailAddresses?.[0]?.verification?.status === "verified";

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

    useEffect(() => {
        if (!user || !isLoaded) return;
        if (user.onboardingCompleted !== false) return;

        const currentPath = window.location.pathname;
        if (!currentPath.includes('/onboarding')) {
            router.push('/dashboard/onboarding');
        }
    }, [user, isLoaded, router]);

    return null;
}
