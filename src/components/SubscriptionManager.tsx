"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UsageBar } from "./UsageBar";

interface SubscriptionManagerProps {
    userId: string;
}

const planDetails = {
    free: {
        name: "Explorer",
        price: "Free",
        period: "",
    },
    learner: {
        name: "Learner",
        price: "$5",
        period: "/month",
    },
    fluent: {
        name: "Fluent",
        price: "$15",
        period: "/month",
    },
    organization: {
        name: "Organization",
        price: "Custom",
        period: "",
    },
};

export function SubscriptionManager({ userId }: SubscriptionManagerProps) {
    const subscription = useQuery(api.payments.billing.getActiveSubscription, {
        userId: userId as any,
    });

    const usage = useQuery(api.payments.usage.getUsageStats, {
        userId: userId as any,
        tier: (subscription?.plan ?? "free") as any,
    });

    const cancelSubscription = useMutation(api.payments.billing.cancelSubscription);

    if (subscription === undefined || usage === undefined) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                <div className="h-32 animate-pulse rounded-xl bg-muted" />
            </div>
        );
    }

    if (subscription === null) {
        return (
            <div className="rounded-xl border border-border p-6">
                <p className="text-muted-foreground">No active subscription. Choose a plan to get started.</p>
            </div>
        );
    }

    const plan = planDetails[subscription.plan as keyof typeof planDetails];

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-border p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-bold">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            {plan.price}{plan.period}
                            {subscription.status === "active" && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                    Active
                                </span>
                            )}
                        </p>
                    </div>
                    {subscription.plan !== "free" && (
                        <button
                            onClick={() => cancelSubscription({ subscriptionId: subscription._id })}
                            className="text-sm text-red-500 hover:text-red-700"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                    Current period:{" "}
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} —{" "}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </div>
            </div>

            <div className="rounded-xl border border-border p-6 space-y-4">
                <h4 className="font-medium">Current Period Usage</h4>
                <UsageBar
                    label="AI Messages"
                    current={usage.chat.current}
                    limit={usage.chat.limit}
                />
                <UsageBar
                    label="Translations"
                    current={usage.translate.current}
                    limit={usage.translate.limit}
                />
                <UsageBar
                    label="Voice Messages"
                    current={usage.voice.current}
                    limit={usage.voice.limit}
                    unit={` (${usage.voice.minutes.toFixed(1)} min)`}
                />
            </div>
        </div>
    );
}
