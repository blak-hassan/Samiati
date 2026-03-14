"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";

export function useCurrentUser() {
  const { userId } = useAuth();
  const user = useQuery(api.users.queries.getProfile);
  
  return {
    user,
    isLoading: user === undefined,
    // User is authenticated if they have a Clerk ID AND a database profile
    isAuthenticated: !!userId && user !== undefined && user !== null,
    // Check if user is a guest (no Clerk ID but has a profile - for future use)
    isGuest: !userId && user?.isGuest === true,
  };
}

export function useUserId() {
  const { user, isLoading, isAuthenticated, isGuest } = useCurrentUser();
  
  return {
    userId: user?._id,
    clerkUserId: useAuth().userId,
    isLoading,
    isAuthenticated,
    isGuest,
  };
}
