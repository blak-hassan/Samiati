
import React from 'react';
import { Community } from '@/types';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityCardProps {
    community: Community;
    onJoin: (id: string) => void;
    onClick: (id: string) => void;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({ community, onJoin, onClick }) => {
    return (
        <div
            onClick={() => onClick(community.id)}
            className="flex flex-col bg-background border border-border rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
        >
            <div className="h-24 bg-muted relative overflow-hidden">
                <img
                    src={community.coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            <div className="px-4 pb-4 -mt-10 relative">
                <div className="flex justify-between items-end mb-3">
                    <Avatar className="w-20 h-20 border-4 border-background shadow-sm">
                        <AvatarImage src={community.avatar} className="object-cover" />
                        <AvatarFallback>{community.name[0]}</AvatarFallback>
                    </Avatar>

                    <Button
                        size="sm"
                        variant={community.role !== 'none' ? "outline" : "default"}
                        className={cn(
                            "rounded-full px-6 font-bold",
                            community.role !== 'none' && "border-primary text-primary hover:bg-primary/10"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            onJoin(community.id);
                        }}
                    >
                        {community.role !== 'none' ? 'Joined' : 'Join'}
                    </Button>
                </div>

                <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-1">
                        {community.name}
                        {community.isPrivate && <ShieldCheck className="w-4 h-4 text-muted-foreground" />}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium mb-2">
                        <Users className="w-3 h-3" />
                        <span>{community.memberCount.toLocaleString()} members</span>
                        <span>•</span>
                        <span className="text-primary">{community.category}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {community.description}
                    </p>
                </div>
            </div>
        </div>
    );
};
