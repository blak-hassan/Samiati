import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

// =============================================================================
// PROXY (formerly middleware) — Next.js 16
// =============================================================================
// Route protection and CSP are wired through Clerk's `clerkMiddleware`,
// which can generate a CSP that is compatible with Clerk's own browser bundle
// and social-button assets. See:
//   https://clerk.com/docs/guides/secure/best-practices/csp-headers
//
// We use Clerk's "default" (host-allowlist) CSP configuration rather than
// the "strict" nonce-based one because:
//   1. <ClerkProvider> is currently mounted from a client component
//      (ConvexClientProvider.tsx). Strict mode requires the provider to live
//      in a Server Component so it can read the nonce from request headers.
//   2. The default config already allowlists every origin Clerk loads from
//      (https://img.clerk.com, https://*.protect.clerk.com:*,
//      https://challenges.cloudflare.com, the FAPI host, etc.), which is
//      what was previously missing and broke sign-in/sign-up rendering.
//
// App-specific origins (Convex, Sentry, Google Fonts, DiceBear, the
// Clerk dashboard frontend-API host) are merged in via the `directives`
// option so the existing app continues to work unchanged.

const clerk = clerkMiddleware(
    async (auth, req: NextRequest) => {
        const path = req.nextUrl.pathname;

        // Public routes — no auth required.
        if (
            path === "/" ||
            path.startsWith("/sign-in") ||
            path.startsWith("/sign-up") ||
            path.startsWith("/forgot-password") ||
            path.startsWith("/api/sms/") ||
            path.startsWith("/api/wiki")
        ) {
            return NextResponse.next();
        }

        // Guest-friendly routes — render for both signed-in and signed-out.
        if (path === "/dashboard" || path.startsWith("/dashboard/")) {
            return NextResponse.next();
        }

        // Everything else requires an authenticated session.
        await auth.protect();
    },
    {
        // `trustHost: true` is required when the app is served behind a
        // tunneling/forwarding host (e.g. localtunnel for phone testing).
        // Without it Clerk rejects the host header and auth fails.
        // Safe in production as long as the proxy is in front of any
        // untrusted traffic.
        trustHost: true,

        // Automatic CSP — Clerk fills in its required origins; we add the
        // non-Clerk origins the rest of the app needs.
        contentSecurityPolicy: {
            directives: {
                "img-src": [
                    "https://*.convex.cloud",
                    "https://*.googleusercontent.com",
                    "https://api.dicebear.com",
                    "https://www.google.com",
                    "https://*.vercel.app",
                ],
                "connect-src": [
                    "https://*.convex.cloud",
                    "https://*.sentry.io",
                    "https://*.googleapis.com",
                ],
                "script-src": [
                    "https://js.sentry-cdn.com",
                    "https://browser.sentry-cdn.com",
                ],
                "style-src": ["https://fonts.googleapis.com"],
                "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
                "media-src": ["blob:"],
            },
        },
    },
);

/**
 * Fallback when Clerk credentials are missing (e.g. demo mode). Lets the
 * dev server run without Clerk so the rest of the app stays usable.
 */
function passthrough() {
    return NextResponse.next();
}

const hasClerkCredentials =
    !!process.env.CLERK_SECRET_KEY && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
    if (!hasClerkCredentials) {
        if (process.env.NODE_ENV === "production") {
            console.error(
                "[CRITICAL] Clerk not configured in production — refusing to serve. " +
                "Set CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.",
            );
            return new NextResponse("Server misconfigured", { status: 503 });
        }
        return passthrough();
    }
    return clerk(req, event);
}

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/__clerk/:path*",
        "/(api|trpc)(.*)",
    ],
};