import Link from "next/link";
import SamiatiLogo from "@/components/SamiatiLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Samiati",
  description: "Samiati Terms of Service.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background-dark text-text-main antialiased">
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#2b1e19]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <SamiatiLogo size={36} variant="primary" />
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold font-display">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: August 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-stone-300">
          <section>
            <h2 className="text-lg font-bold text-white">1. Introduction</h2>
            <p className="mt-3">
              Welcome to Samiati. By accessing or using our mobile application and
              website, you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">2. User Conduct</h2>
            <p className="mt-3">
              You agree not to use the App for any unlawful purpose or in any way
              that interrupts, damages, or impairs the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">3. Content Ownership</h2>
            <p className="mt-3">
              You retain ownership of the content you post, but you grant Samiati a
              non-exclusive license to use, store, and copy that content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">4. Termination</h2>
            <p className="mt-3">
              We may terminate or suspend your account immediately, without prior
              notice or liability, for any reason whatsoever.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">5. Changes to Terms</h2>
            <p className="mt-3">
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">6. Contact Us</h2>
            <p className="mt-3">
              If you have any questions about these Terms, please contact us at
              support@samiati.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
