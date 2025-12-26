import { useState } from 'react';
import { Comment, ContributionItem } from '@/types';

const CURRENT_USER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w";

export function useComments(
    items: ContributionItem[],
    setItems: React.Dispatch<React.SetStateAction<ContributionItem[]>>
) {
    const [inputTexts, setInputTexts] = useState<{ [key: string]: string }>({});
    const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});

    const handleVote = (e: React.MouseEvent, id: string, voteType: 'up' | 'down') => {
        e.stopPropagation();
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;

            let newLikes = item.likes;
            let newDislikes = item.dislikes;
            let newVote = item.userVote;

            if (item.userVote === voteType) {
                newVote = null;
                if (voteType === 'up') newLikes--;
                else newDislikes--;
            } else {
                if (item.userVote === 'up') newLikes--;
                if (item.userVote === 'down') newDislikes--;

                newVote = voteType;
                if (voteType === 'up') newLikes++;
                else newDislikes++;
            }

            return { ...item, likes: newLikes, dislikes: newDislikes, userVote: newVote };
        }));
    };

    const toggleComments = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, showComments: !item.showComments } : item
        ));
    };

    const handleCommentVote = (e: React.MouseEvent, contributionId: string, commentId: string, voteType: 'up' | 'down') => {
        e.stopPropagation();
        const updateComments = (comments: Comment[]): Comment[] => {
            return comments.map(c => {
                if (c.id === commentId) {
                    let newLikes = c.likes;
                    let newDislikes = c.dislikes;
                    let newVote = c.userVote;

                    if (c.userVote === voteType) {
                        newVote = null;
                        if (voteType === 'up') newLikes--;
                        else newDislikes--;
                    } else {
                        if (c.userVote === 'up') newLikes--;
                        if (c.userVote === 'down') newDislikes--;
                        newVote = voteType;
                        if (voteType === 'up') newLikes++;
                        else newDislikes++;
                    }
                    return { ...c, likes: newLikes, dislikes: newDislikes, userVote: newVote };
                }
                if (c.replies.length > 0) {
                    return { ...c, replies: updateComments(c.replies) };
                }
                return c;
            });
        };

        setItems(prev => prev.map(item =>
            item.id === contributionId ? { ...item, comments: updateComments(item.comments) } : item
        ));
    };

    const toggleReplyInput = (e: React.MouseEvent, contributionId: string, commentId: string) => {
        e.stopPropagation();
        const updateComments = (comments: Comment[]): Comment[] => {
            return comments.map(c => {
                if (c.id === commentId) {
                    return { ...c, isReplying: !c.isReplying };
                }
                if (c.replies.length > 0) {
                    return { ...c, replies: updateComments(c.replies) };
                }
                return c;
            });
        };

        setItems(prev => prev.map(item =>
            item.id === contributionId ? { ...item, comments: updateComments(item.comments) } : item
        ));
    };

    const addComment = (contributionId: string) => {
        const text = inputTexts[contributionId];
        if (!text?.trim()) return;

        const newComment: Comment = {
            id: Date.now().toString(),
            author: 'You',
            avatar: CURRENT_USER_AVATAR,
            text: text,
            timestamp: 'Just now',
            likes: 0,
            dislikes: 0,
            userVote: null,
            replies: []
        };

        setItems(prev => prev.map(item =>
            item.id === contributionId ? {
                ...item,
                comments: [...item.comments, newComment],
                commentsCount: item.commentsCount + 1
            } : item
        ));

        setInputTexts(prev => ({ ...prev, [contributionId]: '' }));
    };

    const addReply = (contributionId: string, parentId: string) => {
        const text = replyTexts[parentId];
        if (!text?.trim()) return;

        const newReply: Comment = {
            id: Date.now().toString(),
            author: 'You',
            avatar: CURRENT_USER_AVATAR,
            text: text,
            timestamp: 'Just now',
            likes: 0,
            dislikes: 0,
            userVote: null,
            replies: []
        };

        const updateComments = (comments: Comment[]): Comment[] => {
            return comments.map(c => {
                if (c.id === parentId) {
                    return { ...c, replies: [...c.replies, newReply], isReplying: false };
                }
                if (c.replies.length > 0) {
                    return { ...c, replies: updateComments(c.replies) };
                }
                return c;
            });
        };

        setItems(prev => prev.map(item =>
            item.id === contributionId ? {
                ...item,
                comments: updateComments(item.comments),
                commentsCount: item.commentsCount + 1
            } : item
        ));

        setReplyTexts(prev => ({ ...prev, [parentId]: '' }));
    };

    return {
        inputTexts,
        setInputTexts,
        replyTexts,
        setReplyTexts,
        handleVote,
        toggleComments,
        handleCommentVote,
        toggleReplyInput,
        addComment,
        addReply
    };
}
