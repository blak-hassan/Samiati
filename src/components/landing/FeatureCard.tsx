import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-2xl border bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-border",
        featured: "border-primary shadow-lg",
        muted: "border-border/50 bg-muted/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface FeatureCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ className, variant, icon, title, description, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant }), "flex flex-col p-6", className)}
        {...props}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    );
  }
);
FeatureCard.displayName = "FeatureCard";

export { FeatureCard, cardVariants };
