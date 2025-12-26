import React, { useState, useEffect, useRef } from 'react';
import { Screen, Post } from '@/types';
import {
    ArrowLeft,
    MoreVertical,
    Heart,
    MessageCircle,
    Repeat2,
    Share2,
    Send,
    Image as ImageIcon,
    MapPin,
    Sparkles,
    Bookmark,
    MoreHorizontal,
    VolumeX,
    Ban,
    Flag,
    Globe,
    CheckCircle2,
    Star,
    MessageSquare,
    Reply,
    Smile,
    Users,
    ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
    navigate: (screen: Screen) => void;
    goBack: () => void;
    post: Post;
    onLike: (postId: string) => void;
    onRepost: (postId: string) => void;
    autoFocusReply?: boolean;
}

const PollComponent = ({ poll }: { poll: Post['poll'] }) => {
    if (!poll) return null;
    const [localPoll, setLocalPoll] = useState(poll);

    const handleVote = (optionId: string) => {
        if (localPoll.userVotedOptionId) return;
        setLocalPoll(prev => ({
            ...prev,
            totalVotes: prev.totalVotes + 1,
            userVotedOptionId: optionId,
            options: prev.options.map(opt =>
                opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            )
        }));
    };

    return (
        <div className="mt-4 flex flex-col gap-3">
            {localPoll.options.map(option => {
                const percentage = localPoll.totalVotes > 0
                    ? Math.round((option.votes / localPoll.totalVotes) * 100)
                    : 0;
                const isSelected = localPoll.userVotedOptionId === option.id;

                return (
                    <div
                        key={option.id}
                        onClick={() => handleVote(option.id)}
                        className={cn(
                            "relative h-11 rounded-xl overflow-hidden cursor-pointer group transition-all border border-border/50 bg-muted/20",
                            !localPoll.userVotedOptionId && "hover:bg-muted/40 hover:border-primary/30"
                        )}
                    >
                        {localPoll.userVotedOptionId && (
                            <div
                                className={cn(
                                    "absolute inset-y-0 left-0 transition-all duration-700",
                                    isSelected ? "bg-primary/30" : "bg-muted"
                                )}
                                style={{ width: `${percentage}%` }}
                            />
                        )}

                        <div className="absolute inset-0 flex items-center justify-between px-4">
                            <span className={cn(
                                "text-sm font-bold z-10 flex items-center gap-2",
                                isSelected ? "text-primary" : "text-foreground"
                            )}>
                                {localPoll.userVotedOptionId && isSelected && <CheckCircle2 className="w-4 h-4" />}
                                {option.label}
                            </span>
                            {localPoll.userVotedOptionId && (
                                <span className="font-black text-xs text-muted-foreground z-10 font-mono">{percentage}%</span>
                            )}
                        </div>
                    </div>
                );
            })}
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mt-1 px-1">
                <Users className="w-3 h-3" />
                {localPoll.totalVotes} votes • Ends in {localPoll.endsAt}
            </div>
        </div>
    );
};

