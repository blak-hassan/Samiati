"use client";
import React from "react";

interface StorageImageProps {
    storageId: string;
    alt: string;
    className?: string;
}

export function StorageImage({ storageId, alt, className }: StorageImageProps) {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const url = convexUrl
        ? `${convexUrl}/api/storage/${storageId}`
        : null;

    if (!url) {
        return (
            <div className={className}>
                <div className="w-full h-full bg-muted animate-pulse rounded" />
            </div>
        );
    }

    return <img src={url} alt={alt} className={className} loading="lazy" />;
}
