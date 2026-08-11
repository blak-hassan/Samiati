"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";

export function UserSync() {
    const { userId, isLoaded } = useAuth();
    const { user: clerkUser } = useUser();
    const storeUser = useMutation(api.users.mutations.store);
    const hasSynced = useRef(false);

    useEffect(() => {
        if (!isLoaded || !userId || !clerkUser || hasSynced.current) return;

        hasSynced.current = true;

        const name = clerkUser.fullName || clerkUser.firstName || "User";
        const handle = clerkUser.username || `user_${userId.slice(-8)}`;
        const avatar = clerkUser.imageUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + userId;
        const email = clerkUser.emailAddresses?.[0]?.emailAddress;

        storeUser({
            name,
            handle,
            avatar,
            email,
        }).catch(() => {
            hasSynced.current = false;
        });
    }, [isLoaded, userId, clerkUser, storeUser]);

    return null;
}
