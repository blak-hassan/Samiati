
import React from 'react';
import { Screen } from '@/types';

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
}

const SettingsAboutScreen: React.FC<Props> = ({ navigate, goBack }) => {
  const handleRateUs = () => {
    alert("Thank you for rating us! ⭐️⭐️⭐️⭐️⭐️");
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-[#2b1e19] transition-colors duration-300">
      <header className="flex items-center p-4 sticky top-0 bg-stone-50 dark:bg-[#2b1e19] z-10">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-stone-900 dark:text-white ml-2">About</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <div className="w-24 h-24 bg-[#cf6317] rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl transform rotate-3">
            <span className="material-symbols-outlined text-6xl">diversity_2</span>
        </div>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-1">Samiati</h2>
        <p className="text-stone-500 dark:text-[#A8A29E] mb-8">Version 1.0.0</p>

        <div className="w-full bg-white dark:bg-[#42342b] rounded-2xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden mb-6">
            {[
                { label: 'Terms of Service', icon: 'description', action: () => navigate(Screen.TERMS_OF_SERVICE) },
                { label: 'Privacy Policy', icon: 'policy', action: () => navigate(Screen.PRIVACY_POLICY) },
                { label: 'Rate Us', icon: 'star', action: handleRateUs }
            ].map((item, idx) => (
                <button 
                    key={idx} 
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors border-b border-stone-100 dark:border-white/5 last:border-0"
                >
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-stone-400 dark:text-[#A8A29E]">{item.icon}</span>
                        <span className="font-medium text-stone-900 dark:text-[#FAFAF9]">{item.label}</span>
                    </div>
                    <span className="material-symbols-outlined text-stone-400 dark:text-[#A8A29E]">chevron_right</span>
                </button>
            ))}
        </div>

        <p className="text-center text-xs text-stone-400 dark:text-white/20 px-8 leading-relaxed">
            © 2023 Samiati Inc. Built with love to preserve culture and connect communities.
        </p>
      </main>
    </div>
  );
};

export default SettingsAboutScreen;
