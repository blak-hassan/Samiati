"use client";

import { PricingCard } from "../../components/PricingCard";
import { useRouter } from "next/navigation";

const plans = [
    {
        title: "Explorer",
        price: "Free",
        priceSuffix: undefined,
        description: "Perfect for getting started with African languages",
        features: [
            "10 AI messages per day",
            "5 translations per day",
            "2 voice messages per day",
            "7-day conversation history",
            "1 language profile",
        ],
        cta: "Get Started Free",
        popular: false,
    },
    {
        title: "Learner",
        price: "$5",
        priceSuffix: "month",
        description: "For dedicated learners ready to level up",
        features: [
            "400 AI messages per month",
            "200 translations per month",
            "20 voice minutes per month",
            "90-day conversation history",
            "5 language profiles",
        ],
        cta: "Start Learning",
        popular: true,
    },
    {
        title: "Fluent",
        price: "$15",
        priceSuffix: "month",
        description: "For serious learners and language enthusiasts",
        features: [
            "1,500 AI messages per month",
            "750 translations per month",
            "80 voice minutes per month",
            "Unlimited conversation history",
            "Unlimited language profiles",
            "Conversation export",
            "Priority support",
        ],
        cta: "Go Fluent",
        popular: false,
    },
    {
        title: "Organization",
        price: "Custom",
        priceSuffix: undefined,
        description: "For schools, NGOs, and language organizations",
        features: [
            "Custom usage limits",
            "API access",
            "Admin dashboard",
            "Dedicated support",
            "Custom integrations",
        ],
        cta: "Contact Sales",
        popular: false,
    },
];

export default function PricingPage() {
    const router = useRouter();

    const handleSelect = (title: string) => {
        const slug = title.toLowerCase();
        if (slug === "organization") {
            window.location.href = "mailto:support@samiati.com";
        } else if (slug === "explorer") {
            window.location.href = "/checkout?plan=free";
        } else {
            window.location.href = `/checkout?plan=${slug}`;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="px-4 py-16 text-center">
                <h1 className="text-4xl font-bold tracking-tight">
                    Simple, transparent pricing
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Choose the plan that fits your language learning journey
                </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-6 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
                {plans.map((plan) => (
                    <PricingCard
                        key={plan.title}
                        title={plan.title}
                        price={plan.price}
                        priceSuffix={plan.priceSuffix}
                        description={plan.description}
                        features={plan.features}
                        cta={plan.cta}
                        popular={plan.popular}
                        onSelect={() => handleSelect(plan.title)}
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
        </div>
    );
}
