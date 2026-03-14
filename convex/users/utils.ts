import { QueryCtx, MutationCtx } from "../_generated/server";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        return null;
    }
    const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
    return user;
}

// Authorization helper to check if user is a guest
export function isGuestUser(user: { isGuest?: boolean } | null): boolean {
    return user?.isGuest === true;
}

// Authorization helper to check if user has admin role
export function isAdmin(user: { role?: string } | null): boolean {
    return user?.role === 'admin';
}

// Authorization helper to check if user has moderator role
export function isModerator(user: { role?: string } | null): boolean {
    return user?.role === 'moderator' || user?.role === 'admin';
}

// Check if user can perform an action based on their role
export function canPerformAction(
    user: { isGuest?: boolean; role?: string } | null,
    action: 'create_post' | 'delete_post' | 'moderate' | 'follow' | 'message' | 'comment'
): boolean {
    // Guests have limited permissions
    if (isGuestUser(user)) {
        const guestAllowedActions = ['view_feed', 'view_profile'];
        return guestAllowedActions.includes(action);
    }
    
    // Members have more permissions
    if (user?.role === 'member' || user?.role === 'moderator' || user?.role === 'admin') {
        const memberAllowedActions = [
            'create_post', 'follow', 'comment', 'view_feed', 'view_profile'
        ];
        return memberAllowedActions.includes(action);
    }
    
    // Moderators can also moderate
    if (isModerator(user)) {
        return true; // All actions allowed
    }
    
    // Admins can do everything
    if (isAdmin(user)) {
        return true; // All actions allowed
    }
    
    return false;
}
