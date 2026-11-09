'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SettingsSelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export interface SettingsSelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SettingsSelectOption<T>[];
  /** Accessible label for the control. */
  label: string;
  className?: string;
}

/**
 * A styled native select.
 *
 * The project does not ship `@radix-ui/react-select`, so this uses the native
 * control — it keeps full keyboard and screen-reader support and works on
 * mobile, where T3Chat's custom listbox would need extra work.
 */
function SettingsSelect<T extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
}: SettingsSelectProps<T>) {
  return (
    <div className={cn('relative', className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onValueChange(event.target.value as T)}
        className="appearance-none min-h-11 w-full min-w-[9rem] pl-3 pr-8 rounded-xl bg-muted/50 border border-border text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    </div>
  );
}

export default SettingsSelect;
