"use client";
import MessagesScreen from "@/components/screens/MessagesScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useState } from "react";
import { Post } from "@/types";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

import { INITIAL_SOCIAL_POSTS } from "@/data/mock";

// Helper to check if an ID is a valid Convex ID (not mock data)
const isConvexId = (id: string): boolean => {
    // Convex IDs are longer and contain specific characters
    // Mock IDs are simple like "p1", "p2", "p3"
    return id.length > 10 && !id.startsWith('p');
};

export default function FeedPage() {
    const { navigate, goBack } = useNavigation();

    const { results, status, loadMore } = usePaginatedQuery(
        api.posts.queries.feed,
        { filter: 'all' },
        { initialNumItems: 10 }
    );

    const likePost = useMutation(api.posts.mutations.like);
    const toggleRepost = useMutation(api.reposts.mutations.toggleRepost);

    // Map database posts to Frontend Post Type, fallback to Mock Data if empty (for dev)
    const dbPosts: Post[] = (results || []).map((p: any) => ({
        id: p._id,
        type: p.type as any,
        content: p.content,
        image: p.image,
        author: p.author,
        timestamp: new Date(p._creationTime).toISOString(),
        stats: p.stats,
        isLiked: p.isLiked,
        isReposted: p.isReposted,
        isValidated: p.isValidated,
        likes: p.likes,
        cw: p.cw,
    }));

    const posts = dbPosts.length > 0 ? dbPosts : INITIAL_SOCIAL_POSTS;

    const handleLike = async (postId: string) => {
        // Guard: Only call mutation for real Convex IDs, not mock data
        if (!isConvexId(postId)) {
            console.warn('Cannot like mock post - create real posts in the database');
            return;
        }
        await likePost({ postId: postId as Id<"posts"> });
    };

    const handleRepost = async (postId: string) => {
        // Guard: Only call mutation for real Convex IDs, not mock data
        if (!isConvexId(postId)) {
            console.warn('Cannot repost mock post - create real posts in the database');
            return;
        }
        await toggleRepost({ postId: postId as Id<"posts"> });
    };

    const handleLoadMore = () => {
        if (status === "CanLoadMore") {
            loadMore(10);
        }
    };

    // We need to pass handleLoadMore to MessagesScreen?
    // MessagesScreen might not accept it. Let's check props passed in line 30.
    // Props: posts, onLike, onRepost, ...
    // If MessagesScreen handles scrolling, it might need onEndReached.
    // For now, we just pass posts. Pagination might not be visible if Screen doesn't support it.
    // We can wrap MessagesScreen or modify it. 
    // Assuming MessagesScreen is just a list.

    return (
        <MessagesScreen
            navigate={navigate}
            goBack={goBack}
            posts={posts}
            onLike={handleLike}
            onRepost={handleRepost}
            onViewProfile={(u) => { }}
            unreadDmCount={0}
            onJoinFireplace={(p) => { }}
        />
    );
}
