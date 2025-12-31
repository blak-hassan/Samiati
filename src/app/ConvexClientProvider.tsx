"use client";

import { ReactNode } from "react";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import * as Mock from "./MockProviders";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

function UserSync() {
    const { userId } = useAuth();
    const { user: clerkUser } = useUser();
    const storeUser = useMutation(api.users.mutations.store);

    useEffect(() => {
        if (userId && clerkUser) {
            storeUser({
                name: clerkUser.fullName || clerkUser.firstName || "User",
                handle: "user_" + (clerkUser.username || clerkUser.id.slice(0, 8)),
                avatar: clerkUser.imageUrl,
                email: clerkUser.primaryEmailAddress?.emailAddress,
            });
        }
    }, [userId, clerkUser, storeUser]);

    return null;
}

export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    const content = !convexUrl || !convex ? (
        children
    ) : (
        <ClerkProvider>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <UserSync />
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );

    return <Mock.MockProviders>{content}</Mock.MockProviders>;
}
