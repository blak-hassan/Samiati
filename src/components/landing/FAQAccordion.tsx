"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;
        return (
          <div
            key={index}
            className="rounded-xl border border-border bg-card"
          >
            <h3 className="m-0">
              {/* Visible keyboard focus — the bare button had no focus ring,
                  so tabbing through the FAQ gave no indication of position. */}
              <button
                id={buttonId}
                type="button"
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-3 rounded-xl p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span className="text-sm font-semibold">{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
            </h3>
            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed animate-fade-in-up"
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
