"use client";

import React, { useState } from 'react';
import { Screen } from '@/types';

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
}

const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
    <div className="flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors border-b border-stone-100 dark:border-white/5 last:border-0 cursor-pointer" onClick={onChange}>
        <span className="font-medium text-stone-900 dark:text-white">{label}</span>
        <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${checked ? 'bg-primary' : 'bg-stone-300 dark:bg-stone-600'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </div>
    </div>
);

const SettingsNotificationsScreen: React.FC<Props> = ({ goBack }) => {
  const [pauseAll, setPauseAll] = useState(false);
  
  // Specific Categories
  const [changa, setChanga] = useState(true);
  const [moderation, setModeration] = useState(true);
  const [mushenee, setMushenee] = useState(true);
  const [watu, setWatu] = useState(true);
  
  const [emailDigest, setEmailDigest] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-background-dark transition-colors duration-300">
      <header className="flex items-center p-4 sticky top-0 bg-stone-50 dark:bg-background-dark z-10 border-stone-200 dark:border-white/5">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-stone-900 dark:text-white ml-2">Notifications</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden">
            <Toggle label="Pause All" checked={pauseAll} onChange={() => setPauseAll(!pauseAll)} />
        </div>

        <div className={`space-y-6 transition-opacity duration-300 ${pauseAll ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div>
                <h3 className="text-xs font-bold text-stone-500 dark:text-text-muted uppercase tracking-wider mb-2 ml-2">Notification Categories</h3>
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden">
                    <Toggle label="Changa" checked={changa} onChange={() => setChanga(!changa)} />
                    <Toggle label="Moderation" checked={moderation} onChange={() => setModeration(!moderation)} />
                    <Toggle label="Mushenee" checked={mushenee} onChange={() => setMushenee(!mushenee)} />
                    <Toggle label="Watu" checked={watu} onChange={() => setWatu(!watu)} />
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold text-stone-500 dark:text-text-muted uppercase tracking-wider mb-2 ml-2">Email</h3>
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden">
                    <Toggle label="Weekly Digest" checked={emailDigest} onChange={() => setEmailDigest(!emailDigest)} />
                    <div className="p-4 text-xs text-stone-500 dark:text-text-muted bg-stone-50 dark:bg-black/20">
                        Receive a weekly summary of top stories and community highlights.
                    </div>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default SettingsNotificationsScreen;


