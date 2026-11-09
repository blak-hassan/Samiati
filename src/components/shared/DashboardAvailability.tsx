"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ServiceUnavailable } from "./ServiceUnavailable";

/** Do not mount service hooks on routes that cannot run without a provider. */
export function DashboardAvailability({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const supportsPreview =
    pathname === "/dashboard" ||
    pathname === "/dashboard/discover" ||
    pathname === "/dashboard/profile" ||
    (pathname.startsWith("/dashboard/settings") && pathname !== "/dashboard/settings/languages");

  if (!process.env.NEXT_PUBLIC_CONVEX_URL && !supportsPreview) {
    const isSettings = pathname.startsWith("/dashboard/settings");
    return <ServiceUnavailable
      feature={isSettings ? "Account languages" : "Community workspace"}
      active={isSettings ? "settings" : "changa"}
      description="This page needs a connection to load your account or community activity. You can still explore languages, preview chat, and change appearance settings."
    />;
  }
  return children;
}
