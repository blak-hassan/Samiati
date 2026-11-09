'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SettingsSectionProps {
  /** Section heading. */
  title: string;
  description?: string;
  children: React.ReactNode;
  /**
   * Collapses the section behind an "Advanced" disclosure.
   * T3Chat uses the same pattern to keep rarely-used toggles out of the way.
   */
  advanced?: boolean;
  className?: string;
}

/**
 * Groups related settings under a heading inside a bordered card.
 */
const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  children,
  advanced = false,
  className,
}) => {
  const [expanded, setExpanded] = useState(!advanced);

  if (advanced && !expanded) {
    return (
      <div className={cn('space-y-2', className)}>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          className="w-full flex items-center justify-between min-h-11 px-2 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          {title}
          <ChevronDown className="w-4 h-4 -rotate-90" />
        </button>
      </div>
    );
  }

  return (
    <section className={cn('space-y-2', className)}>
      <div className="px-2">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        {description ? <p className="text-xs text-muted-foreground mt-0.5">{description}</p> : null}
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-none divide-y divide-border">
        {children}
      </div>
      {advanced ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-expanded={true}
          className="w-full flex items-center justify-center gap-1.5 min-h-11 px-2 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          Hide advanced
          <ChevronDown className="w-4 h-4 rotate-180" />
        </button>
      ) : null}
    </section>
  );
};

export default SettingsSection;
