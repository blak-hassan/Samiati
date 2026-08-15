import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

// Define which routes are public (no authentication required)
const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up", 
  "/forgot-password",
];

// Routes where guests are allowed with limited permissions
const guestRoutes = [
  "/dashboard",
];

function isPublicRoute(req: NextRequest): boolean {
  const path = req.nextUrl.pathname;
  return publicRoutes.some((route) =>
    route === "/" ? path === route : path === route || path.startsWith(`${route}/`)
  );
}

function isGuestRoute(req: NextRequest): boolean {
  const path = req.nextUrl.pathname;
  return guestRoutes.some((route) =>
    path === route || path.startsWith(`${route}/`)
  );
}

// clerkMiddleware throws a missing-key error on every request when Clerk is
// not configured for the deployment. Only attach it (and route protection)
// when there are real keys so a misconfigured build still loads in demo mode.
const hasClerkCredentials =
  !!process.env.CLERK_SECRET_KEY && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const clerk = hasClerkCredentials
  ? clerkMiddleware(async (auth, req: NextRequest) => {
      if (isPublicRoute(req)) {
        return NextResponse.next();
      }
      if (isGuestRoute(req)) {
        return NextResponse.next();
      }
      await auth.protect();
    })
  : null;

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!clerk) {
    return NextResponse.next();
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