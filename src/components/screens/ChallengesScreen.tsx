
import React from 'react';
import { Screen } from '@/types';

interface Props {
    navigate: (screen: Screen, params?: any) => void;
    goBack: () => void;
}

const ChallengesScreen: React.FC<Props> = ({ navigate, goBack }) => {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-background-dark p-4">
            <header className="flex items-center mb-4">
                <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold ml-2 text-stone-900 dark:text-white">Challenges</h1>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center text-stone-500">
                <span className="material-symbols-outlined text-4xl mb-2">emoji_events</span>
                <p>Active Challenges will appear here.</p>
                <button
                    onClick={() => navigate(Screen.CONTRIBUTIONS, { initialTab: 'Challenges' })}
                    className="mt-4 text-primary font-bold hover:underline"
                >
                    View all in Contributions
                </button>
            </div>
        </div>
    );
};

export default ChallengesScreen;
