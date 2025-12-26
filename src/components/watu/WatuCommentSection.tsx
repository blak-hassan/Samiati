import React from 'react';
import { Comment } from '@/types';

interface WatuCommentSectionProps {
    comments: Comment[];
    contributionId: string;
    currentUserAvatar: string;
    inputText: string;
    replyTexts: { [key: string]: string };
    onInputChange: (text: string) => void;
    onReplyTextChange: (commentId: string, text: string) => void;
    onAddComment: () => void;
    onAddReply: (parentId: string) => void;
    onCommentVote: (e: React.MouseEvent, commentId: string, voteType: 'up' | 'down') => void;
    onToggleReply: (e: React.MouseEvent, commentId: string) => void;
}

const CommentItem: React.FC<{
    comment: Comment;
    contributionId: string;
    depth: number;
    replyTexts: { [key: string]: string };
    onReplyTextChange: (commentId: string, text: string) => void;
    onAddReply: (parentId: string) => void;
    onCommentVote: (e: React.MouseEvent, commentId: string, voteType: 'up' | 'down') => void;
    onToggleReply: (e: React.MouseEvent, commentId: string) => void;
}> = ({ comment, contributionId, depth, replyTexts, onReplyTextChange, onAddReply, onCommentVote, onToggleReply }) => {
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
                        onClick={(e) => onCommentVote(e, comment.id, 'up')}
                        className={`flex items-center gap-1 text-xs font-medium ${comment.userVote === 'up' ? 'text-primary' : 'text-stone-500 dark:text-text-muted hover:text-stone-900 dark:hover:text-white'}`}
                        aria-label="Like comment"
                    >
                        <span className={`material-symbols-outlined text-sm ${comment.userVote === 'up' ? 'fill-active' : ''}`}>thumb_up</span>
                        {comment.likes > 0 && <span>{comment.likes}</span>}
                    </button>
                    <button
                        onClick={(e) => onCommentVote(e, comment.id, 'down')}
                        className={`flex items-center gap-1 text-xs font-medium ${comment.userVote === 'down' ? 'text-error' : 'text-stone-500 dark:text-text-muted hover:text-stone-900 dark:hover:text-white'}`}
                        aria-label="Dislike comment"
                    >
                        <span className={`material-symbols-outlined text-sm ${comment.userVote === 'down' ? 'fill-active' : ''}`}>thumb_down</span>
                    </button>
                    <button
                        onClick={(e) => onToggleReply(e, comment.id)}
                        className="text-xs font-bold text-stone-500 dark:text-text-muted hover:text-stone-900 dark:hover:text-white"
                        aria-label="Reply to comment"
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
                            onKeyDown={(e) => e.key === 'Enter' && onAddReply(comment.id)}
                            aria-label="Reply input"
                        />
                        <button
                            onClick={() => onAddReply(comment.id)}
                            disabled={!replyTexts[comment.id]?.trim()}
                            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-primary-hover"
                            aria-label="Send reply"
                        >
                            <span className="material-symbols-outlined text-lg">send</span>
                        </button>
                    </div>
                )}
                {comment.replies && comment.replies.length > 0 && comment.replies.map(reply => (
                    <CommentItem
                        key={reply.id}
                        comment={reply}
                        contributionId={contributionId}
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

export const WatuCommentSection: React.FC<WatuCommentSectionProps> = ({
    comments,
    contributionId,
    currentUserAvatar,
    inputText,
    replyTexts,
    onInputChange,
    onReplyTextChange,
    onAddComment,
    onAddReply,
    onCommentVote,
    onToggleReply
}) => {
    return (
        <div className="bg-stone-50/50 dark:bg-black/10 border-t border-stone-100 dark:border-white/5 p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex gap-3 mb-4">
                <img src={currentUserAvatar} alt="You" className="w-8 h-8 rounded-full object-cover shrink-0" />
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => onInputChange(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-white dark:bg-black/20 border border-stone-200 dark:border-white/10 rounded-full px-4 py-2 text-sm text-stone-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && onAddComment()}
                        aria-label="Add comment"
                    />
                    <button
                        onClick={onAddComment}
                        disabled={!inputText?.trim()}
                        className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-primary-hover shadow-sm"
                        aria-label="Post comment"
                    >
                        <span className="material-symbols-outlined text-lg">send</span>
                    </button>
                </div>
            </div>
            <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {comments.length > 0 ? (
                    comments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            contributionId={contributionId}
                            depth={0}
                            replyTexts={replyTexts}
                            onReplyTextChange={onReplyTextChange}
                            onAddReply={onAddReply}
                            onCommentVote={onCommentVote}
                            onToggleReply={onToggleReply}
                        />
                    ))
                ) : (
                    <div className="text-center py-4 text-stone-500 dark:text-text-muted text-sm">
                        No comments yet. Be the first to comment!
                    </div>
                )}
            </div>
        </div>
    );
};
