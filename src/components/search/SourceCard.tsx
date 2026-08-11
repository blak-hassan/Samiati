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
}

const getSourceDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

const getFaviconUrl = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return "";
  }
};

const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
  const domain = getSourceDomain(source.url);
  const favicon = getFaviconUrl(source.url);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-start gap-3 p-3 rounded-xl transition-all duration-200",
        "bg-card/40 border border-border/30 hover:bg-card/70 hover:border-border/60",
        "hover:shadow-md cursor-pointer min-w-[240px] max-w-[300px] shrink-0"
      )}
    >
      {/* Number badge */}
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-black text-primary">{index + 1}</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Domain + favicon */}
        <div className="flex items-center gap-1.5 mb-1">
          {favicon && (
            // Using img for external favicons (next/image doesn't support arbitrary external URLs)
            <img
              src={favicon}
              alt=""
              className="w-3.5 h-3.5 rounded-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
            {domain}
          </span>
          <ExternalLink className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
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
