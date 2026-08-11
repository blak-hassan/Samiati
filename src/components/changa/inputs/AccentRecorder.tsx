
import React, { useState } from 'react';

export const AccentRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);

    return (
        <div className="bg-stone-50 dark:bg-black/20 rounded-2xl p-8 flex flex-col items-center justify-center border-2 border-dashed border-stone-300 dark:border-white/10">
            <div className="relative">
                {/* Expanding rings when recording */}
                {isRecording && (
                    <>
                        <span className="absolute inset-0 rounded-full bg-red-500/20 animate-recording-ring" />
                        <span className="absolute inset-0 rounded-full bg-red-500/10 animate-recording-ring" style={{ animationDelay: '0.5s' }} />
                    </>
                )}
                <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
                        isRecording
                            ? 'bg-red-500 animate-breathe-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                            : 'bg-[#cf6317] shadow-lg hover:scale-110 cursor-pointer'
                    }`}
                    onClick={() => setIsRecording(!isRecording)}
                >
                    <span className="material-symbols-outlined text-4xl text-white">
                        {isRecording ? 'stop' : 'mic'}
                    </span>
                </div>
            </div>
            <h3 className="font-bold text-xl text-stone-900 dark:text-white mb-2">
                {isRecording ? 'Recording in progress...' : 'Tap to Record Accent'}
            </h3>
            <p className="text-stone-500 dark:text-[#A8A29E] text-center max-w-sm mb-4">
                Read the phrase above clearly in your local accent. Try to be as natural as possible.
            </p>
            {isRecording && (
                <div className="text-red-500 font-mono font-bold animate-pulse">00:12 / 02:00</div>
            )}
        </div>
    );
};
