'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSettings } from '@/hooks/useSettings';
import { SETTINGS_CATALOG } from '@/lib/settings';

export interface RestoreDefaultsButtonProps {
  /** Labels of the settings that would be reset. */
  changedLabels: string[];
  onRestore: () => void;
  className?: string;
}

/**
 * "Restore defaults" for the settings on this screen.
 *
 * T3Chat surfaces the list of changed settings and lets the user reset all of
 * them in one action. Samiati had no way to undo a setting change.
 */
const RestoreDefaultsButton: React.FC<RestoreDefaultsButtonProps> = ({
  changedLabels,
  onRestore,
  className,
}) => {
  const [open, setOpen] = React.useState(false);

  if (changedLabels.length === 0) return null;

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className={`min-h-11 rounded-xl text-xs font-bold text-muted-foreground hover:text-primary gap-1.5 ${className ?? ''}`}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Restore defaults
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore default settings?</AlertDialogTitle>
            <AlertDialogDescription>
              {changedLabels.length === 1
                ? `“${changedLabels[0]}” will go back to its default value.`
                : `${changedLabels.length} settings will go back to their default values: ${changedLabels.join(', ')}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onRestore();
                setOpen(false);
              }}
            >
              Restore defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/**
 * Maps the changed device-setting keys to their human-readable labels using
 * the settings catalogue.
 */
export function useChangedLabels(): string[] {
  const { changedKeys } = useSettings();
  return changedKeys.map((key) => {
    const entry = SETTINGS_CATALOG.find(
      (candidate) => candidate.scope === 'device' && candidate.key === key
    );
    return entry?.title ?? key;
  });
}

export default RestoreDefaultsButton;
