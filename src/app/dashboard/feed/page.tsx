"use client";
import MessagesScreen from "@/components/screens/MessagesScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useState } from "react";
import { Post } from "@/types";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

import { INITIAL_SOCIAL_POSTS } from "@/data/mock";

export default function FeedPage() {
    const { navigate, goBack } = useNavigation();

    const { results, status, loadMore } = usePaginatedQuery(
        api.posts.queries.feed,
        { filter: 'all' },
        { initialNumItems: 10 }
    );

    const likePost = useMutation(api.posts.mutations.like);

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
        // Optimistic update handled by Convex usually if subscription is fast, 
        // or we can optimistic update local state if needed.
        // For now, simple mutation call.
        await likePost({ postId: postId as Id<"posts"> });
    };

    const handleRepost = (postId: string) => {
        // Repost not implemented yet via mutation
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
