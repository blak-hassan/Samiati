"use client";

import React, { useState } from 'react';
import { Plus, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsShell from '@/components/settings/SettingsShell';
import { useSettings } from '@/hooks/useSettings';

/**
 * Muted words.
 *
 * The list used to live in component state, so every word was forgotten on
 * refresh. It is now part of the persisted device settings.
 */
const SettingsMutedScreen: React.FC = () => {
  const { settings, updateSetting } = useSettings();
  const [newWord, setNewWord] = useState('');
  const mutedWords = settings.mutedWords;

  const handleAddWord = () => {
    const word = newWord.trim().toLowerCase();
    if (!word || mutedWords.includes(word)) return;
    updateSetting('mutedWords', [...mutedWords, word]);
    setNewWord('');
  };

  const handleDelete = (word: string) => {
    updateSetting(
      'mutedWords',
      mutedWords.filter((muted) => muted !== word)
    );
  };

  return (
    <SettingsShell title="Muted words" activeSection="privacy">
      <div className="space-y-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newWord}
            onChange={(event) => setNewWord(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleAddWord();
            }}
            placeholder="Add word or phrase…"
            aria-label="Word or phrase to mute"
            className="flex-1 h-11 px-4 rounded-xl bg-muted/40 border border-border/60 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors"
          />
          <Button
            onClick={handleAddWord}
            disabled={!newWord.trim()}
            className="h-11 px-4 rounded-xl font-bold gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        <SettingsSection title={`Muted (${mutedWords.length})`}>
          {mutedWords.length > 0 ? (
            mutedWords.map((word) => (
              <div
                key={word}
                className="flex items-center justify-between p-4"
              >
                <span className="font-medium text-foreground">{word}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(word)}
                  aria-label={`Unmute ${word}`}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-muted-foreground text-sm">
              No words muted yet.
            </div>
          )}
        </SettingsSection>

        <p className="text-xs text-muted-foreground px-2 leading-relaxed">
          Posts containing these words will be hidden from your timeline. Muting is not
          case-sensitive.
        </p>
      </div>
    </SettingsShell>
  );
};

export default SettingsMutedScreen;
