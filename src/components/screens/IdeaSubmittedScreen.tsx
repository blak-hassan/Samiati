
import React from 'react';
import { NavigateFn, Screen } from '@/types';

interface Props {
    navigate: NavigateFn;
}

const IdeaSubmittedScreen: React.FC<Props> = ({ navigate }) => {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-[#FAF9F6] dark:bg-[#2b1e19] p-6 text-center transition-colors duration-300 font-display">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                <span className="material-symbols-outlined text-5xl text-green-600 dark:text-green-400">check_circle</span>
            </div>

            <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white mb-2">Asante!</h1>
            <p className="text-lg text-stone-600 dark:text-[#A8A29E] mb-8 max-w-sm">
                Your contribution has been received. The community will review it shortly.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                    onClick={() => navigate(Screen.CONTRIBUTIONS, { initialTab: 'Challenges' })}
                    className="w-full bg-[#cf6317] hover:bg-[#b05210] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
                >
                    Find More Projects
                </button>
                <button
                    onClick={() => navigate(Screen.HOME_CHAT)}
                    className="w-full bg-transparent text-stone-500 hover:text-stone-900 dark:hover:text-white font-bold py-3 transition-colors"
                >
                    Return Home
                </button>
            </div>
        </div>
    );
};

export default IdeaSubmittedScreen;
