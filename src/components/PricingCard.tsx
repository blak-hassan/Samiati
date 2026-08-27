"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
    "rounded-2xl border bg-card text-card-foreground transition-all duration-300",
    {
        variants: {
            variant: {
                default: "border-border",
                featured: "border-primary shadow-lg scale-[1.02]",
                muted: "border-border/50 bg-muted/50",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface PricingCardProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof cardVariants> {
    title: string;
    price: string;
    priceSuffix?: string;
    description: string;
    features: string[];
    cta: string;
    popular?: boolean;
    current?: boolean;
    onSelect?: () => void;
    loading?: boolean;
}

const PricingCard = React.forwardRef<HTMLDivElement, PricingCardProps>(
    (
        {
            className,
            variant,
            title,
            price,
            priceSuffix,
            description,
            features,
            cta,
            popular,
            current,
            onSelect,
            loading,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={cn(
                    cardVariants({ variant: popular ? "featured" : variant }),
                    "flex flex-col p-6",
                    current && "ring-2 ring-primary",
                    className
                )}
                {...props}
            >
                {popular && (
                    <div className="mb-4">
                        <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                            Most Popular
                        </span>
                    </div>
                )}

                <div className="mb-4">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>

                <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">{price}</span>
                        {priceSuffix && (
                            <span className="text-sm text-muted-foreground">/{priceSuffix}</span>
                        )}
                    </div>
                </div>

                <ul className="mb-6 flex-1 space-y-3">
                    {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                            <svg
                                className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>

                <button
                    onClick={onSelect}
                    disabled={loading || current}
                    className={cn(
                        "w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                        current
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : popular
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                >
                    {loading ? "Loading..." : current ? "Current Plan" : cta}
                </button>
            </div>
        );
    }
);
PricingCard.displayName = "PricingCard";

export { PricingCard, cardVariants };
