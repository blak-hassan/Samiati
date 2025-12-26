import React from 'react';
import { Screen } from '@/types';

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
}

const SuggestChallengeScreen: React.FC<Props> = ({ navigate, goBack }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <header className="flex items-center p-4 sticky top-0 bg-background-light dark:bg-background-dark z-10 border-b border-black/5 dark:border-white/5">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white"><span className="material-symbols-outlined">close</span></button>
        <h2 className="flex-1 text-center text-lg font-bold text-stone-900 dark:text-white pr-8">Suggest a Challenge Idea</h2>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <div>
          <label className="block text-base font-medium text-stone-900 dark:text-white mb-2">Challenge Idea Title</label>
          <input type="text" placeholder="Enter a short, catchy title" className="w-full bg-white dark:bg-[#32241a] border border-stone-300 dark:border-[#654834] rounded-xl p-4 text-stone-900 dark:text-white placeholder-stone-500 dark:placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
        </div>

        <div>
          <label className="block text-base font-medium text-stone-900 dark:text-white mb-2">Describe Your Challenge Idea</label>
          <textarea rows={6} placeholder="Explain the details, rules, and goals here..." className="w-full bg-white dark:bg-[#32241a] border border-stone-300 dark:border-[#654834] rounded-xl p-4 text-stone-900 dark:text-white placeholder-stone-500 dark:placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"></textarea>
        </div>

        <div>
          <label className="block text-base font-medium text-stone-900 dark:text-white mb-2">Why is this important for the community? (Optional)</label>
          <textarea rows={4} placeholder="Share your thoughts..." className="w-full bg-white dark:bg-[#32241a] border border-stone-300 dark:border-[#654834] rounded-xl p-4 text-stone-900 dark:text-white placeholder-stone-500 dark:placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"></textarea>
        </div>

        <p className="text-stone-600 dark:text-text-muted text-sm">Thank you for your suggestion! All ideas are reviewed by our team before they are considered for a future challenge.</p>

        <div className="pt-4 space-y-3">
          <button onClick={() => navigate(Screen.IDEA_SUBMITTED)} className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors">
            Submit Idea
          </button>
          <button onClick={goBack} className="w-full py-3.5 bg-transparent text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors">
            Cancel
          </button>
        </div>
      </main>
    </div>
  );
};

export default SuggestChallengeScreen;
