"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, ReactNode, useCallback } from "react";
import { AuthProvider } from "@/hooks/useCurrentUser";
import { isDemoMode } from "@/lib/appMode";

const AUTH_LOADING_TIMEOUT_MS = 15000;

function LoadingScreen({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background-dark">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-stone-400 text-sm">Taking longer than expected...</p>
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
        <div className="min-h-screen flex items-center justify-center bg-background-dark">
            <div className="flex flex-col items-center gap-4 p-6 max-w-sm text-center">
                <p className="text-stone-200 text-base font-medium">Connection timed out</p>
                <p className="text-stone-400 text-sm">
                    This can happen on slow mobile networks. Check your connection and try again.
                </p>
                <button
                    onClick={onRetry}
                    className="mt-2 px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Reload page
                </button>
            </div>
        </div>
    );
}

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function ClerkAuthGuard({ children }: AuthGuardProps) {
  const { isLoaded } = useAuth();
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

  if (!isLoaded) {
    return <LoadingScreen onRetry={handleRetry} />;
  }

  return <AuthProvider>{children}</AuthProvider>;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  if (isDemoMode) {
    return <>{fallback ?? children}</>;
  }
  return <ClerkAuthGuard fallback={fallback}>{children}</ClerkAuthGuard>;
}

interface GuestGuardProps {
  children: ReactNode;
}

function ClerkGuestGuard({ children }: GuestGuardProps) {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
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

  useEffect(() => {
    if (isLoaded && userId) {
      router.replace("/dashboard");
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded && timedOut) {
    return <AuthTimedOut onRetry={handleRetry} />;
  }

  if (!isLoaded) {
    return <LoadingScreen onRetry={handleRetry} />;
  }

  if (userId) {
    return null;
  }

  return <>{children}</>;
}

export function GuestGuard({ children }: GuestGuardProps) {
  if (isDemoMode) {
    return <>{children}</>;
  }
  return <ClerkGuestGuard>{children}</ClerkGuestGuard>;
}