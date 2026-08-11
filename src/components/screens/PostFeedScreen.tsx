"use client";

import React, { useCallback } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PostCard } from "@/components/social/PostCard";
import { Post } from "@/types";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Feather } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function PostFeedScreen() {
    const { navigate, goBack } = useNavigation();
    const { results, status, loadMore } = usePaginatedQuery(
        api.posts.queries.feed,
        { filter: "all" },
        { initialNumItems: 20 }
    );

    const posts: Post[] = results.map((p: Record<string, unknown>) => ({
        id: p._id as string,
        type: (p.type as "standard" | "proverb" | "audio" | "question" | "fireplace") || "standard",
        author: (p.author as { name: string; handle: string; avatar: string; isVerified?: boolean }) || {
            name: "Unknown",
            handle: "unknown",
            avatar: "",
        },
        content: (p.content as string) || "",
        cw: p.cw as string | undefined,
        image: p.image as string | undefined,
        altText: p.altText as string | undefined,
        languageTag: p.languageTag as string | undefined,
        isFireplace: p.isFireplace as boolean | undefined,
        isBounty: p.isBounty as boolean | undefined,
        timestamp: new Date(p.timestamp as number).toLocaleDateString(),
        stats: (p.stats as { replies: number; reposts: number; likes: number; validations: number }) || {
            replies: 0,
            reposts: 0,
            likes: 0,
            validations: 0,
        },
        isLiked: (p.isLiked as boolean) || false,
        isReposted: (p.isReposted as boolean) || false,
        isValidated: (p.isValidated as boolean) || false,
    }));

    const handlePostClick = useCallback((post: Post) => {
        navigate(Screen.POST_THREAD, { postId: post.id });
    }, [navigate]);

    const handleUserClick = useCallback((e: React.MouseEvent, author: Post["author"]) => {
        e.stopPropagation();
        navigate(Screen.PROFILE, { handle: author.handle });
    }, [navigate]);

    const handleCommentClick = useCallback((e: React.MouseEvent, post: Post) => {
        e.stopPropagation();
        navigate(Screen.POST_THREAD, { postId: post.id });
    }, [navigate]);

    const handleLike = useCallback((_id: string) => {
        // Like mutation will be called by PostCard
    }, []);

    const handleRepost = useCallback((_id: string) => {
        // Repost mutation will be called by PostCard
    }, []);

    const handleMenuAction = useCallback((_e: React.MouseEvent, _action: string, _post: Post) => {
        // Menu actions (copy link, mute, block)
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-md sticky top-0 z-30 border-b border-border">
                <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-lg font-bold">Feed</h1>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(Screen.COMPOSE_POST)}
                    className="rounded-full"
                >
                    <Feather className="w-5 h-5" />
                </Button>
            </header>

            <main className="flex-1">
                {status === "LoadingFirstPage" ? (
                    <div className="space-y-0">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 border-b border-border">
                                <div className="flex gap-3">
                                    <Skeleton className="w-12 h-12 rounded-xl" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Feather className="w-16 h-16 text-muted-foreground/20 mb-4" />
                        <p className="text-lg font-bold text-muted-foreground">No posts yet</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">Be the first to share something</p>
                        <Button
                            onClick={() => navigate(Screen.COMPOSE_POST)}
                            className="mt-4 rounded-full"
                        >
                            Create Post
                        </Button>
                    </div>
                ) : (
                    <>
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onPostClick={handlePostClick}
                                onUserClick={handleUserClick}
                                onCommentClick={handleCommentClick}
                                onLike={handleLike}
                                onRepost={handleRepost}
                                onMenuAction={handleMenuAction}
                            />
                        ))}
                        {status === "CanLoadMore" && (
                            <div className="p-4 flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => loadMore(20)}
                                    className="rounded-full"
                                >
                                    Load more
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
