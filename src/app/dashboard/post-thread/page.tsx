"use client";

import React, { use } from "react";
import PostThreadScreen from "@/components/screens/PostThreadScreen";
import { useNavigation } from "@/hooks/useNavigation";
import { Post, RouteSearchParams } from "@/types";

export default function PostThreadPage({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
    const { navigate, goBack } = useNavigation();
    const resolvedSearchParams = use(searchParams);

    const post = resolvedSearchParams.post ? (JSON.parse(resolvedSearchParams.post as string) as Post) : undefined;
    const autoFocusReply = resolvedSearchParams.autoFocusReply === 'true';

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
