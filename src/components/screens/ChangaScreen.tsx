"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Screen, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
    Mic,
    MicOff,
    ChevronLeft,
    ChevronRight,
    Check,
    Flame,
    Leaf,
    Gift,
    ChevronDown,
    Edit3,
    BookOpen,
    MessageCircle,
    FileText,
    RotateCcw,
    ArrowLeft
} from 'lucide-react';

interface Props {
    navigate: (screen: Screen, params?: Record<string, string>) => void;
    goBack: () => void;
    user: User;
    unreadCount?: number;
}

type ContributionType = 'word' | 'phrase' | 'sentence';

interface Language {
    code: string;
    name: string;
    native: string;
}

const LANGUAGES: Language[] = [
    { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
    { code: 'ki', name: 'Kikuyu', native: 'Gikuyu' },
    { code: 'luo', name: 'Luo', native: 'Dholuo' },
    { code: 'lu', name: 'Luhya', native: 'Lukhaya' },
    { code: 'ke', name: 'Kamba', native: 'Kikamba' },
    { code: 'em', name: 'Embu', native: 'Kembu' },
    { code: 'ka', name: 'Kalenjin', native: 'Kalenjin' },
    { code: 'ms', name: 'Maasai', native: 'Maa' },
];

type KipepeoState = 'celebrating' | 'encouraging' | 'sleeping' | 'proud' | 'default';

const KIPEPO_STATES: Record<KipepeoState, { emoji: string; message: string }> = {
    celebrating: { emoji: '🦋', message: 'Your voice is a gift!' },
    encouraging: { emoji: '🐛', message: 'Your language is waiting for you.' },
    sleeping: { emoji: '😴', message: 'Rest. The language will be here.' },
    proud: { emoji: '👑', message: 'You are protecting your heritage.' },
    default: { emoji: '🦋', message: '3 words. That\'s all it takes today.' },
};

const WISDOM_BOX_CONTENT = [
    { type: 'proverb', content: '"Harambee" — In coming together, we build stronger.' },
    { type: 'fact', content: 'Swahili is spoken by over 100 million people worldwide.' },
    { type: 'progress', content: 'The AI learned 12 new words this week thanks to contributors like you.' },
];

const CONTRIBUTION_TYPE_ICONS = {
    word: BookOpen,
    phrase: MessageCircle,
    sentence: FileText,
};

const CONTRIBUTION_TYPE_LABELS = {
    word: 'Word',
    phrase: 'Phrase',
    sentence: 'Sentence',
};

type ViewState = 'setup' | 'ready' | 'recording' | 'feedback';

export default function ChangaScreen({ navigate, goBack, user, unreadCount = 0 }: Props) {
    const [viewState, setViewState] = useState<ViewState>('setup');
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]);
    const [contributionType, setContributionType] = useState<ContributionType>('word');
    const [wordText, setWordText] = useState('');
    const [translationText, setTranslationText] = useState('');
    const [isEditingWord, setIsEditingWord] = useState(false);
    const [isEditingTranslation, setIsEditingTranslation] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [submittedCount, setSubmittedCount] = useState(0);
    const [kipepeoState, setKipepeoState] = useState<KipepeoState>('default');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showWisdomBox, setShowWisdomBox] = useState(false);
    const [showFeedback, setShowFeedback] = useState<string | null>(null);
    const [streakDays, setStreakDays] = useState(7);
    const [isHolding, setIsHolding] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const handleLanguageSelect = (lang: Language) => {
        setSelectedLanguage(lang);
    };

    const handleTypeSelect = (type: ContributionType) => {
        setContributionType(type);
    };

    const handleWordComplete = () => {
        if (wordText.trim()) {
            setViewState('ready');
        }
    };

    const handleBackToSetup = () => {
        setViewState('setup');
        setWordText('');
        setTranslationText('');
    };

    const handleStartRecording = useCallback(async () => {
        if (viewState !== 'ready' || !wordText.trim()) return;
        setIsHolding(true);
        setViewState('recording');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await handleSubmitRecording(blob);
            };

            mediaRecorder.start(100);
            setIsRecording(true);
            setRecordingDuration(0);

            timerRef.current = setInterval(() => {
                setRecordingDuration((prev) => {
                    if (prev >= 25) {
                        handleStopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            console.error('Failed to start recording:', err);
            setIsHolding(false);
            setViewState('ready');
        }
    }, [viewState, wordText]);

    const handleStopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsRecording(false);
        setIsHolding(false);
    }, []);

    const handleSubmitRecording = useCallback(async (_audioBlob: Blob) => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            setSubmittedCount((prev) => prev + 1);
            setKipepeoState('celebrating');
            setShowFeedback('🎉 Added to ' + selectedLanguage.name);
            
            const newCount = submittedCount + 1;
            setViewState('feedback');
            
            setTimeout(() => {
                setKipepeoState('default');
                setShowFeedback(null);
                setWordText('');
                setTranslationText('');
                setViewState('setup');
            }, 2000);

            if (newCount === 4 || newCount === 9 || newCount === 14) {
                setTimeout(() => setShowWisdomBox(true), 500);
            }
        } catch (err) {
            console.error('Failed to submit:', err);
            setKipepeoState('encouraging');
            setViewState('ready');
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, selectedLanguage, submittedCount]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const TypeIcon = CONTRIBUTION_TYPE_ICONS[contributionType];

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-amber-50 to-orange-100 dark:from-stone-900 dark:to-stone-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-6">
                <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full">
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-amber-500/20 rounded-full flex items-center gap-1.5">
                        <Leaf className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{submittedCount}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-orange-500/20 rounded-full flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streakDays}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowWisdomBox(true)} className="rounded-full">
                    <Gift className="w-5 h-5" />
                </Button>
            </div>

            {/* SETUP VIEW - Language & Type Selection */}
            {viewState === 'setup' && (
                <div className="flex-1 flex flex-col px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Language Selector */}
                    <div className="mb-4">
                        <Label className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2 block uppercase tracking-wide">
                            Language
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-stone-800 rounded-lg shadow-sm">
                                    <span className="text-base font-medium text-stone-700 dark:text-stone-200">{selectedLanguage.name}</span>
                                    <ChevronDown className="w-5 h-5 text-stone-500" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                                <div className="p-1 max-h-60 overflow-y-auto">
                                    {LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleLanguageSelect(lang)}
                                            className={cn(
                                                "w-full text-left px-4 py-3 rounded-md text-base transition-colors",
                                                selectedLanguage.code === lang.code
                                                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                                                    : "hover:bg-stone-100 dark:hover:bg-stone-700"
                                            )}
                                        >
                                            <span className="font-medium">{lang.name}</span>
                                            <span className="text-stone-500 dark:text-stone-400 ml-2">({lang.native})</span>
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Type Selector */}
                    <div className="mb-6">
                        <Label className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2 block uppercase tracking-wide">
                            Type
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(CONTRIBUTION_TYPE_LABELS) as ContributionType[]).map((type) => {
                                const Icon = CONTRIBUTION_TYPE_ICONS[type];
                                return (
                                    <button
                                        key={type}
                                        onClick={() => handleTypeSelect(type)}
                                        className={cn(
                                            "flex flex-col items-center gap-1 px-3 py-3 rounded-lg transition-all",
                                            contributionType === type
                                                ? "bg-amber-500 text-white shadow-lg"
                                                : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="text-xs font-medium">{CONTRIBUTION_TYPE_LABELS[type]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Word Input */}
                    <div className="flex-1">
                        <Label className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2 block uppercase tracking-wide">
                            {selectedLanguage.name} {contributionType}
                        </Label>
                        <div className="relative">
                            {isEditingWord ? (
                                <Input
                                    value={wordText}
                                    onChange={(e) => setWordText(e.target.value)}
                                    onBlur={() => setIsEditingWord(false)}
                                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingWord(false)}
                                    placeholder={`Enter ${contributionType}...`}
                                    className="text-3xl font-black text-stone-800 dark:text-stone-100 py-6 bg-white dark:bg-stone-800 border-2 border-amber-300 focus:border-amber-500"
                                    autoFocus
                                />
                            ) : (
                                <div
                                    onClick={() => setIsEditingWord(true)}
                                    className={cn(
                                        "w-full px-4 py-6 bg-white dark:bg-stone-800 rounded-lg border-2 border-transparent",
                                        "text-3xl font-black text-stone-800 dark:text-stone-100 text-center cursor-pointer",
                                        "hover:border-amber-300 transition-colors",
                                        !wordText && "text-stone-400 dark:text-stone-500"
                                    )}
                                >
                                    {wordText || `Tap to enter ${contributionType}...`}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Translation Input (Optional) */}
                    <div className="mb-6">
                        <Label className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2 block uppercase tracking-wide">
                            Translation (optional)
                        </Label>
                        <Input
                            value={translationText}
                            onChange={(e) => setTranslationText(e.target.value)}
                            placeholder="English translation..."
                            className="text-base text-stone-700 dark:text-stone-200 py-3 bg-white dark:bg-stone-800"
                        />
                    </div>

                    {/* Continue Button */}
                    <Button
                        onClick={handleWordComplete}
                        disabled={!wordText.trim()}
                        className="w-full h-14 text-lg font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                    >
                        Continue
                    </Button>
                </div>
            )}

            {/* READY VIEW - One-Tap Recording */}
            {(viewState === 'ready' || viewState === 'recording' || viewState === 'feedback') && (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 animate-in fade-in zoom-in-95 duration-300">
                    {/* Back Button */}
                    <button
                        onClick={handleBackToSetup}
                        className="absolute top-20 left-4 p-2 rounded-full bg-white/50 dark:bg-stone-800/50 hover:bg-white/80 dark:hover:bg-stone-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                    </button>

                    {/* Language Badge */}
                    <div className="mb-6">
                        <div className="px-4 py-2 bg-white/80 dark:bg-stone-800/80 rounded-full shadow-sm">
                            <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                                {selectedLanguage.name} · {CONTRIBUTION_TYPE_LABELS[contributionType]}
                            </span>
                        </div>
                    </div>

                    {/* Word Display */}
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-black text-stone-800 dark:text-stone-100 mb-3 tracking-tight">
                            {wordText}
                        </h1>
                        {translationText && (
                            <p className="text-xl text-stone-500 dark:text-stone-400">
                                {translationText}
                            </p>
                        )}
                    </div>

                    {/* Recording Button */}
                    {viewState === 'ready' && (
                        <>
                            <button
                                onMouseDown={handleStartRecording}
                                onMouseUp={handleStopRecording}
                                onMouseLeave={handleStopRecording}
                                onTouchStart={handleStartRecording}
                                onTouchEnd={handleStopRecording}
                                className={cn(
                                    "relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300",
                                    "shadow-xl shadow-amber-500/30 active:scale-95",
                                    "bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                                )}
                            >
                                <Mic className="w-10 h-10 text-white" />
                            </button>
                            <p className="mt-6 text-sm text-stone-500 dark:text-stone-400 text-center max-w-xs">
                                Press and hold to record. Release to submit.
                            </p>
                        </>
                    )}

                    {/* Recording State */}
                    {viewState === 'recording' && (
                        <>
                            <div className="relative w-28 h-28 rounded-full bg-red-500 animate-pulse flex items-center justify-center shadow-xl shadow-red-500/30">
                                <MicOff className="w-10 h-10 text-white" />
                            </div>
                            <p className="mt-6 text-red-500 font-mono font-bold">
                                {formatDuration(recordingDuration)} / 00:30
                            </p>
                        </>
                    )}

                    {/* Feedback State */}
                    {viewState === 'feedback' && (
                        <div className="px-6 py-3 bg-green-500/20 rounded-full animate-in fade-in zoom-in-95 duration-300">
                            <span className="text-green-700 dark:text-green-300 font-medium text-lg">
                                {showFeedback}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Kipepeo Mascot */}
            <div className="absolute bottom-28 right-6 pointer-events-none">
                <div className="text-5xl transition-transform duration-300 animate-in slide-in-from-bottom-8 duration-500">
                    {KIPEPO_STATES[kipepeoState].emoji}
                </div>
            </div>

            {/* Wisdom Box Modal */}
            {showWisdomBox && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowWisdomBox(false)}
                    />
                    <Card className="relative max-w-sm w-full p-6 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-stone-800 dark:to-stone-900 border-amber-500/30 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="text-center">
                            <div className="text-6xl mb-3">🎁</div>
                            <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 mb-2">
                                Wisdom Box!
                            </h2>
                            <p className="text-stone-600 dark:text-stone-300 mb-4">
                                {WISDOM_BOX_CONTENT[submittedCount % WISDOM_BOX_CONTENT.length].content}
                            </p>
                            <div className="p-3 bg-white/50 dark:bg-stone-700/50 rounded-lg mb-4">
                                <p className="text-sm text-stone-500 dark:text-stone-400 italic">
                                    — {selectedLanguage.name} Proverb
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowWisdomBox(false)}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Collect
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}