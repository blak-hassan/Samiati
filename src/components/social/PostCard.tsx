
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
    HandMetal,
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
import { useInView } from '@/hooks/useInView';
import { StorageImage } from '@/components/shared/StorageImage';

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

    const [localLiked, setLocalLiked] = useState(post.isLiked);
    const [localClapped, setLocalClapped] = useState(post.isReposted);
    const [localLikeCount, setLocalLikeCount] = useState(post.stats.likes || 0);
    const [localClapCount, setLocalClapCount] = useState(post.stats.reposts || 0);
    const [likeAnimating, setLikeAnimating] = useState(false);
    const [clapAnimating, setClapAnimating] = useState(false);
    const [showBurst, setShowBurst] = useState(false);
    const [showClapRing, setShowClapRing] = useState(false);

    const { ref: cardRef, isInView } = useInView({ threshold: 0.1 });

    if (post.isFireplace) return null;

    const fullHandle = `@${post.author.handle}`;

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

    const isHistoryPost = post.content.includes('#SamiatiHistory');
    const isStoryPost = post.content.includes('#Folklore');

    return (
        <article
            ref={cardRef}
            onClick={() => onPostClick(post)}
            className={cn(
                "p-4 border-b border-border transition-all duration-300 cursor-pointer",
                "hover:bg-muted/40",
                isInView ? "animate-fade-in-up" : "opacity-0",
                post.isBounty && "bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-500/30"
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
                            {post.type === 'proverb' && post.proverbData ? (
                                <ProverbCard data={post.proverbData} />
                            ) : (
                                <div className="text-foreground text-[15px] leading-relaxed break-words whitespace-pre-wrap mb-2">
                                    {renderContentWithHashtags(post.content)}
                                </div>
                            )}

                            {post.type === 'audio' && (
                                <SongCard
                                    title="Traditional Drumming Session"
                                    artist={post.author.name}
                                    duration="2:45"
                                />
                            )}

                            {isHistoryPost && (
                                <HistoryCard
                                    year="1963"
                                    location="Nairobi"
                                    fact="Kenya gains independence, replacing the Colony of Kenya. A monumental moment in East African history."
                                />
                            )}

                            {isStoryPost && (
                                <StoryCard
                                    title="The Tortoise and the Hare: A Reimagining"
                                    preview="Once upon a time, it wasn't just about speed. It was about wisdom. The tortoise knew the path..."
                                />
                            )}

                            {post.poll && <PollComponent poll={post.poll} />}

                            {post.image && (
                                <div className="mb-3 rounded-lg overflow-hidden border border-stone-200 dark:border-white/10 relative group">
                                    {post.image.startsWith('data:') || post.image.startsWith('http') ? (
                                        <img src={post.image} alt="Attachment" className="w-full h-auto object-cover max-h-80 transition-transform duration-700 group-hover:scale-105"  loading="lazy" decoding="async" />
                                    ) : (
                                        <StorageImage storageId={post.image} alt="Attachment" className="w-full h-auto object-cover max-h-80 transition-transform duration-700 group-hover:scale-105" />
                                    )}
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
                                localClapped ? 'text-rasta-green' : 'hover:text-rasta-green'
                            )}
                            title="Clap"
                            onClick={(e) => {
                                e.stopPropagation();
                                setClapAnimating(true);
                                setShowClapRing(true);
                                setTimeout(() => setClapAnimating(false), 300);
                                setTimeout(() => setShowClapRing(false), 500);
                                setLocalClapped(!localClapped);
                                setLocalClapCount(prev => localClapped ? prev - 1 : prev + 1);
                                onRepost(post.id);
                            }}
                        >
                            <div className={cn(
                                "p-2 transition-all rounded-full relative",
                                localClapped ? "bg-rasta-green/10" : "group-hover:bg-rasta-green/10",
                                clapAnimating && "animate-spring-press"
                            )}>
                                <HandMetal className={cn(
                                    "w-5 h-5 transition-all duration-300",
                                    localClapped && "fill-current",
                                    clapAnimating && "rotate-12 scale-110"
                                )} />
                                {showClapRing && (
                                    <span className="absolute inset-0 rounded-full border-2 border-rasta-green animate-clap-ring pointer-events-none" />
                                )}
                            </div>
                            <span className={cn(
                                "text-xs font-medium transition-all",
                                clapAnimating && "scale-110 font-bold"
                            )}>{localClapCount}</span>
                        </button>

                        <button
                            className={cn(
                                "flex items-center gap-2 transition-all duration-300 group active:scale-95",
                                localLiked ? 'text-yellow-500' : 'hover:text-yellow-500'
                            )}
                            title="Favorite"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLikeAnimating(true);
                                setShowBurst(true);
                                setTimeout(() => setLikeAnimating(false), 300);
                                setTimeout(() => setShowBurst(false), 500);
                                setLocalLiked(!localLiked);
                                setLocalLikeCount(prev => localLiked ? prev - 1 : prev + 1);
                                onLike(post.id);
                            }}
                        >
                            <div className={cn(
                                "p-2 transition-all rounded-full relative",
                                localLiked ? "bg-yellow-500/10" : "group-hover:bg-yellow-500/10",
                                likeAnimating && "animate-spring-press"
                            )}>
                                <Star className={cn(
                                    "w-5 h-5 transition-all duration-300",
                                    localLiked && "fill-current",
                                    likeAnimating && "rotate-12 scale-125"
                                )} />
                                {showBurst && (
                                    <>
                                        <span className="absolute inset-0 rounded-full border-2 border-yellow-500 animate-burst-ring pointer-events-none" />
                                        {[...Array(6)].map((_, i) => {
                                            const angle = (i * 60) * (Math.PI / 180);
                                            const dist = 20;
                                            return (
                                                <span
                                                    key={i}
                                                    className="absolute w-1.5 h-1.5 rounded-full bg-yellow-500 animate-burst-particle pointer-events-none"
                                                    style={{
                                                        top: '50%',
                                                        left: '50%',
                                                        marginTop: '-3px',
                                                        marginLeft: '-3px',
                                                        '--tx': `${Math.cos(angle) * dist}px`,
                                                        '--ty': `${Math.sin(angle) * dist}px`,
                                                    } as React.CSSProperties}
                                                />
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                            <span className={cn(
                                "text-xs font-medium transition-all",
                                likeAnimating && "scale-110 font-bold"
                            )}>{localLikeCount}</span>
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
