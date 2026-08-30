import Link from "next/link";
import SamiatiLogo from "@/components/SamiatiLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Samiati",
  description: "Samiati Privacy Policy.",
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold font-display">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: August 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-stone-300">
          <section>
            <h2 className="text-lg font-bold text-white">Data Collection</h2>
            <p className="mt-3">
              We collect information you provide directly to us, such as when you
              create or modify your account, request on-demand services, contact
              customer support, or otherwise communicate with us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">Usage of Information</h2>
            <p className="mt-3">
              We use the information we collect to provide, maintain, and improve
              our services, such as to facilitate payments, send receipts, provide
              products and services you request (and send related information),
              develop new features, provide customer support, develop safety
              features, authenticate users, and send product updates and
              administrative messages.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">Data Sharing</h2>
            <p className="mt-3">
              We may share the information we collect about you as described in
              this Policy or as described at the time of collection or sharing,
              including as follows: with third parties to provide you a service
              you requested through a partnership or promotional offering made by
              a third party or us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">Data Security</h2>
            <p className="mt-3">
              We implement appropriate technical and organizational measures to
              protect your personal data against unauthorized or unlawful
              processing, accidental loss, destruction, or damage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">Your Rights</h2>
            <p className="mt-3">
              You have the right to access, correct, or delete your personal data.
              You can delete your account and all associated data at any time from
              your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">Contact Us</h2>
            <p className="mt-3">
              If you have any questions about this Privacy Policy, please contact
              us at support@samiati.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
