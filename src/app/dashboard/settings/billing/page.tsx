"use client";

import * as React from "react";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { PricingCard } from "@/components/PricingCard";
import { useRouter } from "next/navigation";
import { useAppUser } from "@/hooks/useAppUser";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";
import SettingsLayoutClient from "@/components/settings/SettingsLayoutClient";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";

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
    const { navigate, goBack } = useNavigation();
    const { user } = useAppUser();
    const router = useRouter();
    const userId = user?.id || "current";

    const handleSelectPlan = (planTitle: string) => {
        router.push(`/checkout?plan=${planTitle.toLowerCase()}`);
    };

    return (
        <SettingsLayoutClient activeScreen={Screen.SETTINGS_BILLING}>
        <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
            <SettingsPageHeader title="Billing & Subscription" onBack={() => router.back()} />

            <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-foreground">Current Plan</h2>
                        <p className="mt-2 text-muted-foreground">
                            Manage your subscription plan and view usage
                        </p>
                    </div>

                    <section className="mb-12">
                        <SubscriptionManager userId={userId} />
                    </section>

                    <section>
                        <h2 className="mb-4 text-xl font-semibold text-foreground">Upgrade Your Plan</h2>
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
                                    onSelect={() => handleSelectPlan(plan.title)}
                                />
                            ))}
                        </div>
                    </section>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => router.push("/pricing")}
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            View all pricing plans
                        </button>
                    </div>
                </div>
            </main>
        </div>
        </SettingsLayoutClient>
    );
}