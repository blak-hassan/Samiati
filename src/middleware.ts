import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  return publicRoutes.some(route => 
    path === route || path.startsWith(route)
  );
}

function isGuestRoute(req: NextRequest): boolean {
  const path = req.nextUrl.pathname;
  return guestRoutes.some(route => 
    path === route || path.startsWith(route)
  );
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const path = req.nextUrl.pathname;
  
  // If the route is public, allow access without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // For guest routes, we allow access but authentication is optional
  // The Convex client will handle auth - either with Clerk (if signed in) or without (for guests)
  if (isGuestRoute(req)) {
    return NextResponse.next();
  }
  
  // For all other routes, require authentication
  // This will redirect to sign-in if not authenticated
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run on API routes
    "/(api|trpc)(.*)",
  ],
};
