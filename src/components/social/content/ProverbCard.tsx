
import React, { useState, useEffect, useRef } from 'react';
import { Post } from '@/types';
import { Quote } from 'lucide-react';

export const ProverbCard = ({ data }: { data: NonNullable<Post['proverbData']> }) => {
    const [revealed, setRevealed] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setRevealed(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className="relative pl-6 py-2 my-3 group cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 rounded-r-lg transition-colors"
        >
            <Quote className="absolute left-0 top-2 w-4 h-4 text-primary/40 rotate-180" />
            <div className="text-lg font-serif italic text-stone-800 dark:text-stone-200 leading-relaxed">
                {revealed ? (
                    <span className="animate-typewriter inline-block">
                        &quot;{data.original}&quot;
                    </span>
                ) : (
                    <span className="opacity-0">&quot;{data.original}&quot;</span>
                )}
            </div>
            <div className={`mt-2 text-sm font-medium text-stone-500 dark:text-stone-400 border-l-2 border-primary/20 pl-3 transition-all duration-500 ${revealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
                style={{ transitionDelay: '2s' }}
            >
                {data.translation}
            </div>
            {data.meaning && (
                <div className={`mt-2 text-xs text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-white/5 p-2 rounded block transition-all duration-500 ${revealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
                    style={{ transitionDelay: '2.3s' }}
                >
                    <span className="font-bold uppercase tracking-wider text-[10px] text-primary block mb-1">Deep Meaning</span>
                    {data.meaning}
                </div>
            )}
        </div>
    );
};
