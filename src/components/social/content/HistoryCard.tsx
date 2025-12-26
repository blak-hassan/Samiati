
import React from 'react';
import { Hourglass, MapPin } from 'lucide-react';

export const HistoryCard = ({ year, location, fact }: { year: string, location: string, fact: string }) => (
    <div className="relative pl-4 border-l-2 border-amber-600/30 my-3 ml-2">
        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-amber-600 border-2 border-white dark:border-background-dark flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
        <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-700 dark:text-amber-500 font-bold text-sm bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full font-mono">
                {year}
            </span>
            <div className="flex items-center gap-1 text-xs text-stone-500 uppercase font-bold tracking-wider">
                <MapPin className="w-3 h-3" />
                {location}
            </div>
        </div>
        <p className="text-sm text-stone-800 dark:text-stone-300 font-medium leading-relaxed">
            {fact}
        </p>
    </div>
);
