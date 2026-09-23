
import React, { useState } from 'react';

interface AlphabetCaptureProps {
    onSubmit?: (data: { symbol: string; unicode: string; name: string; referenceImage?: string }) => void;
}

export const AlphabetCapture: React.FC<AlphabetCaptureProps> = ({ onSubmit }) => {
    const [symbol, setSymbol] = useState('');
    const [unicode, setUnicode] = useState('');
    const [name, setName] = useState('');
    const [hasImage, setHasImage] = useState(false);

    return (
        <div className="space-y-6">
            <div className="bg-stone-50 dark:bg-black/20 rounded-2xl p-6 border-2 border-dashed border-stone-300 dark:border-white/10">
                <div className="text-center mb-4">
                    <h3 className="font-bold text-lg text-stone-900 dark:text-white mb-1">Draw or Paste Symbol</h3>
                    <p className="text-sm text-stone-500 dark:text-[#A8A29E]">Enter the character, draw it, or paste from clipboard</p>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 bg-white dark:bg-[#42342b] border-2 border-stone-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-6xl text-stone-900 dark:text-white font-display">
                        {symbol || <span className="text-stone-300 dark:text-stone-600 text-4xl">?</span>}
                    </div>

                    <input
                        type="text"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        placeholder="Type or paste symbol here"
                        className="w-full max-w-xs text-center px-4 py-3 rounded-xl bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/10 outline-none focus:border-[#cf6317] text-2xl text-stone-900 dark:text-white placeholder-stone-300"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Unicode Value</label>
                    <input
                        type="text"
                        value={unicode}
                        onChange={(e) => setUnicode(e.target.value)}
                        placeholder="e.g. U+1680"
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/10 outline-none focus:border-[#cf6317] text-stone-900 dark:text-white placeholder-stone-300 font-mono text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Character Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ogham Space Mark"
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/10 outline-none focus:border-[#cf6317] text-stone-900 dark:text-white placeholder-stone-300"
                    />
                </div>
            </div>

            <div
                className="border-2 border-dashed border-stone-300 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center bg-stone-50 dark:bg-black/20 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => setHasImage(true)}
            >
                {hasImage ? (
                    <div className="text-center">
                        <span className="material-symbols-outlined text-3xl text-[#cf6317] mb-2">check_circle</span>
                        <h3 className="font-bold text-stone-900 dark:text-white">Reference Image Added</h3>
                        <p className="text-sm text-stone-500 dark:text-[#A8A29E]">Click to replace</p>
                    </div>
                ) : (
                    <>
                        <div className="w-14 h-14 bg-stone-200 dark:bg-white/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl text-stone-500 dark:text-white">add_a_photo</span>
                        </div>
                        <h3 className="font-bold text-stone-900 dark:text-white mb-1">Upload Reference Image</h3>
                        <p className="text-sm text-stone-500 dark:text-[#A8A29E]">Optional — handwriting sample or printed reference</p>
                    </>
                )}
            </div>

            {symbol.trim() && (
                <button
                    onClick={() => onSubmit?.({ symbol, unicode, name })}
                    className="w-full bg-[#cf6317] hover:bg-[#b05210] text-white font-bold py-3 rounded-xl shadow-lg active:scale-[0.98] transition-all"
                >
                    Save Symbol
                </button>
            )}
        </div>
    );
};
