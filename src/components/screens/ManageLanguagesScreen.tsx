"use client";

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Save, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/shared/NotificationBell';
import SettingsSection from '@/components/settings/SettingsSection';
import LanguageEditor from '@/components/profile/LanguageEditor';
import { NavigateFn, LanguageSkill } from '@/types';

interface Props {
  navigate: NavigateFn;
  goBack: () => void;
  unreadCount?: number;
  languages: LanguageSkill[];
  /** Persists the language list. Rejects with a message when the save fails. */
  onSave: (languages: LanguageSkill[]) => Promise<void>;
}

/**
 * Manage the languages on your profile.
 *
 * The old version only updated local component state — in production that
 * meant the list was thrown away on the next render. It now shares the
 * language editor with the edit-profile screen and saves through the
 * `updateProfile` mutation.
 */
const ManageLanguagesScreen: React.FC<Props> = ({
  navigate,
  goBack,
  unreadCount = 0,
  languages,
  onSave,
}) => {
  const [saved, setSaved] = useState<LanguageSkill[]>(languages);
  const [draft, setDraft] = useState<LanguageSkill[]>(languages);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  const handleSave = async () => {
    if (!isDirty || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setSaved(draft);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your languages.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <header className="flex items-center px-4 h-14 sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground ml-2 tracking-tight">Languages</h1>
        <div className="ml-auto flex items-center gap-2">
          {isDirty ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full">
              Unsaved
            </span>
          ) : null}
          <NotificationBell unreadCount={unreadCount} onNavigate={navigate} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 px-4 sm:px-6 py-6 max-w-3xl w-full mx-auto space-y-8">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4"
          >
            <p className="text-sm font-bold text-destructive">{error}</p>
          </div>
        ) : null}

        {savedAt && !isDirty && !error ? (
          <div
            role="status"
            className="flex items-center gap-3 rounded-2xl border border-rasta-green/30 bg-rasta-green/5 p-4"
          >
            <Check className="w-5 h-5 text-rasta-green shrink-0" />
            <p className="text-sm font-bold text-foreground">Your languages have been updated.</p>
          </div>
        ) : null}

        <SettingsSection
          title="Your languages"
          description="Add the languages you speak and set your level in each. These appear on your profile and drive the translation suggestions you get."
        >
          <div className="p-4">
            <LanguageEditor languages={draft} onChange={setDraft} />
          </div>
        </SettingsSection>
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-md border-t border-border z-40 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex-1 h-12 rounded-2xl font-bold gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving…' : 'Save Languages'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setDraft(saved)}
            disabled={!isDirty || isSaving}
            className="h-12 rounded-2xl px-5 font-bold gap-2 text-muted-foreground disabled:opacity-50"
          >
            <Undo2 className="w-4 h-4" />
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManageLanguagesScreen;
