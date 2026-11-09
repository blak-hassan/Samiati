"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export interface SettingsFieldProps {
  title: string;
  description?: string;
  /** Id of the control, so the label can be associated with it. */
  htmlFor?: string;
  /** The control — an input, textarea, select or editor. */
  children: React.ReactNode;
  /** Extra content shown under the control, e.g. a character counter. */
  hint?: React.ReactNode;
  /** Validation message. */
  error?: string;
  className?: string;
}

/**
 * A labelled form field.
 *
 * `SettingsRow` puts the control on the right, which works for switches and
 * selects but not for text inputs. This is the stacked variant T3Chat uses
 * for anything the user types into.
 */
const SettingsField: React.FC<SettingsFieldProps> = ({
  title,
  description,
  htmlFor,
  children,
  hint,
  error,
  className,
}) => {
  return (
    <div className={cn('p-4 space-y-2', className)}>
      <div>
        <label
          htmlFor={htmlFor}
          className="text-sm font-bold tracking-tight text-foreground block"
        >
          {title}
        </label>
        {description ? (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <div className="text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
};

export default SettingsField;
