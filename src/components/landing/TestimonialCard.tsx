import React from "react";
import { cn } from "@/lib/utils";

// <figure> is the rendered element, so the props type follows it (a `<figure>`
// is not a <div> and doesn't accept div-only attributes).
export interface TestimonialCardProps
  extends React.HTMLAttributes<HTMLElement> {
  quote: string;
  name: string;
  role: string;
}

const TestimonialCard = React.forwardRef<HTMLElement, TestimonialCardProps>(
  ({ className, quote, name, role, ...props }, ref) => {
    return (
      // figure/blockquote/figcaption so the quote is exposed semantically
      // (it was a bare <p> inside a <div>, which screen readers and
      // structured-data tooling both read as ordinary body text).
      <figure
        ref={ref}
        className={cn(
          "rounded-2xl border border-border bg-card p-6 text-card-foreground",
          className
        )}
        {...props}
      >
        <blockquote className="text-sm leading-relaxed text-muted-foreground">
          <p>“{quote}”</p>
        </blockquote>
        <figcaption className="mt-4 flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary"
          >
            {name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
        </figcaption>
      </figure>
    );
  }
);
TestimonialCard.displayName = "TestimonialCard";

export { TestimonialCard };
