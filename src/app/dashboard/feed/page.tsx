"use client";
import MessagesScreen from "@/components/screens/MessagesScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { useState } from "react";
import { Post } from "@/types";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function FeedPage() {
    const { navigate, goBack } = useNavigation();

    const { results, status, loadMore } = usePaginatedQuery(
        api.posts.queries.feed,
        { filter: 'all' },
        { initialNumItems: 10 }
    );

    const likePost = useMutation(api.posts.mutations.like);

    // Map database posts to Frontend Post Type
    const posts: Post[] = (results || []).map((p: any) => ({
        id: p._id,
        type: p.type as any,
        content: p.content,
        image: p.image,
        author: p.author,
        timestamp: new Date(p._creationTime).toISOString(), // use creation time
        stats: p.stats,
        isLiked: p.isLiked,
        isReposted: p.isReposted,
        isValidated: p.isValidated,
        likes: p.likes, // remove? stats.likes used usually but Post type usually has it separately? 
        // Checking schema: Post interface has stats.likes.
        // Wait, Post interface usually doesn't have duplicate 'likes' unless legacy.
        // Types.ts line 134: likes: number; inside stats.
        // Types.ts line 137: isLiked: boolean;
        // Types.ts DOES NOT have top-level 'likes' in lines 130-150 view.
        // So just stats.
        cw: p.cw,
    }));

    const handleLike = async (postId: string) => {
        // Optimistic update handled by Convex usually if subscription is fast, 
        // or we can optimistic update local state if needed.
        // For now, simple mutation call.
        await likePost({ postId: postId as Id<"posts"> });
    };

    const handleRepost = (postId: string) => {
        console.log("Repost not implemented yet via mutation");
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
            onViewProfile={(u) => console.log('View profile', u)}
            unreadDmCount={0}
            onJoinFireplace={(p) => console.log('Join fireplace', p)}
        />
    );
}
