"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Source {
  title: string;
  url: string;
  snippet?: string;
}

interface SourceCardProps {
  source: Source;
  index: number;
  variant?: "chip" | "list";
}

export const getSourceDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

// A favicon badge derived locally from the domain's first letter.
//
// This used to request `https://www.google.com/s2/favicons?domain=…` per
// source, which (a) leaked every visited source domain to Google — awkward for
// a product whose landing page advertises "we never sell your information" and
// has a full cookie-consent flow, (b) added a blocking third-party request per
// citation, and (c) made the CSP brittle. A local letter badge is instant,
// dependency-free and privacy-safe.
const getDomainInitial = (domain: string): string =>
  (domain.replace(/^www\./, "")[0] ?? "?").toUpperCase();

const SourceCard: React.FC<SourceCardProps> = ({ source, index, variant = "chip" }) => {
  const domain = getSourceDomain(source.url);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-start gap-3 p-3 rounded-xl transition-all duration-200",
        "bg-card/40 border border-border/30 hover:bg-card/70 hover:border-border/60",
        "hover:shadow-md cursor-pointer",
        variant === "chip" ? "min-w-[240px] max-w-[300px] shrink-0" : "w-full"
      )}
    >
      {/* Number badge */}
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-black text-primary">{index + 1}</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Domain + initial badge */}
        <div className="flex items-center gap-1.5 mb-1">
          {/* Decorative — the adjacent domain text conveys the information. */}
          <span
            aria-hidden="true"
            className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm bg-primary/15 text-[9px] font-black leading-none text-primary"
          >
            {getDomainInitial(domain)}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
            {domain}
          </span>
          <ExternalLink className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors shrink-0" aria-hidden="true" />
        </div>

        {/* Title */}
        <p className="text-xs font-bold text-foreground truncate leading-tight">
          {source.title || domain}
        </p>

        {/* Snippet */}
        {source.snippet && (
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {source.snippet}
          </p>
        )}
      </div>
    </a>
  );
};

export default SourceCard;
