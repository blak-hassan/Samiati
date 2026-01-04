
import React from 'react';

export const DialectMapper = () => {
    return (
        <div className="bg-stone-50 dark:bg-black/20 rounded-2xl overflow-hidden border border-stone-200 dark:border-white/10 relative h-96">
            {/* Mock Map UI */}
            <div className="absolute inset-0 bg-[#e5e7eb] dark:bg-[#1a1a1a] flex items-center justify-center text-stone-300 dark:text-stone-700">
                <span className="material-symbols-outlined text-9xl opacity-20">public</span>
            </div>

            <div className="absolute bottom-6 left-6 right-6 bg-white dark:bg-[#2b1e19] p-4 rounded-xl shadow-lg border border-stone-200 dark:border-white/5">
                <h3 className="font-bold text-stone-900 dark:text-white mb-2">Pin Your Dialect</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search location..."
                        className="flex-1 px-4 py-2 rounded-lg bg-stone-100 dark:bg-black/20 border border-stone-200 dark:border-white/10 outline-none focus:ring-2 ring-[#cf6317]"
                    />
                    <button className="px-6 py-2 bg-[#cf6317] text-white font-bold rounded-lg hover:bg-[#b05210] transition-colors">
                        Pin Location
                    </button>
                </div>
            </div>
        </div>
    );
};
