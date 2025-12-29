"use client";

import React, { useState } from 'react';

interface Props {
  goBack: () => void;
}

const SettingsMutedScreen: React.FC<Props> = ({ goBack }) => {
  const [mutedWords, setMutedWords] = useState(['spoilers', 'politics', 'crypto']);
  const [newWord, setNewWord] = useState('');

  const handleAddWord = () => {
    if (newWord.trim() && !mutedWords.includes(newWord.trim().toLowerCase())) {
      setMutedWords([...mutedWords, newWord.trim().toLowerCase()]);
      setNewWord('');
    }
  };

  const handleDelete = (word: string) => {
    setMutedWords(mutedWords.filter(w => w !== word));
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-background-dark transition-colors duration-300">
      <header className="flex items-center p-4 sticky top-0 bg-stone-50 dark:bg-background-dark z-10 border-stone-200 dark:border-white/5">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-stone-900 dark:text-white ml-2">Muted Words</h1>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <div className="flex gap-2">
            <input 
                type="text" 
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Add word or phrase..." 
                className="flex-1 bg-white dark:bg-surface-dark border border-stone-200 dark:border-white/10 rounded-xl px-4 py-3 text-stone-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
            />
            <button 
                onClick={handleAddWord}
                disabled={!newWord.trim()}
                className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-xl font-bold transition-colors"
            >
                Add
            </button>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden">
            {mutedWords.length > 0 ? (
                mutedWords.map((word, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border-b border-stone-100 dark:border-white/5 last:border-0">
                        <span className="font-medium text-stone-900 dark:text-white">{word}</span>
                        <button onClick={() => handleDelete(word)} className="text-stone-400 hover:text-error transition-colors">
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                ))
            ) : (
                <div className="p-8 text-center text-stone-500 dark:text-text-muted">
                    No words muted.
                </div>
            )}
        </div>

        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
            <p className="text-xs text-stone-700 dark:text-stone-300">
                Posts containing these words will be hidden from your timeline. Muting is not case-sensitive.
            </p>
        </div>
      </main>
    </div>
  );
};

export default SettingsMutedScreen;


