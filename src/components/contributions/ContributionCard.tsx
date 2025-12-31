import React from 'react';
import { ContributionItem, User, Screen } from '@/types';
import { IconRenderer } from '@/components/shared/IconRenderer';
import { CommentItem } from './CommentItem';

interface ContributionCardProps {
    item: ContributionItem;
    listType: 'my' | 'saved' | 'moderation';
    navigate: (screen: Screen, params?: any) => void;
    onViewProfile: (user: User) => void;
    handleVote: (e: React.MouseEvent, id: string, voteType: 'up' | 'down', listType: 'my' | 'saved' | 'moderation') => void;
    toggleComments: (e: React.MouseEvent, id: string, listType: 'my' | 'saved' | 'moderation') => void;
    handleShareClick: (e: React.MouseEvent, item: ContributionItem) => void;
    inputTexts: { [key: string]: string };
    onInputChange: (id: string, text: string) => void;
    addComment: (id: string, listType: 'my' | 'saved' | 'moderation') => void;
    replyTexts: { [key: string]: string };
    onReplyTextChange: (id: string, text: string) => void;
    onAddReply: (contributionId: string, parentId: string, listType: 'my' | 'saved' | 'moderation') => void;
    onCommentVote: (e: React.MouseEvent, contributionId: string, commentId: string, voteType: 'up' | 'down', listType: 'my' | 'saved' | 'moderation') => void;
    onToggleReply: (e: React.MouseEvent, contributionId: string, commentId: string, listType: 'my' | 'saved' | 'moderation') => void;
    currentUserAvatar: string;
}

export const ContributionCard: React.FC<ContributionCardProps> = ({
    item,
    listType,
    navigate,
    onViewProfile,
    handleVote,
    toggleComments,
    handleShareClick,
    inputTexts,
    onInputChange,
    addComment,
    replyTexts,
    onReplyTextChange,
    onAddReply,
    onCommentVote,
    onToggleReply,
    currentUserAvatar
}) => {
    const handleNavigate = (item: ContributionItem) => {
        if (item.type === 'Story') navigate(Screen.STORY_DETAIL);
        if (item.type === 'Word') navigate(Screen.WORD_DETAIL);
        if (item.type === 'Proverb') navigate(Screen.PROVERB_DETAIL);
    };

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden transition-all hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30 group">
            <div className="p-4" onClick={() => handleNavigate(item)}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                            style={{
                                backgroundColor: item.type === 'Story' ? 'rgba(234, 88, 12, 0.1)' :
                                    item.type === 'Proverb' ? 'rgba(220, 38, 38, 0.1)' :
                                        'rgba(202, 138, 4, 0.1)',
                                color: item.type === 'Story' ? '#ea580c' :
                                    item.type === 'Proverb' ? '#dc2626' :
                                        '#ca8a04'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (item.author) {
                                    onViewProfile({
                                        name: item.author.name,
                                        handle: item.author.handle || 'user',
                                        avatar: item.author.avatar,
                                        isGuest: false
                                    });
                                }
                            }}
                        >
                            <IconRenderer name={item.icon} size={20} />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-stone-500 dark:text-text-muted uppercase tracking-wider">{item.type}</span>
                            <p className="text-xs text-stone-500 dark:text-text-muted">{item.subtitle}</p>
                        </div>
                    </div>
                    {listType === 'my' && (
                        <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${item.status === 'Live' ? 'bg-rasta-green/10 text-rasta-green' :
                                item.status === 'Under Review' ? 'bg-rasta-gold/10 text-rasta-gold' :
                                    'bg-rasta-red/10 text-rasta-red'
                            }`}>
                            {item.status}
                        </div>
                    )}
                </div>

                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1 mt-2 flex items-center gap-2">
                    {item.title}
                    {listType === 'my' && item.status === 'Under Review' && (
                        <IconRenderer name="edit_note" size={12} className="bg-primary/10 text-primary p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </h3>
                {item.attachments && item.attachments.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 bg-stone-50 dark:bg-white/5 w-fit px-2 py-1 rounded-lg border border-stone-100 dark:border-white/5">
                        <IconRenderer name="attachment" size={14} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {item.attachments.length} Attachment{item.attachments.length > 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>

            <div className="px-4 py-3 border-t border-stone-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-stone-100 dark:bg-white/5 rounded-full px-2 py-1">
                        <button onClick={(e) => handleVote(e, item.id, 'up', listType)} className={`p-1 rounded-full hover:bg-stone-200 dark:hover:bg-white/10 transition-colors ${item.userVote === 'up' ? 'text-primary' : 'text-stone-500 dark:text-text-muted'}`}>
                            <IconRenderer name="thumb_up" size={18} fill={item.userVote === 'up'} className={item.userVote === 'up' ? 'text-primary' : ''} />
                        </button>
                        <span className={`text-sm font-bold mx-1 ${item.userVote === 'up' ? 'text-primary' : item.userVote === 'down' ? 'text-error' : 'text-stone-700 dark:text-white'}`}>{item.likes}</span>

                        <div className="w-px h-4 bg-stone-300 dark:bg-white/20 mx-1"></div>

                        <button onClick={(e) => handleVote(e, item.id, 'down', listType)} className={`p-1 rounded-full hover:bg-stone-200 dark:hover:bg-white/10 transition-colors ${item.userVote === 'down' ? 'text-error' : 'text-stone-500 dark:text-text-muted'}`}>
                            <IconRenderer name="thumb_down" size={18} fill={item.userVote === 'down'} className={item.userVote === 'down' ? 'text-error' : ''} />
                        </button>
                    </div>
                    <button onClick={(e) => toggleComments(e, item.id, listType)} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors ${item.showComments ? 'bg-primary/10 text-primary' : 'hover:bg-stone-100 dark:hover:bg-white/5 text-stone-500 dark:text-text-muted'}`}>
                        <IconRenderer name="chat_bubble" size={18} fill={item.showComments} />
                        <span className="text-sm font-bold">{item.commentsCount}</span>
                    </button>
                </div>
                <button onClick={(e) => handleShareClick(e, item)} className="text-stone-400 dark:text-text-muted hover:text-stone-900 dark:hover:text-white transition-colors"><IconRenderer name="share" /></button>
            </div>

            {item.showComments && (
                <div className="bg-stone-50/50 dark:bg-black/10 border-t border-stone-100 dark:border-white/5 p-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-3 mb-4">
                        <img src={currentUserAvatar} alt="You" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={inputTexts[item.id] || ''}
                                onChange={(e) => onInputChange(item.id, e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 bg-white dark:bg-black/20 border border-stone-200 dark:border-white/10 rounded-full px-4 py-2 text-sm text-stone-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && addComment(item.id, listType)}
                            />
                            <button
                                onClick={() => addComment(item.id, listType)}
                                disabled={!inputTexts[item.id]?.trim()}
                                className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-primary-hover shadow-sm"
                            >
                                <IconRenderer name="send" size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                        {item.comments.length > 0 ? (
                            item.comments.map(comment => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    contributionId={item.id}
                                    listType={listType}
                                    replyTexts={replyTexts}
                                    onReplyTextChange={onReplyTextChange}
                                    onAddReply={onAddReply}
                                    onCommentVote={onCommentVote}
                                    onToggleReply={onToggleReply}
                                />
                            ))
                        ) : (
                            <div className="text-center py-4 text-stone-500 dark:text-text-muted text-sm">No comments yet.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
