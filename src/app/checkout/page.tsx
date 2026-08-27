"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckoutForm } from "../../components/CheckoutForm";
import { Suspense } from "react";

type Plan = "free" | "learner" | "fluent";

const planDetails: Record<Plan, { name: string; price: string; period: string }> = {
    free: { name: "Explorer", price: "Free", period: "" },
    learner: { name: "Learner", price: "$5", period: "/month" },
    fluent: { name: "Fluent", price: "$15", period: "/month" },
};

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const planParam = searchParams.get("plan") as Plan | null;

    const [plan, setPlan] = React.useState<Plan>(planParam ?? "learner");

    React.useEffect(() => {
        if (planParam && (planParam === "free" || planParam === "learner" || planParam === "fluent")) {
            setPlan(planParam);
        }
    }, [planParam]);

    const details = planDetails[plan];

    return (
        <div className="mx-auto max-w-md px-4 py-16">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold">Complete Your Purchase</h1>
                <p className="mt-2 text-muted-foreground">
                    {details.name} Plan — {details.price}{details.period}
                </p>
            </div>

            <div className="mb-6 flex gap-2">
                {(["free", "learner", "fluent"] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPlan(p)}
                        className={`flex-1 rounded-lg border p-3 text-sm font-medium transition-colors ${
                            plan === p
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:bg-muted"
                        }`}
                    >
                        {planDetails[p].name}
                    </button>
                ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <CheckoutForm
                    plan={plan}
                    onSuccess={() => {
                        router.push("/settings/billing");
                    }}
                    onCancel={() => {
                        router.push("/pricing");
                    }}
                />
            </div>

            <div className="mt-6 space-y-2 text-center text-xs text-muted-foreground">
                <p>Payments secured by Paystack</p>
                <p>Cancel anytime from your account settings</p>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            }>
                <CheckoutContent />
            </Suspense>
        </div>
    );
}
