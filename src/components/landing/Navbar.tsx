"use client";

import React from "react";
import Link from "next/link";
import SamiatiLogo from "@/components/SamiatiLogo";
import { Button } from "@/components/ui/button";
import { TrackedCta } from "./HeroCta";

/**
 * In-page section links for the landing page. Every href must match an id
 * that actually exists on src/app/page.tsx (`#demo`, `#languages`,
 * `#changa`, `#pricing`, `#faq`). Hidden below `md` to keep the mobile
 * header to logo + actions.
 */
const NAV_LINKS = [
  { href: "#demo", label: "Try it" },
  { href: "#languages", label: "Languages" },
  { href: "#changa", label: "Changa" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;


export default function Navbar() {
  return (
    <nav
      aria-label="Main"
      className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center shrink-0" aria-label="Samiati home">
          <SamiatiLogo size={36} variant="primary" />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          {/* Previously an untracked plain Link — navbar conversions were
              invisible in the `cta_click` funnel. */}
          <TrackedCta
            href="/sign-up"
            location="navbar"
            label="Get Started Free"
            plan="free"
            size="sm"
            className="font-bold"
          />
        </div>
      </div>
    </nav>
  );
}
