"use client";

import React from 'react';
import { NavigateFn, Screen } from '@/types';
import { IconRenderer } from '@/components/shared/IconRenderer';

interface Props {
    navigate: NavigateFn;
    goBack: () => void;
}

const MessagesScreen: React.FC<Props> = ({ goBack }) => {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-stone-50 dark:bg-background-dark text-stone-900 dark:text-text-main transition-colors duration-300">
            <header className="flex items-center p-4 bg-white dark:bg-[#2B1F1C] justify-between transition-colors shrink-0">
                <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white"><IconRenderer name="arrow_back" size={24} /></button>
                <h1 className="flex-1 text-center text-lg font-bold">Mushenee</h1>
                <div className="w-10" />
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-2xl font-bold text-stone-800 dark:text-white mb-3">Coming Soon</h2>
                <p className="text-stone-500 dark:text-text-muted text-base max-w-sm">
                    Part one na two
                </p>
            </main>
        </div>
    );
};

export default MessagesScreen;
