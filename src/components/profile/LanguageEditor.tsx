"use client";

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSkill } from '@/types';
import {
  AVAILABLE_LANGUAGES,
  LANGUAGE_LEVELS,
  LANGUAGE_LEVEL_META,
  getLanguagePercent,
} from '@/lib/languages';
import { cn } from '@/lib/utils';

export interface LanguageEditorProps {
  languages: LanguageSkill[];
  onChange: (languages: LanguageSkill[]) => void;
  /** Languages offered in the "add" picker. */
  available?: string[];
  className?: string;
}

/**
 * The one editor for a user's languages.
 *
 * The profile, edit-profile and manage-languages screens each had their own
 * version of this, using two different proficiency vocabularies. This is the
 * shared implementation, and it always writes the levels the data model
 * actually stores.
 */
const LanguageEditor: React.FC<LanguageEditorProps> = ({
  languages,
  onChange,
  available = AVAILABLE_LANGUAGES,
  className,
}) => {
  const [newLanguage, setNewLanguage] = useState('');

  const options = available.filter(
    (name) => !languages.some((language) => language.name === name)
  );

  const handleAdd = () => {
    const name = newLanguage;
    if (!name) return;
    onChange([
      ...languages,
      {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        level: 'Learning',
        percent: getLanguagePercent('Learning'),
      },
    ]);
    setNewLanguage('');
  };

  const handleLevelChange = (id: string, level: LanguageSkill['level']) => {
    onChange(
      languages.map((language) =>
        language.id === id
          ? { ...language, level, percent: getLanguagePercent(level) }
          : language
      )
    );
  };

  const handleRemove = (id: string) => {
    onChange(languages.filter((language) => language.id !== id));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {languages.length === 0 ? (
        <p className="text-sm text-muted-foreground px-4 py-6 text-center">
          No languages added yet.
        </p>
      ) : (
        languages.map((language) => (
          <div
            key={language.id}
            className="rounded-2xl border border-border/50 bg-muted/10 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {LANGUAGE_LEVEL_META[language.level]?.icon} {language.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {LANGUAGE_LEVEL_META[language.level]?.description ?? language.level}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(language.id)}
                aria-label={`Remove ${language.name}`}
                className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-1 rounded-xl bg-muted/60 p-1" role="group" aria-label={`Proficiency for ${language.name}`}>
              {LANGUAGE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleLevelChange(language.id, level)}
                  aria-pressed={language.level === level}
                  className={cn(
                    'flex-1 h-8 rounded-lg text-[11px] font-bold transition-all',
                    language.level === level
                      ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {options.length > 0 ? (
        <div className="flex gap-2">
          <select
            value={newLanguage}
            onChange={(event) => setNewLanguage(event.target.value)}
            aria-label="Add a language"
            className="flex-1 h-11 px-4 rounded-xl bg-muted/40 border border-border/60 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors"
          >
            <option value="">Add a language…</option>
            {options.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!newLanguage}
            className="h-11 px-4 rounded-xl font-bold gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default LanguageEditor;
