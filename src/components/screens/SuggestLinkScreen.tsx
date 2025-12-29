"use client";
import React, { useState } from 'react';
import { Screen } from '@/types';

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
}

const SuggestLinkScreen: React.FC<Props> = ({ goBack }) => {
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      goBack();
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark relative transition-colors duration-300">
      <header className="flex items-center p-4 bg-background-light dark:bg-background-dark text-stone-900 dark:text-white border-b border-stone-200 dark:border-white/5 transition-colors">
        <button onClick={goBack} className="p-2 -ml-2"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="flex-1 text-center text-lg font-bold">Suggest a Link</h2>
        <button onClick={handleSubmit} className="text-primary font-bold">Submit</button>
      </header>

      <main className="flex-1 p-4 flex flex-col">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-2 pt-4">Share a Story</h1>
        <p className="text-stone-600 dark:text-text-muted mb-6">Found an interesting story? Paste the link below to suggest it to the community.</p>

        <div className="flex-1">
          <label className="block text-base font-medium text-stone-900 dark:text-white mb-2">Link URL</label>
          <input type="text" placeholder="https://example.com/story" className="w-full bg-white dark:bg-[#32241a] border border-stone-300 dark:border-[#654834] rounded-xl p-4 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors" />
        </div>
      </main>

      {/* Toast */}
      <div className={`absolute bottom-6 left-4 right-4 bg-stone-800 dark:bg-[#5D4037] text-white dark:text-[#F5F5DC] p-4 rounded-lg shadow-lg flex items-center gap-3 transition-opacity duration-300 ${showToast ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <span className="material-symbols-outlined">check_circle</span>
        <span className="text-sm font-medium">Suggestion submitted. Thank you!</span>
      </div>
    </div>
  );
};

export default SuggestLinkScreen;

