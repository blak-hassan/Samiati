
import React from 'react';
import { Screen, User } from '@/types';

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  user: User;
}

const SettingsAccountScreen: React.FC<Props> = ({ navigate, goBack, user }) => {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-background-dark transition-colors duration-300">
      <header className="flex items-center p-4 sticky top-0 bg-stone-50 dark:bg-background-dark z-10 border-b border-stone-200 dark:border-white/5">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-stone-900 dark:text-white ml-2">Account</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-stone-200 dark:border-white/5 p-4 flex flex-col items-center gap-3">
            <div className="relative">
                <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover border-4 border-stone-100 dark:border-white/5" />
                <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full border-2 border-white dark:border-surface-dark">
                    <span className="material-symbols-outlined text-sm">edit</span>
                </button>
            </div>
            <div className="text-center">
                <h2 className="font-bold text-stone-900 dark:text-white text-lg">{user.name}</h2>
                <p className="text-stone-500 dark:text-text-muted text-sm">{user.handle}</p>
            </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden p-4 space-y-4">
            <div>
                <label className="text-xs font-bold text-stone-500 dark:text-text-muted uppercase mb-1 block">Username</label>
                <input type="text" value={user.handle.replace('@', '')} readOnly className="w-full bg-stone-100 dark:bg-black/20 p-3 rounded-lg text-stone-900 dark:text-white border border-transparent focus:border-primary outline-none" />
            </div>
            <div>
                <label className="text-xs font-bold text-stone-500 dark:text-text-muted uppercase mb-1 block">Email</label>
                <input type="email" value="user@example.com" readOnly className="w-full bg-stone-100 dark:bg-black/20 p-3 rounded-lg text-stone-900 dark:text-white border border-transparent focus:border-primary outline-none" />
            </div>
            <div>
                <label className="text-xs font-bold text-stone-500 dark:text-text-muted uppercase mb-1 block">Phone</label>
                <input type="tel" value="+254 712 345 678" readOnly className="w-full bg-stone-100 dark:bg-black/20 p-3 rounded-lg text-stone-900 dark:text-white border border-transparent focus:border-primary outline-none" />
            </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden">
            <button onClick={() => navigate(Screen.CHANGE_PASSWORD)} className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors border-b border-stone-100 dark:border-white/5 last:border-0">
                <span className="font-medium text-stone-900 dark:text-white">Change Password</span>
                <span className="material-symbols-outlined text-stone-400">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors border-b border-stone-100 dark:border-white/5 last:border-0">
                <span className="font-medium text-stone-900 dark:text-white">Two-Factor Authentication</span>
                <span className="text-xs text-stone-500 dark:text-text-muted">Off</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors text-error">
                <span className="font-bold">Delete Account</span>
                <span className="material-symbols-outlined">delete</span>
            </button>
        </div>
      </main>
    </div>
  );
};

export default SettingsAccountScreen;
