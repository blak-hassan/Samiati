"use client";

import { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider } from "convex/react";
import * as Mock from "./MockProviders";
import { UserSync } from "./UserSync";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

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
    // If no convex URL, just render children with mock providers
    if (!convexUrl || !convex) {
        return <Mock.MockProviders>{children}</Mock.MockProviders>;
    }

    return (
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
            <AuthenticatedConvexProvider>
                {children}
            </AuthenticatedConvexProvider>
        </ClerkProvider>
    );
}
