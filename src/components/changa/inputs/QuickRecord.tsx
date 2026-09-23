
import React, { useState, useEffect, useRef } from 'react';

interface QuickRecordProps {
    prompt?: string;
    maxDuration?: number;
    onRecordingComplete?: (duration: number) => void;
    compact?: boolean;
}

export const QuickRecord: React.FC<QuickRecordProps> = ({
    prompt = 'Tap to record',
    maxDuration = 120,
    onRecordingComplete,
    compact = false,
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isRecording && !isPaused) {
            intervalRef.current = setInterval(() => {
                setDuration(d => {
                    if (d >= maxDuration) {
                        setIsRecording(false);
                        onRecordingComplete?.(d);
                        return d;
                    }
                    return d + 1;
                });
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRecording, isPaused, maxDuration, onRecordingComplete]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleToggle = () => {
        if (isRecording) {
            setIsRecording(false);
            onRecordingComplete?.(duration);
        } else {
            setDuration(0);
            setIsRecording(true);
            setIsPaused(false);
        }
    };

    if (compact) {
        return (
            <div className="flex items-center gap-3 bg-stone-50 dark:bg-black/20 rounded-xl p-3 border border-stone-200 dark:border-white/10">
                <button
                    onClick={handleToggle}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        isRecording
                            ? 'bg-red-500 animate-breathe-pulse'
                            : 'bg-[#cf6317] hover:scale-110 cursor-pointer'
                    }`}
                >
                    <span className="material-symbols-outlined text-white text-lg">
                        {isRecording ? 'stop' : 'mic'}
                    </span>
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                        {isRecording ? formatTime(duration) : prompt}
                    </p>
                    {isRecording && (
                        <div className="w-full bg-stone-200 dark:bg-white/10 rounded-full h-1 mt-1">
                            <div
                                className="h-full bg-[#cf6317] rounded-full transition-all"
                                style={{ width: `${(duration / maxDuration) * 100}%` }}
                            />
                        </div>
                    )}
                </div>
                {isRecording && (
                    <span className="text-xs font-mono font-bold text-red-500 animate-pulse">
                        {formatTime(duration)}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="bg-stone-50 dark:bg-black/20 rounded-2xl p-6 flex flex-col items-center justify-center border border-stone-200 dark:border-white/10">
            <div className="relative mb-4">
                {isRecording && (
                    <>
                        <span className="absolute inset-0 rounded-full bg-red-500/20 animate-recording-ring" />
                        <span className="absolute inset-0 rounded-full bg-red-500/10 animate-recording-ring" style={{ animationDelay: '0.5s' }} />
                    </>
                )}
                <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isRecording
                            ? 'bg-red-500 animate-breathe-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                            : 'bg-[#cf6317] shadow-lg hover:scale-110 cursor-pointer'
                    }`}
                    onClick={handleToggle}
                >
                    <span className="material-symbols-outlined text-3xl text-white">
                        {isRecording ? 'stop' : 'mic'}
                    </span>
                </div>
            </div>
            <h3 className="font-bold text-lg text-stone-900 dark:text-white mb-1">
                {isRecording ? 'Recording...' : prompt}
            </h3>
            {isRecording ? (
                <div className="flex items-center gap-3 mt-2">
                    <span className="text-red-500 font-mono font-bold animate-pulse text-lg">
                        {formatTime(duration)}
                    </span>
                    <span className="text-stone-400">/ {formatTime(maxDuration)}</span>
                </div>
            ) : (
                <p className="text-stone-500 dark:text-[#A8A29E] text-sm">
                    Max {maxDuration}s &bull; Tap to start
                </p>
            )}
        </div>
    );
};
