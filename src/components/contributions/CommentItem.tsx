import React from 'react';
import { Comment, Screen, User } from '@/types';
import { IconRenderer } from '@/components/shared/IconRenderer';

interface CommentItemProps {
    comment: Comment;
    contributionId: string;
    listType: 'my' | 'saved' | 'moderation';
    depth?: number;
    replyTexts: { [key: string]: string };
    onReplyTextChange: (id: string, text: string) => void;
    onAddReply: (contributionId: string, parentId: string, listType: 'my' | 'saved' | 'moderation') => void;
    onCommentVote: (e: React.MouseEvent, contributionId: string, commentId: string, voteType: 'up' | 'down', listType: 'my' | 'saved' | 'moderation') => void;
    onToggleReply: (e: React.MouseEvent, contributionId: string, commentId: string, listType: 'my' | 'saved' | 'moderation') => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    contributionId,
    listType,
    depth = 0,
    replyTexts,
    onReplyTextChange,
    onAddReply,
    onCommentVote,
    onToggleReply
}) => {
    return (
        <div className={`flex gap-3 mt-4 ${depth > 0 ? 'ml-8 border-l-2 border-stone-100 dark:border-white/5 pl-4' : ''}`}>
            <img src={comment.avatar} alt={comment.author} className="w-8 h-8 rounded-full object-cover shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="bg-stone-50 dark:bg-white/5 rounded-2xl rounded-tl-none p-3">
                    <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-stone-900 dark:text-white">{comment.author}</span>
                        <span className="text-xs text-stone-500 dark:text-text-muted">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm text-stone-700 dark:text-text-main mt-1 break-words">{comment.text}</p>
                </div>
                <div className="flex items-center gap-4 mt-1 ml-1">
                    <button
                        onClick={(e) => onCommentVote(e, contributionId, comment.id, 'up', listType)}
                        className={`flex items-center gap-1 text-xs font-medium ${comment.userVote === 'up' ? 'text-primary' : 'text-stone-500 dark:text-text-muted hover:text-stone-900 dark:hover:text-white'}`}
                    >
                        <IconRenderer name="thumb_up" size={14} fill={comment.userVote === 'up'} />
                        {comment.likes > 0 && <span>{comment.likes}</span>}
                    </button>
                    <button
                        onClick={(e) => onCommentVote(e, contributionId, comment.id, 'down', listType)}
                        className={`flex items-center gap-1 text-xs font-medium ${comment.userVote === 'down' ? 'text-error' : 'text-stone-500 dark:text-text-muted hover:text-stone-900 dark:hover:text-white'}`}
                    >
                        <IconRenderer name="thumb_down" size={14} fill={comment.userVote === 'down'} />
                    </button>
                    <button
                        onClick={(e) => onToggleReply(e, contributionId, comment.id, listType)}
                        className="text-xs font-bold text-stone-500 dark:text-text-muted hover:text-stone-900 dark:hover:text-white"
                    >
                        Reply
                    </button>
                </div>
                {comment.isReplying && (
                    <div className="mt-3 flex gap-2 animate-in slide-in-from-top-2 duration-200">
                        <input
                            type="text"
                            value={replyTexts[comment.id] || ''}
                            onChange={(e) => onReplyTextChange(comment.id, e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 bg-stone-100 dark:bg-black/20 border-none rounded-full px-4 py-2 text-sm text-stone-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && onAddReply(contributionId, comment.id, listType)}
                        />
                        <button
                            onClick={() => onAddReply(contributionId, comment.id, listType)}
                            disabled={!replyTexts[comment.id]?.trim()}
                            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-primary-hover shadow-sm"
                        >
                            <IconRenderer name="send" size={16} />
                        </button>
                    </div>
                )}
                {comment.replies && comment.replies.length > 0 && comment.replies.map(reply => (
                    <CommentItem
                        key={reply.id}
                        comment={reply}
                        contributionId={contributionId}
                        listType={listType}
                        depth={depth + 1}
                        replyTexts={replyTexts}
                        onReplyTextChange={onReplyTextChange}
                        onAddReply={onAddReply}
                        onCommentVote={onCommentVote}
                        onToggleReply={onToggleReply}
                    />
                ))}
            </div>
        </div>
    );
};
