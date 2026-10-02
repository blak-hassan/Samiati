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
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>
      <main id="main" tabIndex={-1} className="min-h-screen">
        {children}
      </main>
    </AuthGuard>
  );
}
