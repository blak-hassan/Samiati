
import React from 'react';

export const TotemUploader = () => {
    return (
        <div className="space-y-6">
            <div className="border-2 border-dashed border-stone-300 dark:border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center bg-stone-50 dark:bg-black/20 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="w-16 h-16 bg-stone-200 dark:bg-white/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-stone-500 dark:text-white">add_a_photo</span>
                </div>
                <h3 className="font-bold text-stone-900 dark:text-white mb-1">Upload Totem Image</h3>
                <p className="text-sm text-stone-500 dark:text-[#A8A29E]">JPG, PNG or WEBP (Max 5MB)</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Totem Name</label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black/20 border border-stone-200 dark:border-white/10 outline-none focus:ring-2 ring-[#cf6317] dark:text-white"
                        placeholder="e.g. The Sacred Mugumo Tree"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Historical Significance</label>
                    <textarea
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black/20 border border-stone-200 dark:border-white/10 outline-none focus:ring-2 ring-[#cf6317] min-h-[120px] dark:text-white"
                        placeholder="Tell the story behind this totem..."
                    />
                </div>
            </div>
        </div>
    );
};
