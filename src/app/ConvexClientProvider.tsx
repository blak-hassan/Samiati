"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider } from "convex/react";
import { UserSync } from "./UserSync";
import { isDemoMode, clerkPublishableKey } from "@/lib/appMode";

const AUTH_LOADING_TIMEOUT_MS = 15000;

function LoadingScreen({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm">Taking longer than expected...</p>
                <button
                    onClick={onRetry}
                    className="mt-2 px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>
    );
}

function AuthTimedOut({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 p-6 max-w-sm text-center">
                <p className="text-foreground text-base font-medium">Connection timed out</p>
                <p className="text-muted-foreground text-sm">
                    This can happen on slow mobile networks. Check your connection and try again.
                </p>
                <button
                    onClick={onRetry}
                    className="mt-2 px-5 py-2.5 text-sm font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Reload page
                </button>
            </div>
        </div>
    );
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

// Inner provider that checks auth status
function AuthenticatedConvexProvider({ children }: { children: ReactNode }) {
    const { userId, isLoaded } = useAuth();
    const [timedOut, setTimedOut] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        if (isLoaded) {
            setTimedOut(false);
            return;
        }
        const timer = setTimeout(() => setTimedOut(true), AUTH_LOADING_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [isLoaded, retryKey]);

    const handleRetry = useCallback(() => {
        setTimedOut(false);
        setRetryKey(k => k + 1);
        window.location.reload();
    }, []);

    if (!isLoaded && timedOut) {
        return <AuthTimedOut onRetry={handleRetry} />;
    }

    // Show loading while checking auth
    if (!isLoaded) {
        return <LoadingScreen onRetry={handleRetry} />;
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
    if (convex) {
        return (
            <ConvexProvider client={convex}>
                {children}
            </ConvexProvider>
        );
    }
    
    return <>{children}</>;
}

export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    // No Convex URL configured — render children directly
    if (!convex) {
        return <>{children}</>;
    }

    // Demo mode: connect to Convex directly without Clerk
    if (isDemoMode) {
        return (
            <ConvexProvider client={convex}>
                {children}
            </ConvexProvider>
        );
    }

    // Production mode: use Clerk + Convex
    return (
        <ClerkProvider publishableKey={clerkPublishableKey}>
            <AuthenticatedConvexProvider>
                {children}
            </AuthenticatedConvexProvider>
        </ClerkProvider>
    );
}
