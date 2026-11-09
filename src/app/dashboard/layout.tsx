import { AuthGuard } from "@/components/auth/AuthGuard";
import AccountSettingsSync from "@/components/settings/AccountSettingsSync";
import { DashboardAvailability } from "@/components/shared/DashboardAvailability";
import ConvexClientProvider from "../ConvexClientProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Clerk is already provided by the root layout, so only Convex is wired
    // up here. The dashboard waits for auth to resolve before rendering so
    // authenticated queries do not flash empty state.
    <ConvexClientProvider waitForAuth={true} withClerkProvider={false}>
      {/* Mirrors the account-scoped settings (notifications, privacy) to and
          from the Convex users row. */}
      <AccountSettingsSync />
      <AuthGuard>
        <DashboardAvailability>{children}</DashboardAvailability>
      </AuthGuard>
    </ConvexClientProvider>
  );
}
