"use client";

import MessagesScreen from "@/components/screens/MessagesScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useState } from "react";
import { Post } from "@/types";
import { INITIAL_SOCIAL_POSTS } from "@/data/mock";

export default function FeedPage() {
    const { navigate, goBack } = useNavigation();
    const [posts, setPosts] = useState<Post[]>(INITIAL_SOCIAL_POSTS);

    const handleLike = (postId: string) => {
        setPosts(prev => prev.map(p => p.id === postId ? {
            ...p,
            isLiked: !p.isLiked,
            stats: { ...p.stats, likes: p.isLiked ? p.stats.likes - 1 : p.stats.likes + 1 }
        } : p));
    };

    const handleRepost = (postId: string) => {
        setPosts(prev => prev.map(p => p.id === postId ? {
            ...p,
            isReposted: !p.isReposted,
            stats: { ...p.stats, reposts: p.isReposted ? p.stats.reposts - 1 : p.stats.reposts + 1 }
        } : p));
    };

    return (
        <MessagesScreen
            navigate={navigate}
            goBack={goBack}
            posts={posts}
            onLike={handleLike}
            onRepost={handleRepost}
            onViewProfile={(u) => console.log('View profile', u)}
            unreadDmCount={0}
            onJoinFireplace={(p) => console.log('Join fireplace', p)}
        />
    );
}
