import React from 'react';
import { Screen } from '@/types';

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
}

const AddChallengeScreen: React.FC<Props> = ({ navigate, goBack }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-stone-900 dark:text-white transition-colors duration-300">
      <header className="flex items-center p-4 sticky top-0 bg-background-light dark:bg-background-dark z-20 transition-colors">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-500 dark:text-text-muted"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="flex-1 text-center text-lg font-bold">Create Teaching Challenge</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl mb-4">
            <p className="text-sm text-stone-800 dark:text-stone-200">
                <span className="font-bold">Community Goal:</span> Mobilize the community to preserve language. Create a list of words, phrases, or topics you need help with.
            </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 dark:text-text-muted mb-2">Challenge Title</label>
          <input type="text" placeholder="e.g., The Kikuyu 100" className="w-full bg-white dark:bg-surface-dark border-2 border-stone-200 dark:border-warm-dark-brown rounded-lg p-3 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-text-muted/50 focus:border-primary focus:ring-0 outline-none transition-colors" />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 dark:text-text-muted mb-2">Challenge Type</label>
          <div className="relative">
            <select className="w-full bg-white dark:bg-surface-dark border-2 border-primary rounded-lg p-3 text-stone-900 dark:text-white appearance-none focus:border-primary focus:ring-0 outline-none transition-colors font-medium">
              <option disabled selected>Select a goal...</option>
              <option>Translation Drive (Word List)</option>
              <option>Phrase Collection (Sentences)</option>
              <option>Dialect Recording (Audio)</option>
              <option>Proverb Hunt (Cultural)</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-3.5 text-stone-500 dark:text-text-muted pointer-events-none">expand_more</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 dark:text-text-muted mb-2">Source Material / Description</label>
          <textarea rows={3} placeholder="Paste the list of words you want translated, or describe the topic..." className="w-full bg-white dark:bg-surface-dark border-2 border-stone-200 dark:border-warm-dark-brown rounded-lg p-3 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-text-muted/50 focus:border-primary focus:ring-0 outline-none resize-none transition-colors"></textarea>
          <p className="mt-1.5 text-xs text-stone-500 dark:text-text-muted">This will be shown to users when they contribute.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 dark:text-text-muted mb-2">Target Language</label>
            <input type="text" placeholder="e.g. Kikuyu" className="w-full bg-white dark:bg-surface-dark border-2 border-stone-200 dark:border-warm-dark-brown rounded-lg p-3 text-stone-900 dark:text-white focus:border-primary focus:ring-0 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 dark:text-text-muted mb-2">XP Reward</label>
            <input type="number" placeholder="50" className="w-full bg-white dark:bg-surface-dark border-2 border-stone-200 dark:border-warm-dark-brown rounded-lg p-3 text-stone-900 dark:text-white focus:border-primary focus:ring-0 outline-none transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 dark:text-text-muted mb-2">Upload Banner</label>
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-stone-300 dark:border-warm-dark-brown bg-white dark:bg-surface-dark rounded-lg cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
            <div className="flex flex-col items-center justify-center pt-2 pb-3">
              <span className="material-symbols-outlined text-stone-400 dark:text-text-muted text-2xl mb-1">add_photo_alternate</span>
              <p className="text-xs text-stone-500 dark:text-text-muted">Upload cover image</p>
            </div>
            <input type="file" className="hidden" />
          </label>
        </div>
      </main>

      <footer className="sticky bottom-0 z-20 bg-background-light dark:bg-background-dark p-4 space-y-3 border-t border-stone-200 dark:border-white/5 transition-colors">
        <button onClick={() => navigate(Screen.CHALLENGE_CREATED)} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-lg transition-colors flex justify-center items-center gap-2">
          <span className="material-symbols-outlined">rocket_launch</span>
          Launch Challenge
        </button>
      </footer>
    </div>
  );
};

export default AddChallengeScreen;
