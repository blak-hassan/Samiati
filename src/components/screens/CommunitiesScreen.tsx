
import React, { useState } from 'react';
import { Screen, Community } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Plus } from "lucide-react";

import { CommunityCard } from '@/components/social/CommunityCard';

import { INITIAL_COMMUNITIES } from '@/data/mock';

interface Props {
    navigate: (screen: Screen, params?: any) => void;
    goBack: () => void;
}

const CommunitiesScreen: React.FC<Props> = ({ navigate, goBack }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [communities, setCommunities] = useState<Community[]>(INITIAL_COMMUNITIES);

    const filtered = communities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleJoin = (id: string) => {
        setCommunities(prev => prev.map(c => {
            if (c.id === id) {
                const isJoined = c.role !== 'none';
                return {
                    ...c,
                    role: isJoined ? 'none' : 'member',
                    memberCount: isJoined ? c.memberCount - 1 : c.memberCount + 1
                };
            }
            return c;
        }));
    };

    const handleCommunityClick = (id: string) => {
        const community = communities.find(c => c.id === id);
        if (community) {
            navigate(Screen.GROUP_VIEW, { community });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="flex items-center p-4 bg-background/95 backdrop-blur sticky top-0 z-10 border-b border-border">
                <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="flex-1 text-xl font-bold ml-2">Communities</h1>
                <Button size="icon" variant="ghost" className="rounded-full">
                    <Plus className="w-6 h-6" />
                </Button>
            </header>

            <div className="p-4 bg-muted/30 border-b border-border">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Discover communities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background rounded-full border-border/60"
                    />
                </div>
            </div>

            <main className="flex-1 p-4 grid gap-4 sm:grid-cols-2">
                {filtered.map(community => (
                    <CommunityCard
                        key={community.id}
                        community={community}
                        onJoin={handleJoin}
                        onClick={handleCommunityClick}
                    />
                ))}
            </main>
        </div>
    );
};

export default CommunitiesScreen;
