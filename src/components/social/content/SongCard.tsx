import React from 'react';
import { Play, Music2, Pause } from 'lucide-react';

export const SongCard = ({ title, artist, duration }: { title: string, artist: string, duration: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-rasta-gold/5 border border-rasta-gold/10 my-2">
        <div className="w-10 h-10 rounded-full bg-rasta-gold flex items-center justify-center shrink-0 shadow-lg shadow-rasta-gold/20 cursor-pointer hover:scale-105 transition-transform">
            <Play className="w-4 h-4 text-white fill-current" />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-foreground truncate">{title}</h4>
            <div className="flex items-center gap-2">
                <Music2 className="w-3 h-3 text-rasta-gold" />
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{artist}</p>
            </div>
        </div>
        <div className="text-xs font-mono font-medium text-stone-400">
            {duration}
        </div>
    </div>
);
