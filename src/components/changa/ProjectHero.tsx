
import React from 'react';
import { Challenge } from '@/types';

interface Props {
    challenge: Challenge;
}

export const ProjectHero: React.FC<Props> = ({ challenge }) => {
    const percent = Math.min(100, Math.round((challenge.currentCount / challenge.goalCount) * 100));

    return (
        <div className="relative w-full h-80 bg-stone-900 rounded-3xl overflow-hidden shadow-2xl group">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('${challenge.image}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />

            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                {/* Badge / Type */}
                <div className="absolute top-6 left-6">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-white uppercase tracking-widest">
                        {challenge.type} Project
                    </span>
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight leading-tight">
                            {challenge.title}
                        </h1>
                        <p className="text-stone-300 text-lg max-w-2xl line-clamp-2">
                            {challenge.description}
                        </p>
                    </div>

                    {/* Progress Bar & Stats */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">

                        {/* Circular Progress (Visual approximation for now using linear) */}
                        <div className="flex-1 w-full space-y-2">
                            <div className="flex justify-between text-sm font-bold text-white/90">
                                <span>Progress</span>
                                <span>{percent}%</span>
                            </div>
                            <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-[#cf6317] to-amber-500 rounded-full relative overflow-hidden"
                                    style={{ width: `${percent}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                </div>
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="flex items-center gap-8 md:border-l md:border-white/10 md:pl-8">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{challenge.currentCount}</div>
                                <div className="text-xs text-stone-400 uppercase tracking-wider font-bold">{challenge.goalMetric}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-stone-400">/ {challenge.goalCount}</div>
                                <div className="text-xs text-stone-500 uppercase tracking-wider font-bold">Goal</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
