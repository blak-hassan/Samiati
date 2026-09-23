
import React from 'react';

interface UploadProgressBarProps {
    progress: number;            // 0..1
    bytesUploaded: number;
    totalBytes: number;
    status: 'idle' | 'uploading' | 'paused' | 'error' | 'done';
    error?: string;
    label?: string;
    onPause?: () => void;
    onResume?: () => void;
    onCancel?: () => void;
    onRetry?: () => void;
    compact?: boolean;
}

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
    progress,
    bytesUploaded,
    totalBytes,
    status,
    error,
    label,
    onPause,
    onResume,
    onCancel,
    onRetry,
    compact = false,
}) => {
    const percent = Math.max(0, Math.min(1, progress));
    const statusText: Record<typeof status, string> = {
        idle: 'Ready',
        uploading: 'Uploading...',
        paused: 'Paused',
        error: 'Error',
        done: 'Complete',
    };
    const statusColor: Record<typeof status, string> = {
        idle: 'bg-stone-300',
        uploading: 'bg-[#cf6317]',
        paused: 'bg-stone-400',
        error: 'bg-red-500',
        done: 'bg-green-500',
    };

    if (compact) {
        return (
            <div className="w-full">
                <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 dark:text-stone-400 mb-1">
                    <span className="truncate">{label ?? statusText[status]}</span>
                    <span className="ml-2 shrink-0">{Math.round(percent * 100)}%</span>
                </div>
                <div className="w-full bg-stone-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${statusColor[status]}`}
                        style={{ width: `${percent * 100}%` }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-stone-500 dark:text-stone-300 text-lg shrink-0">
                        {status === 'error' ? 'error' : status === 'done' ? 'check_circle' : 'cloud_upload'}
                    </span>
                    <span className="text-sm font-bold text-stone-900 dark:text-white truncate">
                        {label ?? statusText[status]}
                    </span>
                </div>
                <span className="text-xs text-stone-500 dark:text-stone-400 shrink-0 ml-2">
                    {formatBytes(bytesUploaded)} / {formatBytes(totalBytes)}
                </span>
            </div>
            <div className="w-full bg-stone-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${statusColor[status]}`}
                    style={{ width: `${percent * 100}%` }}
                />
            </div>
            {error && (
                <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>
            )}
            <div className="flex items-center gap-2 mt-3">
                {status === 'uploading' && onPause && (
                    <button
                        onClick={onPause}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-200 dark:hover:bg-white/10 transition-colors"
                    >
                        Pause
                    </button>
                )}
                {status === 'paused' && onResume && (
                    <button
                        onClick={onResume}
                        className="px-3 py-1.5 rounded-lg bg-[#cf6317] text-white text-xs font-bold hover:bg-[#b05210] transition-colors"
                    >
                        Resume
                    </button>
                )}
                {(status === 'error' || status === 'paused') && onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-200 dark:hover:bg-white/10 transition-colors"
                    >
                        Retry
                    </button>
                )}
                {(status === 'uploading' || status === 'paused' || status === 'error') && onCancel && (
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 rounded-lg text-stone-500 dark:text-stone-400 text-xs font-bold hover:text-red-500 transition-colors ml-auto"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
};

export default UploadProgressBar;
