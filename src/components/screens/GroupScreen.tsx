
import React, { useState } from 'react';
import { Screen, Community, Post } from '@/types';
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreHorizontal, Bell, Search, Users, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from '@/components/social/PostCard';
import { INITIAL_SOCIAL_POSTS } from '@/data/mock';

interface Props {
    navigate: (screen: Screen, params?: any) => void;
    goBack: () => void;
    community: Community;
}

const GroupScreen: React.FC<Props> = ({ navigate, goBack, community }) => {
    // In a real app, fetch posts for this group
    const [posts, setPosts] = useState<Post[]>(INITIAL_SOCIAL_POSTS);

    return (
        <div className="flex flex-col min-h-screen bg-background pb-12">
            {/* Header Image */}
            <div className="h-32 sm:h-48 relative w-full">
                <img
                    src={community.coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full bg-black/40 text-white hover:bg-black/60 border-none backdrop-blur-sm"
                        onClick={goBack}
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full bg-black/40 text-white hover:bg-black/60 border-none backdrop-blur-sm"
                    >
                        <Search className="w-5 h-5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full bg-black/40 text-white hover:bg-black/60 border-none backdrop-blur-sm"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Profile Section */}
            <div className="px-4 pb-4 bg-background border-b border-border">
                <div className="flex justify-between items-start -mt-10 mb-4">
                    <div className="relative">
                        <Avatar className="w-24 h-24 border-4 border-background shadow-md">
                            <AvatarImage src={community.avatar} className="object-cover" />
                            <AvatarFallback>{community.name[0]}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="mt-12 flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-full">
                            <Bell className="w-4 h-4 mr-1" /> Notifications
                        </Button>
                        <Button size="sm" className="rounded-full font-bold px-6">Joined</Button>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-1">{community.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mb-3">
                    <span className="text-primary">{community.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {community.memberCount.toLocaleString()} members</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl">
                    {community.description}
                </p>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="feed" className="w-full">
                <div className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border">
                    <TabsList className="w-full h-12 bg-transparent p-0 justify-start px-2">
                        <TabsTrigger value="feed" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">Feed</TabsTrigger>
                        <TabsTrigger value="about" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">About</TabsTrigger>
                        <TabsTrigger value="members" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">Members</TabsTrigger>
                        <TabsTrigger value="media" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">Media</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="feed" className="p-0 m-0">
                    {posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onPostClick={() => { }}
                            onUserClick={() => { }}
                            onCommentClick={() => { }}
                            onLike={() => { }}
                            onRepost={() => { }}
                            onMenuAction={() => { }}
                        />
                    ))}
                    <div className="p-8 text-center text-muted-foreground">
                        <p>No more posts</p>
                    </div>
                </TabsContent>

                <TabsContent value="about" className="p-6">
                    <div className="bg-muted/30 rounded-xl p-6 border border-border">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-primary" />
                            About this Community
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                <span className="text-muted-foreground font-medium">Created</span>
                                <span>September 2023</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                <span className="text-muted-foreground font-medium">Privacy</span>
                                <span>{community.isPrivate ? "Private" : "Public - Anyone can view"}</span>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] gap-2">
                                <span className="text-muted-foreground font-medium">Rules</span>
                                <span>1. Be Respectful<br />2. Stay on topic<br />3. No spam</span>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="members" className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">Member list is hidden for this prototype.</p>
                </TabsContent>

                <TabsContent value="media" className="p-8 text-center">
                    <p className="text-muted-foreground">No media shared yet.</p>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default GroupScreen;
