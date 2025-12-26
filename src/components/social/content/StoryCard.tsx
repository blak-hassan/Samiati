
import React from 'react';
import { BookOpen } from 'lucide-react';

// Assuming structure for Story, though not in strict Type yet
export const StoryCard = ({ title, preview }: { title: string, preview: string }) => (
    <div className="border border-stone-200 dark:border-white/10 rounded-xl overflow-hidden my-2 bg-stone-50 dark:bg-black/20">
        <div className="bg-stone-100 dark:bg-white/5 px-4 py-2 border-b border-stone-200 dark:border-white/10 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-orange-600">Folklore</span>
        </div>
        <div className="p-4">
            <h3 className="font-bold text-lg mb-2 font-serif text-stone-900 dark:text-stone-100">{title}</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed">
                {preview}
            </p>
            <div className="mt-3">
                <button className="text-xs font-bold text-primary hover:underline">Read Full Story</button>
            </div>
        </div>
    </div>
);
