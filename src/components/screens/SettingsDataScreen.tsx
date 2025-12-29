"use client";

import React, { useState } from 'react';

interface Props {
  goBack: () => void;
}

const Toggle = ({ label, checked, onChange, description }: { label: string, checked: boolean, onChange: () => void, description?: string }) => (
    <div className="flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors border-b border-stone-100 dark:border-white/5 last:border-0 cursor-pointer" onClick={onChange}>
        <div className="flex flex-col gap-0.5">
            <span className="font-medium text-stone-900 dark:text-white">{label}</span>
            {description && <span className="text-xs text-stone-500 dark:text-text-muted">{description}</span>}
        </div>
        <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 shrink-0 ${checked ? 'bg-primary' : 'bg-stone-300 dark:bg-stone-600'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </div>
    </div>
);

const SettingsDataScreen: React.FC<Props> = ({ goBack }) => {
  const [dataSaver, setDataSaver] = useState(false);
  const [highQuality, setHighQuality] = useState(true);
  const [autoDownload, setAutoDownload] = useState(true);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-background-dark transition-colors duration-300">
      <header className="flex items-center p-4 sticky top-0 bg-stone-50 dark:bg-background-dark z-10 border-stone-200 dark:border-white/5">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-stone-900 dark:text-white ml-2">Data Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        
        <div>
            <h3 className="text-xs font-bold text-stone-500 dark:text-text-muted uppercase tracking-wider mb-2 ml-2">Usage</h3>
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden">
                <Toggle 
                    label="Data Saver" 
                    description="Reduce image quality and stop autoplay videos."
                    checked={dataSaver} 
                    onChange={() => setDataSaver(!dataSaver)} 
                />
            </div>
        </div>

        <div>
            <h3 className="text-xs font-bold text-stone-500 dark:text-text-muted uppercase tracking-wider mb-2 ml-2">Media Quality</h3>
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden">
                <Toggle 
                    label="High Quality Uploads" 
                    description="Upload photos and videos in higher resolution."
                    checked={highQuality} 
                    onChange={() => setHighQuality(!highQuality)} 
                />
                <Toggle 
                    label="Auto-download Media" 
                    description="Automatically download photos on mobile data."
                    checked={autoDownload} 
                    onChange={() => setAutoDownload(!autoDownload)} 
                />
            </div>
        </div>

      </main>
    </div>
  );
};

export default SettingsDataScreen;


