"use client";
import React from 'react';
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

interface MediaSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'audio' | 'image' | 'video' | null;
    onSelectSource: (source: 'upload' | 'capture') => void;
}

export const MediaSelector: React.FC<MediaSelectorProps> = ({
    isOpen,
    onClose,
    type,
    onSelectSource,
}) => {
    const titles = {
        audio: "Attach Audio",
        image: "Attach Image",
        video: "Attach Video",
    };

    const descriptions = {
        audio: "Choose how you want to add your audio recording.",
        image: "Choose how you want to add your photo.",
        video: "Choose how you want to add your video.",
    };

    const captureLabels = {
        audio: "Record Live",
        image: "Take Photo",
        video: "Record Video",
    };

    const icons = {
        audio: "mic",
        image: "photo_camera",
        video: "videocam",
    };

    if (!type) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="rounded-t-[32px] p-6 pb-10">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-black uppercase tracking-tight text-center">
                        {titles[type]}
                    </SheetTitle>
                    <SheetDescription className="text-center font-medium">
                        {descriptions[type]}
                    </SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-4">
                    <Button
                        variant="outline"
                        className="flex flex-col h-32 rounded-2xl border-2 bg-muted/10 gap-3 group hover:bg-primary/5 hover:border-primary/50 transition-all"
                        onClick={() => {
                            onSelectSource('upload');
                            onClose();
                        }}
                    >
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <span className="material-symbols-outlined text-primary text-2xl">upload_file</span>
                        </div>
                        <span className="font-black text-[10px] uppercase tracking-widest text-foreground">Upload File</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="flex flex-col h-32 rounded-2xl border-2 bg-muted/10 gap-3 group hover:bg-primary/5 hover:border-primary/50 transition-all"
                        onClick={() => {
                            onSelectSource('capture');
                            onClose();
                        }}
                    >
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <span className="material-symbols-outlined text-primary text-2xl">{icons[type]}</span>
                        </div>
                        <span className="font-black text-[10px] uppercase tracking-widest text-foreground">{captureLabels[type]}</span>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
