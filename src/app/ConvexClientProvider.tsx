"use client";

import { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider } from "convex/react";
import * as Mock from "./MockProviders";
import { UserSync } from "./UserSync";
import { isDemoMode, clerkPublishableKey } from "@/lib/appMode";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = isDemoMode ? null : convexUrl ? new ConvexReactClient(convexUrl) : null;

// Inner provider that checks auth status
function AuthenticatedConvexProvider({ children }: { children: ReactNode }) {
    const { userId, isLoaded } = useAuth();
    
    // Show loading while checking auth
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-stone-400 text-sm">Loading...</p>
                </div>
            </div>
        );
    }
    
    // If user is authenticated, use Convex with Clerk
    if (userId && convex) {
        return (
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <UserSync />
                {children}
            </ConvexProviderWithClerk>
        );
    }
    
    // For guests (no Clerk session), use Convex without Clerk authentication
    // This allows guests to browse but with limited permissions
    if (convex) {
        return (
            <ConvexProvider client={convex}>
                {children}
            </ConvexProvider>
        );
    }
    
    // Fallback to mock providers
    return <Mock.MockProviders>{children}</Mock.MockProviders>;
}

export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    // Without a Convex deployment URL or a valid Clerk publishable key the
    // backend can't run, so render the demo providers instead of mounting
    // Clerk (which would otherwise error out and blank the whole app).
    if (isDemoMode || !convex) {
        return <Mock.MockProviders>{children}</Mock.MockProviders>;
    }

    return (
        <ClerkProvider publishableKey={clerkPublishableKey}>
            <AuthenticatedConvexProvider>
                {children}
            </AuthenticatedConvexProvider>
        </ClerkProvider>
    );
}
