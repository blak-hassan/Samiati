"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { SubscriptionManager } from "../../../components/SubscriptionManager";
import { PricingCard } from "../../../components/PricingCard";
import Link from "next/link";

const upgradePlans = [
    {
        title: "Learner",
        price: "$5",
        priceSuffix: "month",
        description: "For dedicated learners",
        features: [
            "400 AI messages/month",
            "200 translations/month",
            "20 voice minutes/month",
            "90-day history",
            "5 language profiles",
        ],
        cta: "Upgrade to Learner",
    },
    {
        title: "Fluent",
        price: "$15",
        priceSuffix: "month",
        description: "For serious learners",
        features: [
            "1,500 AI messages/month",
            "750 translations/month",
            "80 voice minutes/month",
            "Unlimited history",
            "Unlimited languages",
            "Export & priority support",
        ],
        cta: "Upgrade to Fluent",
    },
];

export default function BillingPage() {
    // The subscription and usage queries are keyed by the Convex user id, so
    // it is resolved from the signed-in profile rather than hard-coded.
    const profile = useQuery(api.users.queries.getProfile, {});

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-4xl px-4 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Billing & Subscription</h1>
                    <p className="mt-2 text-muted-foreground">
                        Manage your subscription plan and view usage
                    </p>
                </div>

                <section className="mb-12">
                    <h2 className="mb-4 text-xl font-semibold">Current Plan</h2>
                    {profile ? (
                        <SubscriptionManager userId={profile._id} />
                    ) : (
                        <p className="text-muted-foreground">
                            {profile === undefined
                                ? "Loading your subscription…"
                                : "Sign in to view your subscription and usage."}
                        </p>
                    )}
                </section>

                <section>
                    <h2 className="mb-4 text-xl font-semibold">Upgrade Your Plan</h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        {upgradePlans.map((plan) => (
                            <PricingCard
                                key={plan.title}
                                title={plan.title}
                                price={plan.price}
                                priceSuffix={plan.priceSuffix}
                                description={plan.description}
                                features={plan.features}
                                cta={plan.cta}
                                onSelect={() => {
                                    window.location.assign(`/checkout?plan=${plan.title.toLowerCase()}`);
                                }}
                            />
                        ))}
                    </div>
                </section>

                <div className="mt-8 text-center">
                    <Link
                        href="/pricing"
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        View all pricing plans
                    </Link>
                </div>
            </div>
        </div>
    );
}
