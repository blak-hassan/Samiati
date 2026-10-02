import { AuthGuard } from "@/components/auth/AuthGuard";

// These routes are authenticated, client-only screens behind Clerk + Convex.
// There is nothing useful to prerender — a static shell would ship empty auth
// state to every visitor — so opt the whole app shell out of static generation
// rather than page by page. src/app/dashboard/page.tsx already did this for the
// hub; declaring it on the layout covers every nested screen at once.
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {/* The skip link lives in the root layout (src/app/layout.tsx) and points
          at this `#main`. Rendering a second identical link here made "Skip to
          content" the first two tab stops instead of one — a duplicate
          landmark/name for screen-reader users. */}
      <main id="main" tabIndex={-1} className="min-h-screen">
        {children}
      </main>
    </AuthGuard>
  );
}
