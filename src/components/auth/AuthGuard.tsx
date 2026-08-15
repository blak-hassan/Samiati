"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { AuthProvider } from "@/hooks/useCurrentUser";
import { isDemoMode } from "@/lib/appMode";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function ClerkAuthGuard({ children }: AuthGuardProps) {
  const { isLoaded } = useAuth();

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

  useEffect(() => {
    if (isLoaded && userId) {
      router.replace("/dashboard");
    }
  }, [isLoaded, userId, router]);

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