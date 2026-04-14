"use client";

import React, { use } from "react";
import PostThreadScreen from "@/components/screens/PostThreadScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { Post, RouteSearchParams } from "@/types";

export default function PostThreadPage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);

    const postParam = resolvedSearchParams.post;
    const post = (postParam && typeof postParam === 'string') ? (JSON.parse(postParam) as Post) : undefined;
    const autoFocusReply = resolvedSearchParams.autoFocusReply === 'true';

    if (!post) {
        return <div className="p-4">Post not found</div>;
    }

    return (
        <PostThreadScreen
            navigate={navigate}
            goBack={goBack}
            post={post}
            onLike={() => { }}
            onRepost={() => { }}
            autoFocusReply={autoFocusReply}
        />
    );
}
