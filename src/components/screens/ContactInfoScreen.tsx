
import React from 'react';
import { Screen } from '@/types';

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  chatUser: {
    name: string;
    avatar: string;
    isOnline: boolean;
  };
}

const ContactInfoScreen: React.FC<Props> = ({ navigate, goBack, chatUser }) => {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-background-dark transition-colors duration-300">
      {/* Nav */}
      <header className="flex items-center p-4 sticky top-0 bg-stone-50 dark:bg-background-dark z-10">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white rounded-full hover:bg-stone-200 dark:hover:bg-white/10">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1"></div>
        <button className="p-2 -mr-2 text-stone-900 dark:text-white rounded-full hover:bg-stone-200 dark:hover:bg-white/10">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-8">
        <div className="flex flex-col items-center pt-4 pb-8">
            <img src={chatUser.avatar} alt={chatUser.name} className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-white dark:border-white/10 shadow-lg" />
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-1">{chatUser.name}</h1>
            <p className="text-stone-500 dark:text-text-muted text-lg">+254 712 345 678</p>
        </div>

        <div className="grid grid-cols-3 gap-4 px-6 mb-8">
            <button onClick={() => navigate(Screen.VOICE_CALL)} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-stone-100 dark:border-white/5 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl">call</span>
                <span className="text-xs font-bold text-stone-700 dark:text-white">Audio</span>
            </button>
            <button onClick={() => navigate(Screen.VIDEO_CALL)} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-stone-100 dark:border-white/5 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl">videocam</span>
                <span className="text-xs font-bold text-stone-700 dark:text-white">Video</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-stone-100 dark:border-white/5 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl">search</span>
                <span className="text-xs font-bold text-stone-700 dark:text-white">Search</span>
            </button>
        </div>

        <div className="bg-white dark:bg-surface-dark shadow-sm border-y border-stone-100 dark:border-white/5 mb-4">
            <div className="p-4">
                <p className="text-base text-stone-900 dark:text-white mb-1">Hey there! I am using Samiati.</p>
                <p className="text-xs text-stone-500 dark:text-text-muted">Oct 24, 2023</p>
            </div>
        </div>

        <div className="bg-white dark:bg-surface-dark shadow-sm border-y border-stone-100 dark:border-white/5 mb-4">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5">
                <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-stone-500 dark:text-text-muted">notifications</span>
                    <span className="text-stone-900 dark:text-white font-medium">Mute notifications</span>
                </div>
                <div className="w-10 h-5 bg-stone-300 dark:bg-stone-600 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                </div>
            </div>
            <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 border-t border-stone-100 dark:border-white/5">
                <span className="material-symbols-outlined text-stone-500 dark:text-text-muted">music_note</span>
                <span className="text-stone-900 dark:text-white font-medium">Custom notifications</span>
            </div>
            <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 border-t border-stone-100 dark:border-white/5">
                <span className="material-symbols-outlined text-stone-500 dark:text-text-muted">image</span>
                <span className="text-stone-900 dark:text-white font-medium">Media visibility</span>
            </div>
        </div>

        <div className="bg-white dark:bg-surface-dark shadow-sm border-y border-stone-100 dark:border-white/5 mb-8">
            <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 text-error">
                <span className="material-symbols-outlined">block</span>
                <span className="font-medium">Block {chatUser.name}</span>
            </div>
            <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 text-error border-t border-stone-100 dark:border-white/5">
                <span className="material-symbols-outlined">thumb_down</span>
                <span className="font-medium">Report {chatUser.name}</span>
            </div>
        </div>
      </main>
    </div>
  );
};

export default ContactInfoScreen;
