# Security Improvements Implemented

## Fixed Errors

### Issue: "Called storeUser without authentication present"

**Root Cause:** The application was trying to call the Convex `storeUser` mutation for unauthenticated (guest) users, but Convex with Clerk integration requires authentication for all mutations when using `ConvexProviderWithClerk`.

**Fixes Applied:**

1. **[`src/app/ConvexClientProvider.tsx`](src/app/ConvexClientProvider.tsx)**
   - Restructured to use different Convex providers based on auth status
   - Authenticated users: Uses `ConvexProviderWithClerk` (full features)
   - Guests (unauthenticated): Uses plain `ConvexProvider` (limited features)
   - Only syncs users to database when Clerk authentication is present

2. **[`src/components/auth/AuthGuard.tsx`](src/components/auth/AuthGuard.tsx)**
   - Updated to allow access without immediate authentication redirect
   - Permission checking is done server-side in Convex mutations

3. **[`src/hooks/useCurrentUser.ts`](src/hooks/useCurrentUser.ts)**
   - Updated to properly check authentication status using both Clerk and database user
   - Added `isGuest` flag for future guest user support

4. **[`src/middleware.ts`](src/middleware.ts)**
   - Added guest route support for `/dashboard` and its subpaths
   - Public routes remain: `/`, `/sign-in`, `/sign-up`, `/forgot-password`

## Previous Security Improvements (Preserved)

1. **Server-Side Route Protection** - Middleware added for authentication
2. **Input Validation** - Added length limits and sanitization to mutations
3. **Guest Permission System** - Guests cannot create posts, follow users, or update profiles (enforced server-side)
4. **Security Headers** - X-Content-Type-Options, X-Frame-Options, etc.

## Guest User Behavior

- Guests can view the dashboard and browse content (using ConvexProvider without Clerk)
- Guests cannot create posts, follow users, or update profiles (enforced server-side in mutations)
- When guests sign up/sign in, they get a full user profile with all features
- The `isGuestUser()` helper in Convex checks `user.isGuest === true` to restrict actions

## How Guest Restrictions Work

1. **Client-side**: Guests can browse and view content
2. **Server-side (Convex)**: Mutations check `isGuestUser(user)` and throw errors for restricted actions:
   - `create` mutation: "Guests cannot create posts. Please sign up to contribute."
   - `updateProfile` mutation: "Guest users cannot update their profile"
   - `follow` mutation: "Guest users cannot follow other users"
