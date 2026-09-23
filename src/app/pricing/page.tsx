"use client";

import { PricingCard } from "../../components/PricingCard";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";
import type { Plan } from "@/lib/plans";

export default function PricingPage() {
    const router = useRouter();

    const handleSelect = (plan: Plan) => {
        if (plan.href.startsWith("mailto:")) {
            window.location.assign(plan.href);
        } else {
            router.push(plan.href);
        }
    };

    return (
        <main id="main" tabIndex={-1} className="min-h-screen bg-background">
            <div className="px-4 py-16 text-center">
                <h1 className="text-4xl font-bold tracking-tight">
                    Simple, transparent pricing
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Choose the plan that fits your language learning journey
                </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-6 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
                {PLANS.map((plan) => (
                    <PricingCard
                        key={plan.title}
                        title={plan.title}
                        price={plan.price}
                        priceSuffix={plan.priceSuffix}
                        description={plan.description}
                        features={plan.features}
                        cta={plan.cta}
                        popular={plan.popular}
                        onSelect={() => handleSelect(plan)}
                    />
                ))}
            </div>

            <div className="mx-auto max-w-3xl px-4 pb-16">
                <h2 className="mb-8 text-2xl font-bold text-center">Frequently Asked Questions</h2>
                <div className="space-y-6">
                    <div className="rounded-xl border border-border p-4">
                        <h3 className="font-medium">Can I change plans anytime?</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Yes! You can upgrade or downgrade at any time. Upgrades take effect immediately,
                            and downgrades apply at the end of your current billing period.
                        </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                        <h3 className="font-medium">What payment methods do you accept?</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            We accept credit and debit cards via Paystack, a secure payment processor.
                        </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                        <h3 className="font-medium">Is there a free trial?</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            The Explorer plan is free forever with no credit card required.
                            Try it out and upgrade when you&apos;re ready!
                        </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                        <h3 className="font-medium">What happens when I hit my usage limit?</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Your usage resets at the start of each billing period. You can upgrade
                            your plan anytime for higher limits.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
