'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SettingsRowProps {
  /** Stable id, matching the settings catalogue. Used for search focus. */
  id?: string;
  title: string;
  description?: string;
  /** The interactive control — a Switch, Select, Input or a link button. */
  control?: React.ReactNode;
  /** Icon shown in the leading tile. */
  icon?: React.ReactNode;
  /** Tints the icon tile. Defaults to the accent colour. */
  tone?: 'default' | 'danger';
  /** Rendered when the value differs from its default. */
  onReset?: () => void;
  /** Show the "reset to default" affordance. */
  changed?: boolean;
  /** Renders the row as a link that navigates. */
  onClick?: () => void;
  className?: string;
}

/**
 * A single settings row: icon, label, description and a control.
 *
 * T3Chat uses the same primitive (`SettingsRow` in `settingsLayout.tsx`) for
 * every setting, which is what makes the per-setting "reset to default"
 * button and the consistent spacing possible. Samiati previously hand-rolled
 * this markup in every screen, so the reset affordance had nowhere to live.
 */
const SettingsRow: React.FC<SettingsRowProps> = ({
  id,
  title,
  description,
  control,
  icon,
  tone = 'default',
  onReset,
  changed = false,
  onClick,
  className,
}) => {
  const isInteractive = typeof onClick === 'function';

  const content = (
    <>
      {icon ? (
        <div
          className={cn(
            'w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors duration-200',
            tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          )}
        >
          {icon}
        </div>
      ) : null}

      <div className="flex-1 min-w-[min(100%,10rem)] text-left">
        <p
          className={cn(
            'text-sm font-bold tracking-tight',
            tone === 'danger' ? 'text-destructive' : 'text-foreground'
          )}
        >
          {title}
        </p>
        {description ? (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        ) : null}
      </div>

      {control ? (
        <div className="min-w-0 max-w-full shrink-0 flex items-center gap-2">{control}</div>
      ) : null}

      {changed && onReset ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onReset();
          }}
          aria-label={`Reset ${title} to default`}
          title={`Reset ${title} to default`}
          className="shrink-0 w-11 h-11 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      ) : null}
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        id={id}
        onClick={onClick}
        data-slot="settings-row"
        className={cn(
          'w-full flex flex-wrap sm:flex-nowrap items-center gap-3 p-4 hover:bg-muted/30 transition-colors duration-200 group text-left',
          className
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      id={id}
      data-slot="settings-row"
      className={cn('w-full flex flex-wrap sm:flex-nowrap items-center gap-3 p-4 group', className)}
    >
      {content}
    </div>
  );
};

export default SettingsRow;
