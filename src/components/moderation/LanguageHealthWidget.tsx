"use client";

import React from 'react';
import { LanguageHealth } from '@/types';

interface Props {
    languages: LanguageHealth[];
    selectedLanguage: string | null;
    onSelectLanguage: (code: string | null) => void;
}

export const LanguageHealthWidget: React.FC<Props> = ({
    languages,
    selectedLanguage,
    onSelectLanguage
}) => {
    const getHealthColor = (percent: number) => {
        if (percent >= 70) return 'bg-rasta-green';
        if (percent >= 40) return 'bg-rasta-gold';
        return 'bg-rasta-red';
    };

    const getHealthBorderColor = (percent: number) => {
        if (percent >= 70) return 'border-rasta-green/30';
        if (percent >= 40) return 'border-rasta-gold/30';
        return 'border-rasta-red/30';
    };

    const getHealthBgColor = (percent: number) => {
        if (percent >= 70) return 'bg-rasta-green/10';
        if (percent >= 40) return 'bg-rasta-gold/10';
        return 'bg-rasta-red/10';
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between px-4 mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 dark:text-text-muted">
                    Your Languages Health
                </h3>
                {selectedLanguage && languages.length > 1 && (
                    <button
                        onClick={() => onSelectLanguage(null)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${!selectedLanguage ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'}`}
                    >
                        Show All
                    </button>
                )}
            </div>

            <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
                {languages.map((lang) => (
                    <button
                        key={lang.id}
                        onClick={() => onSelectLanguage(lang.code)}
                        className={`flex-shrink-0 w-48 p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${selectedLanguage === lang.code
                            ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-[#3d2b1f] shadow-lg scale-[1.02]'
                            : 'border-black/5 dark:border-white/5 bg-white/50 dark:bg-[#2a1d15] hover:border-primary/30'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <div>
                                <h4 className="font-black text-stone-900 dark:text-white text-base leading-tight">
                                    {lang.name}
                                </h4>
                                <p className="text-[10px] uppercase font-bold text-stone-500 dark:text-text-muted/60 tracking-wider">
                                    {lang.code.toUpperCase()} • {lang.isUserModerator ? 'Moderator' : 'Contributor'}
                                </p>
                            </div>
                            {lang.pendingValidations > 0 && (
                                <div className="bg-rasta-red text-white text-[10px] font-black px-1.5 py-0.5 rounded-md animate-pulse shadow-sm">
                                    {lang.pendingValidations}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5 relative z-10">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-bold text-stone-600 dark:text-text-muted">Stability</span>
                                <span className={`text-xs font-black ${lang.healthPercent >= 70 ? 'text-rasta-green' :
                                    lang.healthPercent >= 40 ? 'text-rasta-gold' : 'text-rasta-red'
                                    }`}>
                                    {lang.healthPercent}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${getHealthColor(lang.healthPercent)}`}
                                    style={{ width: `${lang.healthPercent}%` }}
                                />
                            </div>
                        </div>

                        <p className="text-[10px] font-medium text-stone-500 dark:text-text-muted/60 mt-3 relative z-10">
                            {lang.validatedContributions} validated / {lang.targetContributions} target
                        </p>

                        {/* Decorative background element */}
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-20 blur-2xl group-hover:scale-125 transition-transform duration-700 ${getHealthBgColor(lang.healthPercent)}`}></div>
                    </button>
                ))}

                {/* Empty space at the end for padding */}
                <div className="flex-shrink-0 w-1"></div>
            </div>
        </div>
    );
};
