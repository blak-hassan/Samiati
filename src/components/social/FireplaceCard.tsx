
import React from 'react';
import { Post } from '@/types';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

interface FireplaceCardProps {
    post: Post;
    onJoin: () => void;
}

export const FireplaceCard: React.FC<FireplaceCardProps> = ({ post, onJoin }) => (
    <Card className="bg-stone-800 dark:bg-surface-dark rounded-lg p-4 text-white shadow-md border-stone-700 flex flex-col gap-2 relative overflow-hidden transition-transform active:scale-[0.98]">
        <div className="flex justify-between items-start z-10">
            <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />
                <span className="font-bold text-sm">Gathering</span>
            </div>
            <div className="flex items-center gap-1 bg-red-900/50 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-red-200 border border-red-800">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                Live
            </div>
        </div>
        <h3 className="font-bold text-base z-10">{post.content}</h3>
        <div className="flex justify-between items-end mt-2 z-10">
            <div className="flex -space-x-2">
                {post.fireplaceSpeakers?.map((s, i) => (
                    <Avatar key={i} className="w-6 h-6 border border-stone-800">
                        <AvatarFallback className="bg-stone-600 text-[8px] font-bold text-white">{s[1]}</AvatarFallback>
                    </Avatar>
                ))}
            </div>
            <Button
                variant="default"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onJoin(); }}
                className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wide h-8"
            >
                Join
            </Button>
        </div>
    </Card>
);
