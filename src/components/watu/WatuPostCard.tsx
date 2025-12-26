import React from 'react';
import { ContributionItem, User } from '@/types';
import { WatuCommentSection } from './WatuCommentSection';
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Quote, BookOpen, Sparkles } from 'lucide-react';

interface WatuPostCardProps {
    item: ContributionItem;
    currentUserAvatar: string;
    inputText: string;
    replyTexts: { [key: string]: string };
    onNavigate: (item: ContributionItem) => void;
    onVote: (e: React.MouseEvent, id: string, voteType: 'up' | 'down') => void;
    onToggleComments: (e: React.MouseEvent, id: string) => void;
    onInputChange: (text: string) => void;
    onReplyTextChange: (commentId: string, text: string) => void;
    onAddComment: () => void;
    onAddReply: (contributionId: string, parentId: string) => void;
    onCommentVote: (e: React.MouseEvent, commentId: string, voteType: 'up' | 'down') => void;
    onToggleReply: (e: React.MouseEvent, commentId: string) => void;
    onViewProfile: (user: User) => void;
}

export const WatuPostCard: React.FC<WatuPostCardProps> = ({
    item,
    currentUserAvatar,
    inputText,
    replyTexts,
    onNavigate,
    onVote,
    onToggleComments,
    onInputChange,
    onReplyTextChange,
    onAddComment,
    onAddReply,
    onCommentVote,
    onToggleReply,
    onViewProfile
}) => {

    // Helper to render icon based on type string
    const renderIcon = (iconName: string) => {
        switch (iconName) {
            case 'format_quote': return <Quote className="w-5 h-5" />;
            case 'menu_book': return <BookOpen className="w-5 h-5" />;
            default: return <Sparkles className="w-5 h-5" />;
        }
    };

    return (
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden transition-all hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30">
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        {item.author ? (
                            <img
                                src={item.author.avatar}
                                alt={item.author.name}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewProfile({
                                        name: item.author!.name,
                                        handle: item.author!.handle || 'user',
                                        avatar: item.author!.avatar,
                                        isGuest: false
                                    });
                                }}
                                className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-primary/30 transition-all"
                            />
                        ) : (
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === 'Story' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                item.type === 'Proverb' ? 'bg-rasta-red/10 text-rasta-red dark:bg-rasta-red/30 dark:text-red-400' :
                                    'bg-rasta-gold/10 text-amber-600 dark:bg-rasta-gold/20 dark:text-rasta-gold'
                                }`}>
                                {renderIcon(item.icon)}
                            </div>
                        )}
                        <div>
                            {item.author ? (
                                <div className="flex items-center gap-2">
                                    <h3
                                        className="text-sm font-bold text-stone-900 dark:text-white cursor-pointer hover:underline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewProfile({
                                                name: item.author!.name,
                                                handle: item.author!.handle || 'user',
                                                avatar: item.author!.avatar,
                                                isGuest: false
                                            });
                                        }}
                                    >
                                        {item.author.name}
                                    </h3>
                                    <span className="text-xs text-stone-500 dark:text-text-muted">•</span>
                                    <span className="text-xs text-stone-500 dark:text-text-muted">{item.type}</span>
                                </div>
                            ) : (
                                <span className="text-xs font-bold text-stone-500 dark:text-text-muted uppercase tracking-wider">{item.type}</span>
                            )}
                            <p className="text-xs text-stone-500 dark:text-text-muted">{item.subtitle}</p>
                        </div>
                    </div>
                </div>

                <h3
                    onClick={() => onNavigate(item)}
                    className="text-lg font-bold text-stone-900 dark:text-white mb-1 mt-2 cursor-pointer hover:text-primary transition-colors"
                >
                    {item.title}
                </h3>

                {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-4 py-3 border-t border-stone-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-stone-100 dark:bg-white/5 rounded-full px-2 py-1">
                        <button
                            onClick={(e) => onVote(e, item.id, 'up')}
                            className={`p-1 rounded-full hover:bg-stone-200 dark:hover:bg-white/10 transition-colors ${item.userVote === 'up' ? 'text-primary' : 'text-stone-500 dark:text-text-muted'}`}
                            aria-label="Like post"
                        >
                            <ThumbsUp className={`w-5 h-5 ${item.userVote === 'up' ? 'fill-current' : ''}`} />
                        </button>
                        <span className={`text-sm font-bold mx-1 ${item.userVote === 'up' ? 'text-primary' : item.userVote === 'down' ? 'text-error' : 'text-stone-700 dark:text-white'}`}>
                            {item.likes}
                        </span>

                        <div className="w-px h-4 bg-stone-300 dark:bg-white/20 mx-1"></div>

                        <button
                            onClick={(e) => onVote(e, item.id, 'down')}
                            className={`p-1 rounded-full hover:bg-stone-200 dark:hover:bg-white/10 transition-colors ${item.userVote === 'down' ? 'text-error' : 'text-stone-500 dark:text-text-muted'}`}
                            aria-label="Dislike post"
                        >
                            <ThumbsDown className={`w-5 h-5 ${item.userVote === 'down' ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                    <button
                        onClick={(e) => onToggleComments(e, item.id)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors ${item.showComments ? 'bg-primary/10 text-primary' : 'hover:bg-stone-100 dark:hover:bg-white/5 text-stone-500 dark:text-text-muted'}`}
                        aria-label={`${item.showComments ? 'Hide' : 'Show'} comments`}
                    >
                        <MessageCircle className={`w-5 h-5 ${item.showComments ? 'fill-current' : ''}`} />
                        <span className="text-sm font-bold">{item.commentsCount}</span>
                    </button>
                </div>
                <button
                    className="text-stone-400 dark:text-text-muted hover:text-stone-900 dark:hover:text-white transition-colors"
                    aria-label="Share post"
                    onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement share functionality
                        alert('Share functionality coming soon!');
                    }}
                >
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            {item.showComments && (
                <WatuCommentSection
                    comments={item.comments}
                    contributionId={item.id}
                    currentUserAvatar={currentUserAvatar}
                    inputText={inputText}
                    replyTexts={replyTexts}
                    onInputChange={onInputChange}
                    onReplyTextChange={onReplyTextChange}
                    onAddComment={onAddComment}
                    onAddReply={(parentId) => onAddReply(item.id, parentId)}
                    onCommentVote={onCommentVote}
                    onToggleReply={onToggleReply}
                />
            )}
        </div>
    );
};