const PostThreadScreen: React.FC<Props> = ({ goBack, post, onLike, onRepost, autoFocusReply }) => {
    const [replyText, setReplyText] = useState('');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Local state for UI interactions
    const [isContentExpanded, setIsContentExpanded] = useState(!post?.cw);
    const [showAltText, setShowAltText] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const replyInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        if (activeMenuId) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeMenuId]);

    useEffect(() => {
        if (autoFocusReply && replyInputRef.current) {
            setTimeout(() => {
                replyInputRef.current?.focus();
            }, 100);
        }
    }, [autoFocusReply]);

    const toggleMenu = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setActiveMenuId(prev => prev === id ? null : id);
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2000);
    };

    const handleMenuAction = (e: React.MouseEvent, action: string) => {
        e.stopPropagation();
        setActiveMenuId(null);
        if (action === 'share') {
            navigator.clipboard.writeText(`https://samiati.app/post/${post.id}`);
            showToast('Link copied to clipboard');
        } else if (action === 'mute') {
            showToast(`Muted @${post.author.handle}`);
        } else if (action === 'block') {
            showToast(`Blocked @${post.author.handle}`);
        } else if (action === 'report') {
            showToast('Report submitted');
        }
    };

    const handleBookmark = () => {
        setIsBookmarked(!isBookmarked);
        showToast(isBookmarked ? 'Removed from Bookmarks' : 'Post Bookmarked');
    };

    const handleCommentClick = () => {
        replyInputRef.current?.focus();
    };

    const handlePublishReply = () => {
        if (!replyText.trim()) return;
        showToast('Reply sent!');
        setReplyText('');
    };

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

    const MenuDropdownContent = () => (
        <div className="flex flex-col p-1.5">
            <Button
                variant="ghost"
                onClick={(e) => handleMenuAction(e, 'share')}
                className="w-full justify-start gap-4 h-11 px-4 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-muted"
            >
                <Share2 className="w-4 h-4 text-muted-foreground" />
                Share Post
            </Button>
            <Button
                variant="ghost"
                onClick={(e) => handleMenuAction(e, 'mute')}
                className="w-full justify-start gap-4 h-11 px-4 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-muted"
            >
                <VolumeX className="w-4 h-4 text-muted-foreground" />
                Mute user
            </Button>
            <Button
                variant="ghost"
                onClick={(e) => handleMenuAction(e, 'block')}
                className="w-full justify-start gap-4 h-11 px-4 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-muted"
            >
                <Ban className="w-4 h-4 text-muted-foreground" />
                Block user
            </Button>
            <Separator className="my-1.5 opacity-50" />
            <Button
                variant="ghost"
                onClick={(e) => handleMenuAction(e, 'report')}
                className="w-full justify-start gap-4 h-11 px-4 text-xs font-bold uppercase tracking-widest rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
                <Flag className="w-4 h-4" />
                Report Post
            </Button>
        </div>
    );

    if (!post) return null;

    const fullHandle = `@${post.author.handle}@samiati.social`;

    return (
        <div className="flex flex-col h-full bg-background transition-colors duration-300 relative">
            <header className="flex items-center px-4 h-14 sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border shrink-0">
                <Button variant="ghost" size="sm" onClick={goBack} className="flex items-center gap-2 text-primary font-black uppercase text-[11px] tracking-widest hover:bg-primary/5">
                    <ArrowLeft className="w-5 h-5 text-primary" />
                    Back
                </Button>
                <h1 className="flex-1 text-center font-bold text-foreground text-sm tracking-tight">Post Details</h1>
                <div className="w-16"></div>
            </header>

            <main className="flex-1 overflow-y-auto pb-24">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-4 mb-6">
                        <Avatar className="w-14 h-14 rounded-2xl border border-border shadow-sm">
                            <AvatarImage src={post.author.avatar} className="object-cover" />
                            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <div className="font-black text-foreground text-lg tracking-tight leading-tight">{post.author.name}</div>
                            <div className="text-muted-foreground text-xs font-bold font-mono tracking-tighter opacity-70">{fullHandle}</div>
                        </div>
                    </div>

                    {/* CW Header */}
                    {post.cw && (
                        <div className="flex items-center justify-between mb-6 p-4 bg-muted/50 rounded-2xl border border-primary/10">
                            <div className="flex items-center gap-3">
                                <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/20 border-none px-2.5 h-6 text-[10px] font-black uppercase tracking-widest">CW</Badge>
                                <span className="font-black text-xs text-foreground uppercase tracking-widest">{post.cw}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsContentExpanded(!isContentExpanded)}
                                className="text-primary font-black uppercase text-[10px] tracking-[0.2em] p-0 h-6 hover:bg-transparent"
                            >
                                {isContentExpanded ? 'Minimize' : 'Expand'}
                            </Button>
                        </div>
                    )}

                    {isContentExpanded && (
                        <div className="animate-in fade-in duration-300">
                            <div className="text-foreground text-xl leading-relaxed mb-6 whitespace-pre-wrap font-medium tracking-tight">
                                {renderContentWithHashtags(post.content)}
                            </div>

                            {post.poll && <PollComponent poll={post.poll} />}

                            {post.image && (
                                <div className="mb-6 rounded-3xl overflow-hidden border border-border shadow-2xl relative group bg-muted/10">
                                    <img src={post.image} alt={post.altText || "Post content"} className="w-full h-auto max-h-[600px] object-contain" />
                                    {post.altText && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => setShowAltText(!showAltText)}
                                                className="absolute bottom-4 left-4 h-8 bg-black/70 text-white text-[10px] font-black tracking-widest uppercase hover:bg-black/90 backdrop-blur-md rounded-xl"
                                            >
                                                ALT
                                            </Button>
                                            {showAltText && (
                                                <div className="absolute inset-0 bg-background/95 backdrop-blur-xl p-8 flex flex-col items-center justify-center text-foreground animate-in fade-in duration-300 cursor-default" onClick={() => setShowAltText(false)}>
                                                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Image Description</p>
                                                    <p className="text-lg font-medium leading-relaxed italic text-center max-w-lg">{post.altText}</p>
                                                    <Button variant="ghost" size="sm" className="mt-8 font-black text-xs uppercase tracking-[0.2em]">Close</Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-3 text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-6 py-4 border-y border-border/50">
                        <span>{post.timestamp}</span>
                        <Separator orientation="vertical" className="h-2.5" />
                        <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Public</span>
                        <Separator orientation="vertical" className="h-2.5 ml-auto" />
                        <span className="text-primary">samiati.social</span>
                    </div>

                    <div className="flex items-center gap-6 mb-2">
                        <div className="flex items-center gap-1.5 group cursor-pointer">
                            <span className="font-black text-foreground text-sm tracking-tight">{post.stats.reposts + (post.isReposted ? 1 : 0)}</span>
                            <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest group-hover:text-primary transition-colors">Boosts</span>
                        </div>
                        <div className="flex items-center gap-1.5 group cursor-pointer">
                            <span className="font-black text-foreground text-sm tracking-tight">{post.stats.likes}</span>
                            <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest group-hover:text-primary transition-colors">Favorites</span>
                        </div>
                    </div>

                </div>

                {/* Replies */}
                <div className="space-y-0">
                    <div className="px-6 pt-8 pb-3 border-b border-border/40">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" />
                            Conversation
                        </h2>
                    </div>
                    {post.replies && post.replies.length > 0 ? (
                        post.replies.map(reply => (
                            <div key={reply.id} className="flex gap-4 p-6 border-b border-border/40 hover:bg-muted/30 transition-all duration-300 group">
                                <Avatar className="w-10 h-10 rounded-xl border border-border group-hover:scale-110 transition-transform">
                                    <AvatarImage src={reply.author.avatar} className="object-cover" />
                                    <AvatarFallback>{reply.author.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-foreground truncate text-sm tracking-tight">{reply.author.name}</span>
                                            <span className="text-muted-foreground text-[10px] font-bold font-mono tracking-tighter opacity-60">{reply.timestamp}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary rounded-full group-hover:bg-primary/5 transition-all">
                                            <MoreVertical className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                    <p className="text-foreground text-sm leading-relaxed font-medium">{renderContentWithHashtags(reply.content)}</p>

                                    <div className="flex items-center gap-6 pt-1">
                                        <Button variant="ghost" size="sm" className="h-8 px-0 gap-2 text-muted-foreground hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest hover:bg-transparent">
                                            <Reply className="w-3.5 h-3.5" />
                                            Reply
                                        </Button>
                                        <Button variant="ghost" size="sm" className={cn(
                                            "h-8 px-0 gap-2 transition-colors text-[10px] font-black uppercase tracking-widest hover:bg-transparent",
                                            reply.stats.likes > 0 ? "text-yellow-600" : "text-muted-foreground hover:text-yellow-600"
                                        )}>
                                            <Star className={cn("w-3.5 h-3.5", reply.stats.likes > 0 && "fill-yellow-600")} />
                                            {reply.stats.likes > 0 && <span>{reply.stats.likes}</span>}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-16 text-center flex flex-col items-center gap-4 text-muted-foreground/30">
                            <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center animate-pulse">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-[0.2em]">Silence is golden</p>
                                <p className="text-[11px] font-medium italic opacity-60 px-8">No replies yet. Be the first to start the conversation!</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Reply Input */}
            <div className="border-t border-border bg-background/95 backdrop-blur-md p-4 sticky bottom-0 z-30 shrink-0">
                <div className="flex gap-4 items-end max-w-4xl mx-auto">
                    <Avatar className="w-10 h-10 rounded-xl border border-border shadow-sm mb-1 hidden sm:flex">
                        <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeLXbWz4AzkUBDUb3vYkhuHrvvC9EFxb7YuDTFXSRV6e6T547HBjftD2_M3MWQ23u8DdygDU3-kcrmReHHcg1xuI2vz_fBK_UAfIaTV6tCpEh1xW7vkPs6qjbSwVjkqUkPXcPuBDRL_I0E_dA3ckyiMN2POsZ3M2E57RwaQqNiSED1NzWUTMmbbesb_Ko-z2BYoXtkkWP0lVOyL0aKlkzlpsNevnW1dPGKRZ5SxqpNtu6pvvjeFLtIUcElhd54x2R98mDwi_k8K4w" className="object-cover" />
                        <AvatarFallback>ME</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 bg-muted/30 border border-border/50 rounded-[24px] px-5 py-3 focus-within:bg-background focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all group">
                        <Textarea
                            ref={replyInputRef}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to ${post.author.name}...`}
                            className="w-full bg-transparent border-none p-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/40 resize-none max-h-40 min-h-[24px] text-base leading-relaxed font-medium"
                            rows={1}
                        />
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/10 opacity-0 group-focus-within:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"><ImageIcon className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"><Smile className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"><MapPin className="w-4 h-4" /></Button>
                            </div>
                            <div className={cn(
                                "text-[9px] font-black font-mono tracking-tighter opacity-50",
                                replyText.length > 400 && "text-destructive opacity-100"
                            )}>
                                {500 - replyText.length}
                            </div>
                        </div>
                    </div>

                    <Button
                        size="icon"
                        onClick={handlePublishReply}
                        disabled={!replyText.trim()}
                        className="w-12 h-12 rounded-full shadow-2xl shadow-primary/30 transform active:scale-90 transition-all mb-0.5 shrink-0"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Toast Notification */}
            <div className={cn(
                "fixed bottom-28 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 flex items-center gap-3 transition-all duration-500 border border-background/20 backdrop-blur-md",
                toastMessage ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-90 pointer-events-none"
            )}>
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-black uppercase tracking-[0.15em]">{toastMessage}</span>
            </div>
        </div >
    );
};

export default PostThreadScreen;
