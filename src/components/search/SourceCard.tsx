'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Source {
  title: string;
  url: string;
  snippet?: string;
}

interface SourceCardProps {
  source: Source;
  index: number;
  variant?: 'chip' | 'list';
}

export const getSourceDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
};

const SourceCard: React.FC<SourceCardProps> = ({ source, index, variant = 'chip' }) => {
  const domain = getSourceDomain(source.url);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex items-start gap-3 p-3 rounded-xl transition-all duration-200',
        'bg-card border border-border hover:bg-secondary',
        'cursor-pointer',
        variant === 'chip' ? 'min-w-[240px] max-w-[300px] shrink-0' : 'w-full'
      )}
    >
      {/* Number badge */}
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-black text-primary">{index + 1}</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Domain + favicon */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-medium text-muted-foreground truncate">{domain}</span>
          <ExternalLink aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-foreground leading-relaxed [overflow-wrap:anywhere]">
          {source.title || domain}
        </p>

        {/* Snippet */}
        {source.snippet && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed [overflow-wrap:anywhere]">
            {source.snippet}
          </p>
        )}
      </div>
    </a>
  );
};

export default SourceCard;
