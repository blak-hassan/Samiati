
import React, { useState } from 'react';
import { Post } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Reply,
    Repeat2,
    Star,
    MoreHorizontal,
    Link,
    VolumeX,
    Ban,
    Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PollComponent } from './PollComponent';
import { LinkPreview } from './LinkPreview';
import { ProverbCard } from './content/ProverbCard';
import { StoryCard } from './content/StoryCard';
import { SongCard } from './content/SongCard';
import { HistoryCard } from './content/HistoryCard';

interface PostCardProps {
    post: Post;
    onPostClick: (post: Post) => void;
    onUserClick: (e: React.MouseEvent, author: Post['author']) => void;
    onCommentClick: (e: React.MouseEvent, post: Post) => void;
    onLike: (id: string) => void;
    onRepost: (id: string) => void;
    onMenuAction: (e: React.MouseEvent, action: string, post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
    post,
    onPostClick,
    onUserClick,
    onCommentClick,
    onLike,
    onRepost,
    onMenuAction
}) => {
    const hasSamiatiLink = post.content.includes('samiati.app');
    const [isContentExpanded, setIsContentExpanded] = useState(!post.cw);
    const [showAltText, setShowAltText] = useState(false);

    if (post.isFireplace) return null;

    const fullHandle = `@${post.author.handle}@samiati.social`;

    const renderContentWithHashtags = (text: string) => {
        const parts = text.split(/(#\w+)/g);
        return parts.map((part, i) => {
            if (part.startsWith('#') && part.length > 1) {
                return (
                    <span
                        key={i}
                        className="text-primary font-bold hover:underline cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            alert(`Navigating to hashtag: ${part}`);
                        }}
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    // Helper to detect specific simulated types from content or existing fields
    const isHistoryPost = post.content.includes('#SamiatiHistory');
    const isStoryPost = post.content.includes('#Folklore');

    return (
        <article
            onClick={() => onPostClick(post)}
            className={cn(
                "p-4 border-b border-border transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-4",
                "hover:bg-muted/40",
                post.isBounty && "bg-yellow-50/50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-500"
            )}
        >
            <div className="flex gap-3">
                <div onClick={(e) => onUserClick(e, post.author)} className="shrink-0 cursor-pointer pt-1 group/avatar">
                    <Avatar className="w-12 h-12 rounded-xl ring-2 ring-transparent group-hover/avatar:ring-primary/20 transition-all duration-300 shadow-sm">
                        <AvatarImage src={post.author.avatar} alt={post.author.name} />
                        <AvatarFallback className="rounded-xl bg-primary/5 text-primary font-bold">{post.author.name[0]}</AvatarFallback>
                    </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                        <div className="flex items-center gap-2 overflow-hidden flex-wrap">
                            <span className="font-bold text-foreground truncate hover:underline">{post.author.name}</span>
                            <span className="text-muted-foreground text-sm truncate max-w-[200px]">{fullHandle}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {post.languageTag && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-white/10 text-stone-500 dark:text-text-muted font-medium">{post.languageTag}</span>
                            )}
                            <span className="text-muted-foreground text-xs whitespace-nowrap hover:underline">{post.timestamp}</span>
                        </div>
                    </div>

                    {post.cw && (
                        <div className="flex items-center justify-between mb-2 p-2 bg-muted rounded-md border border-border">
                            <span className="text-sm font-bold text-foreground uppercase text-[10px] tracking-wide">{post.cw}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsContentExpanded(!isContentExpanded); }}
                                className="text-primary text-xs font-bold uppercase hover:underline"
                            >
                                {isContentExpanded ? 'Show Less' : 'Show More'}
                            </button>
                        </div>
                    )}

                    {isContentExpanded && (
                        <div className="animate-in fade-in duration-300">
                            {/* Proverb Card */}
                            {post.type === 'proverb' && post.proverbData ? (
                                <ProverbCard data={post.proverbData} />
                            ) : (
                                <div className="text-foreground text-[15px] leading-relaxed break-words whitespace-pre-wrap mb-2">
                                    {renderContentWithHashtags(post.content)}
                                </div>
                            )}

                            {/* Audio/Song Card */}
                            {post.type === 'audio' && (
                                <SongCard
                                    title="Traditional Drumming Session"
                                    artist={post.author.name}
                                    duration="2:45"
                                />
                            )}

                            {/* Simulated History Card */}
                            {isHistoryPost && (
                                <HistoryCard
                                    year="1963"
                                    location="Nairobi"
                                    fact="Kenya gains independence, replacing the Colony of Kenya. A monumental moment in East African history."
                                />
                            )}

                            {/* Simulated Story Card */}
                            {isStoryPost && (
                                <StoryCard
                                    title="The Tortoise and the Hare: A Reimagining"
                                    preview="Once upon a time, it wasn't just about speed. It was about wisdom. The tortoise knew the path..."
                                />
                            )}

                            {post.poll && <PollComponent poll={post.poll} />}

                            {post.image && (
                                <div className="mb-3 rounded-lg overflow-hidden border border-stone-200 dark:border-white/10 relative group">
                                    <img src={post.image} alt="Attachment" className="w-full h-auto object-cover max-h-80" />
                                    {post.altText && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowAltText(!showAltText); }}
                                                className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-black/80 transition-colors"
                                            >
                                                ALT
                                            </button>
                                            {showAltText && (
                                                <div className="absolute inset-0 bg-black/80 p-4 flex items-center justify-center text-white text-sm text-center animate-in fade-in cursor-default" onClick={(e) => { e.stopPropagation(); setShowAltText(false); }}>
                                                    <p>{post.altText}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {hasSamiatiLink && <LinkPreview url={post.content} />}
                        </div>
                    )}

                    <div className="flex items-center justify-between text-muted-foreground mt-3 max-w-sm">
                        <button
                            className="flex items-center gap-2 hover:text-primary transition-all duration-300 group active:scale-95"
                            onClick={(e) => onCommentClick(e, post)}
                            title="Reply"
                        >
                            <div className="p-2 transition-colors rounded-full group-hover:bg-primary/10 -ml-2">
                                <Reply className="w-5 h-5 group-hover:stroke-[2.5px] transition-all" />
                            </div>
                            <span className="text-xs font-medium">{post.stats.replies || 0}</span>
                        </button>

                        <button
                            className={cn(
                                "flex items-center gap-2 transition-all duration-300 group active:scale-95",
                                post.isReposted ? 'text-rasta-green' : 'hover:text-rasta-green'
                            )}
                            title="Boost"
                            onClick={(e) => { e.stopPropagation(); onRepost(post.id); }}
                        >
                            <div className={cn(
                                "p-2 transition-colors rounded-full",
                                post.isReposted ? "bg-rasta-green/10" : "group-hover:bg-rasta-green/10"
                            )}
                            >
                                <Repeat2 className={cn("w-5 h-5 transition-transform group-hover:rotate-180", post.isReposted && "fill-current")} />
                            </div>
                            <span className="text-xs font-medium">{post.stats.reposts || 0}</span>
                        </button>

                        <button
                            className={cn(
                                "flex items-center gap-2 transition-all duration-300 group active:scale-95",
                                post.isLiked ? 'text-yellow-500' : 'hover:text-yellow-500'
                            )}
                            title="Favorite"
                            onClick={(e) => { e.stopPropagation(); onLike(post.id); }}
                        >
                            <div className={cn(
                                "p-2 transition-colors rounded-full",
                                post.isLiked ? "bg-yellow-500/10" : "group-hover:bg-yellow-500/10"
                            )}>
                                <Star className={cn("w-5 h-5 transition-transform group-hover:scale-110", post.isLiked && "fill-current")} />
                            </div>
                            <span className="text-xs font-medium">{post.stats.likes || 0}</span>
                        </button>

                        <div className="relative">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-primary transition-colors rounded-full"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={(e) => onMenuAction(e, 'copy', post)} className="gap-3 font-medium">
                                        <Link className="w-4 h-4" />
                                        Copy link to post
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => onMenuAction(e, 'mute', post)} className="gap-3 font-medium">
                                        <VolumeX className="w-4 h-4" />
                                        Mute @{post.author.handle}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => onMenuAction(e, 'block', post)} className="gap-3 text-error font-medium focus:text-error">
                                        <Ban className="w-4 h-4" />
                                        Block @{post.author.handle}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
};
