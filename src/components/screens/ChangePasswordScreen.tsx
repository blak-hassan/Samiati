"use client";
import React, { useState } from 'react';
import { Screen } from '@/types';

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
}

const ChangePasswordScreen: React.FC<Props> = ({ goBack }) => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <header className="flex items-center p-4">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
        <h2 className="flex-1 text-left text-lg font-bold text-stone-900 dark:text-white ml-2">Change Password</h2>
      </header>

      <main className="flex-1 p-4 space-y-6 pt-6">
        <div>
          <label className="block font-medium text-stone-900 dark:text-white mb-2">Current Password</label>
          <div className="relative">
            <input 
                type={showCurrent ? "text" : "password"} 
                placeholder="Enter your current password" 
                className="w-full bg-white dark:bg-[#332619] border border-primary/30 dark:border-[#674d32] rounded-xl p-4 pr-12 text-stone-900 dark:text-white placeholder-primary/50 dark:placeholder-text-muted focus:ring-2 focus:ring-primary outline-none" 
            />
            <button 
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-4 text-primary/50 dark:text-text-muted hover:text-primary dark:hover:text-white transition-colors"
            >
                <span className="material-symbols-outlined">{showCurrent ? 'visibility' : 'visibility_off'}</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block font-medium text-stone-900 dark:text-white mb-2">New Password</label>
          <div className="relative">
            <input 
                type={showNew ? "text" : "password"} 
                placeholder="Enter your new password" 
                className="w-full bg-white dark:bg-[#332619] border border-primary/30 dark:border-[#674d32] rounded-xl p-4 pr-12 text-stone-900 dark:text-white placeholder-primary/50 dark:placeholder-text-muted focus:ring-2 focus:ring-primary outline-none" 
            />
            <button 
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-4 text-primary/50 dark:text-text-muted hover:text-primary dark:hover:text-white transition-colors"
            >
                <span className="material-symbols-outlined">{showNew ? 'visibility' : 'visibility_off'}</span>
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-primary/20 overflow-hidden"><div className="h-full w-1/3 bg-error rounded-full"></div></div>
            <div className="h-2 flex-1 rounded-full bg-primary/20"></div>
            <div className="h-2 flex-1 rounded-full bg-primary/20"></div>
            <span className="text-sm font-medium text-error">Weak</span>
          </div>
          <p className="text-sm text-primary/50 dark:text-text-muted mt-1">Use a mix of letters, numbers, and symbols.</p>
        </div>

        <div>
          <label className="block font-medium text-stone-900 dark:text-white mb-2">Confirm New Password</label>
          <div className="relative">
            <input 
                type={showConfirm ? "text" : "password"} 
                placeholder="Re-enter your new password" 
                className="w-full bg-white dark:bg-[#332619] border border-error rounded-xl p-4 pr-12 text-stone-900 dark:text-white placeholder-primary/50 dark:placeholder-text-muted focus:ring-2 focus:ring-error outline-none" 
            />
            <button 
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-4 text-primary/50 dark:text-text-muted hover:text-primary dark:hover:text-white transition-colors"
            >
                <span className="material-symbols-outlined">{showConfirm ? 'visibility' : 'visibility_off'}</span>
            </button>
          </div>
          <div className="flex items-center gap-1 mt-1 text-error text-sm">
            <span className="material-symbols-outlined text-base">error</span>
            <span>Passwords do not match</span>
          </div>
        </div>
      </main>

      <div className="p-4 bg-background-light dark:bg-background-dark space-y-3 border-t border-black/5 dark:border-white/5">
        <button className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-colors">Save Password</button>
        <button onClick={goBack} className="w-full bg-transparent border border-primary text-primary font-bold py-4 rounded-xl hover:bg-primary/5 transition-colors">Cancel</button>
      </div>
    </div>
  );
};

export default ChangePasswordScreen;

