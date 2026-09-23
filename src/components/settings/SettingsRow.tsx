"use client";

import React from "react";
import { ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsRowProps {
  icon: React.ReactNode;
  iconClassName?: string;
  label: string;
  description?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  destructive?: boolean;
  requiresPrivacy?: boolean;
  as?: "button" | "a";
  className?: string;
}

const SettingsRow = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, SettingsRowProps>(
  function SettingsRow(
    { icon, iconClassName, label, description, trailing, onClick, href, destructive, requiresPrivacy, className },
    ref,
  ) {
    const content = (
      <>
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
            destructive
              ? "bg-destructive/10 text-destructive"
              : iconClassName ?? "bg-primary/10 text-primary",
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <p className={cn("text-sm font-bold tracking-tight", destructive ? "text-destructive" : "text-foreground")}>{label}</p>
            {requiresPrivacy && <Lock className="w-3 h-3 text-muted-foreground shrink-0" aria-label="Affects privacy" />}
          </div>
          {description && <p className="text-xs text-muted-foreground font-medium mt-0.5">{description}</p>}
        </div>
        {trailing ?? (onClick || href ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0" />
        ) : null)}
      </>
    );

    const baseClass = cn(
      "group w-full flex items-center gap-3 px-4 min-h-14 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:bg-muted/30",
      className,
    );

    if (href) {
      return (
        <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={baseClass}>
          {content}
        </a>
      );
    }
    return (
      <button ref={ref as React.Ref<HTMLButtonElement>} type="button" onClick={onClick} className={baseClass}>
        {content}
      </button>
    );
  },
);

export default SettingsRow;
