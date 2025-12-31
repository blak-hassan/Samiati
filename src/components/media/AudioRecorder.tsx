"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
    onRecorded: (blob: Blob) => void;
    onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecorded, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setRecordedBlob(blob);
                setAudioUrl(url);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDone = () => {
        if (recordedBlob) {
            onRecorded(recordedBlob);
        }
    };

    const reset = () => {
        setAudioUrl(null);
        setRecordedBlob(null);
        setRecordingTime(0);
    };

    return (
        <div className="bg-muted/30 p-6 rounded-[24px] border border-border space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500",
                    isRecording ? "bg-red-500 animate-pulse" : "bg-primary/20"
                )}>
                    <span className={cn(
                        "material-symbols-outlined text-3xl",
                        isRecording ? "text-white" : "text-primary"
                    )}>
                        {isRecording ? 'graphic_eq' : 'mic'}
                    </span>
                </div>

                <div className="text-center">
                    <p className="text-2xl font-black tracking-tighter tabular-nums">
                        {formatTime(recordingTime)}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
                        {isRecording ? "Recording Live..." : audioUrl ? "Recording Complete" : "Ready to Record"}
                    </p>
                </div>
            </div>

            {audioUrl && (
                <div className="bg-background/80 p-3 rounded-xl border border-border">
                    <audio src={audioUrl} controls className="w-full h-10" />
                </div>
            )}

            <div className="flex gap-3">
                {!audioUrl ? (
                    <>
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border-2"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={isRecording ? "destructive" : "default"}
                            className="flex-2 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex-[2]"
                            onClick={isRecording ? stopRecording : startRecording}
                        >
                            {isRecording ? 'Stop Recording' : 'Start Recording'}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border-2"
                            onClick={reset}
                        >
                            Retake
                        </Button>
                        <Button
                            className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg"
                            onClick={handleDone}
                        >
                            Use This Recording
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};
