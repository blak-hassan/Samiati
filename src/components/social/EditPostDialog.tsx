"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Post } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EditPostDialogProps {
    post: Post;
    onClose: () => void;
}

// SAM-06: lets the author edit their own post (content/type). Calls the
// `editPost` mutation which mirrors the create validation rules.
export function EditPostDialog({ post, onClose }: EditPostDialogProps) {
    const editPost = useMutation(api.posts.mutations.editPost);
    const [content, setContent] = useState(post.content);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!content.trim()) {
            setError("Content cannot be empty");
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            await editPost({
                postId: post.id as Id<"posts">,
                content: content.trim(),
                type: post.type,
            });
            onClose();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark w-full sm:max-w-md rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-white/10">
                <h3 className="font-bold text-lg text-stone-900 dark:text-white mb-4">Edit post</h3>
                <Textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    className="min-h-28 text-base"
                    maxLength={5000}
                />
                {error && (
                    <p className="text-destructive text-sm mt-2">{error}</p>
                )}
                <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving…" : "Save"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
