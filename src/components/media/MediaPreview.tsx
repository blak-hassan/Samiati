"use client";
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Attachment {
    id: string;
    file: File;
    previewUrl: string;
    type: 'audio' | 'image' | 'video';
}

interface MediaPreviewProps {
    attachments: Attachment[];
    onRemove: (id: string) => void;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ attachments, onRemove }) => {
    if (attachments.length === 0) return null;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">attachment</span>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">Pending Attachments</h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {attachments.map((att) => (
                    <Card key={att.id} className="p-3 bg-muted/20 border-border/50 flex items-center gap-4 group relative overflow-hidden">
                        <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center shrink-0 border border-border/50">
                            {att.type === 'image' ? (
                                <img src={att.previewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                            ) : att.type === 'audio' ? (
                                <span className="material-symbols-outlined text-primary">audiotrack</span>
                            ) : (
                                <span className="material-symbols-outlined text-primary">videocam</span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{att.file.name}</p>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                                {(att.file.size / 1024).toFixed(1)} KB • {att.type}
                            </p>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => onRemove(att.id)}
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </Button>
                    </Card>
                ))}
            </div>
        </div>
    );
};
