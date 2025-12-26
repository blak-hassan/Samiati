import React from 'react';
import { Screen } from '@/types';

interface Props {
  navigate: (screen: Screen, params?: any) => void;
  goBack: () => void;
}

const NewContactScreen: React.FC<Props> = ({ navigate, goBack }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-background-dark">
      <header className="flex items-center p-4 bg-background-light dark:bg-surface-dark border-b border-stone-200 dark:border-white/5 sticky top-0 z-10">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="flex-1 text-xl font-bold text-stone-900 dark:text-white ml-2">New contact</h1>
        <button onClick={() => navigate(Screen.PEOPLE_TO_FOLLOW)} className="font-bold text-primary px-2">Save</button>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-stone-400 text-2xl w-8 text-center">person</span>
                <input 
                    type="text" 
                    placeholder="First name" 
                    className="flex-1 bg-transparent border-b border-stone-300 dark:border-white/20 py-2 text-stone-900 dark:text-white focus:border-primary outline-none placeholder-stone-400"
                />
            </div>
            <div className="flex items-center gap-4">
                <div className="w-8"></div>
                <input 
                    type="text" 
                    placeholder="Last name" 
                    className="flex-1 bg-transparent border-b border-stone-300 dark:border-white/20 py-2 text-stone-900 dark:text-white focus:border-primary outline-none placeholder-stone-400"
                />
            </div>
        </div>

        <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-stone-400 text-2xl w-8 text-center">call</span>
            <div className="flex-1 flex gap-2">
                 <div className="w-20 border-b border-stone-300 dark:border-white/20 py-2 text-stone-900 dark:text-white flex items-center justify-between cursor-pointer">
                     <span>KE +254</span>
                     <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                 </div>
                 <input 
                    type="tel" 
                    placeholder="Phone" 
                    className="flex-1 bg-transparent border-b border-stone-300 dark:border-white/20 py-2 text-stone-900 dark:text-white focus:border-primary outline-none placeholder-stone-400"
                />
            </div>
        </div>
        
        <div className="flex items-center gap-4">
             <div className="w-8"></div>
             <p className="text-xs text-stone-500 dark:text-text-muted">Label: <span className="font-bold text-primary cursor-pointer">Mobile</span></p>
        </div>

        <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-stone-400 text-2xl w-8 text-center">mail</span>
            <input 
                type="email" 
                placeholder="Email" 
                className="flex-1 bg-transparent border-b border-stone-300 dark:border-white/20 py-2 text-stone-900 dark:text-white focus:border-primary outline-none placeholder-stone-400"
            />
        </div>

        <button className="w-full text-primary font-bold text-left py-2 hover:bg-stone-50 dark:hover:bg-white/5 rounded-lg transition-colors">
            Add more fields
        </button>
      </main>
    </div>
  );
};

export default NewContactScreen;
