"use client";

import * as React from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

interface CheckoutFormProps {
    plan: "free" | "learner" | "fluent";
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function CheckoutForm({ plan, onSuccess, onCancel }: CheckoutFormProps) {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const startSubscription = useMutation(api.payments.billing.startSubscription);
    const initializePayment = useAction(api.payments.paystack.initializePayment);

    const prices: Record<string, { cents: number; display: string }> = {
        free: { cents: 0, display: "Free" },
        learner: { cents: 500, display: "$5" },
        fluent: { cents: 1500, display: "$15" },
    };

    const handleCheckout = async () => {
        setLoading(true);
        setError(null);

        try {
            // Free plan - just activate directly
            if (plan === "free") {
                await startSubscription({ plan: "free" });
                onSuccess?.();
                return;
            }

            // Paid plan - redirect to Paystack
            const subscriptionId = await startSubscription({ plan });

            const result = await initializePayment({
                subscriptionId,
                email: "user@example.com",
                amountCents: prices[plan].cents,
                currency: "USD",
            });

            if (result.authorizationUrl) {
                window.location.href = result.authorizationUrl;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Payment failed");
        } finally {
            setLoading(false);
        }
    };

    if (plan === "free") {
        return (
            <div className="space-y-6">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    Start using Samiati for free with basic features.
                </div>

                <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                    {loading ? "Processing..." : "Get Started Free"}
                </button>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                You will be redirected to Paystack to complete your payment securely.
            </div>

            <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
                {loading ? "Processing..." : `Pay ${prices[plan].display}/month`}
            </button>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <button
                onClick={onCancel}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
                Cancel
            </button>
        </div>
    );
}
