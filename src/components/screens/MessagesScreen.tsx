"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Screen, Post, User } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    MoreVertical,
    Settings,
    ArrowUpDown,
    ChevronDown,
    Globe,
    Check,
    Inbox,
    PenLine,
    Users,
    Bookmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FireplaceCard } from '@/components/social/FireplaceCard';
import { IconRenderer } from '@/components/shared/IconRenderer';
import { PostCard } from '@/components/social/PostCard';

interface Props {
    navigate: (screen: Screen, params?: any) => void;
    goBack: () => void;
    posts: Post[];
    onLike: (postId: string) => void;
    onRepost: (postId: string) => void;
    onViewProfile: (user: User) => void;
    unreadDmCount: number;
    onJoinFireplace: (post: Post) => void;
}

const MessagesScreen: React.FC<Props> = ({ navigate, goBack, posts, onLike, onRepost, onViewProfile, unreadDmCount, onJoinFireplace }) => {
    const [activeTab, setActiveTab] = useState<'Home' | 'Explore'>('Home');
    const [sortBy, setSortBy] = useState<'Latest' | 'Top' | 'Most Clapped'>('Latest');
    const [filterLanguage, setFilterLanguage] = useState('All');

    // Dropdown States
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showAppMenu, setShowAppMenu] = useState(false);

    // Refs for click outside
    const sortRef = useRef<HTMLDivElement>(null);
    const langRef = useRef<HTMLDivElement>(null);
    const appMenuRef = useRef<HTMLDivElement>(null);

    // Local state to manage muted/blocked users for this session
    const [hiddenUserIds, setHiddenUserIds] = useState<Set<string>>(new Set());

    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const scrollY = useRef(0);
    const mainRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(0);

    useEffect(() => {
        // Recalculate header height when tabs or sort options change height
        if (headerRef.current) {
            setTimeout(() => {
                if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
            }, 50);
        }
    }, [activeTab, sortBy, filterLanguage]);

    // Click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setShowSortMenu(false);
            }
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setShowLangMenu(false);
            }
            if (appMenuRef.current && !appMenuRef.current.contains(event.target as Node)) {
                setShowAppMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showAppMenu]);

    const handleScroll = () => {
        if (!mainRef.current) return;
        const currentScrollY = mainRef.current.scrollTop;
        const diff = currentScrollY - scrollY.current;

        if (currentScrollY < 0) return;

        if (diff > 10 && currentScrollY > 50) {
            setIsHeaderVisible(false);
        } else if (diff < -10) {
            setIsHeaderVisible(true);
        }

        scrollY.current = currentScrollY;
    };

    const handleMenuAction = (e: React.MouseEvent, action: string, post: Post) => {
        e.stopPropagation();
        if (action === 'copy') {
            navigator.clipboard.writeText(`https://samiati.app/toot/${post.id}`);
        } else if (action === 'mute') {
            alert(`Muted @${post.author.handle}`);
            setHiddenUserIds(prev => new Set(prev).add(post.author.handle));
        } else if (action === 'block') {
            alert(`Blocked @${post.author.handle}`);
            setHiddenUserIds(prev => new Set(prev).add(post.author.handle));
        }
    };

    const getDisplayPosts = () => {
        let filtered = posts.filter(p => !hiddenUserIds.has(p.author.handle));

        // 1. Filter Tab
        if (activeTab === 'Explore') {
            filtered = [...filtered].reverse();
        }

        // 2. Filter Language
        if (filterLanguage !== 'All') {
            filtered = filtered.filter(p => p.languageTag === filterLanguage);
        }

        // 3. Sort
        const sorted = [...filtered];
        if (sortBy === 'Top') {
            sorted.sort((a, b) => b.stats.likes - a.stats.likes);
        } else if (sortBy === 'Most Clapped') {
            sorted.sort((a, b) => b.stats.reposts - a.stats.reposts);
        }
        // 'Latest' default

        return sorted;
    };

    const displayPosts = getDisplayPosts();
    const fireplacePosts = posts.filter(p => p.isFireplace);

    const handlePostClick = (post: Post) => {
        navigate(Screen.POST_THREAD, { post });
    };

    const handleCommentClick = (e: React.MouseEvent, post: Post) => {
        e.stopPropagation();
        navigate(Screen.POST_THREAD, { post, autoFocusReply: true });
    };

    const handleUserClick = (e: React.MouseEvent, postAuthor: Post['author']) => {
        e.stopPropagation();
        onViewProfile({
            name: postAuthor.name,
            handle: postAuthor.handle,
            avatar: postAuthor.avatar,
            isGuest: false
        });
    };

    return (
        <div className="flex flex-col h-full bg-stone-50 dark:bg-background-dark text-stone-900 dark:text-text-main transition-colors duration-300 relative">
            <div
                ref={headerRef}
                className="transition-all duration-300 ease-in-out z-20 shadow-sm dark:shadow-none bg-white dark:bg-[#2B1F1C] absolute top-0 left-0 right-0"
                style={{ marginTop: isHeaderVisible ? 0 : -headerHeight }}
            >
                <header className="flex items-center p-4 bg-white dark:bg-[#2B1F1C] justify-between transition-colors shrink-0">
                    <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white"><IconRenderer name="arrow_back" size={24} /></button>
                    <h1 className="flex-1 text-center text-lg font-bold">Mushenee</h1>
                    <div className="flex items-center gap-1 -mr-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full transition-colors">
                                    <MoreVertical className="w-6 h-6" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => navigate(Screen.DM_LIST)} className="gap-3 font-medium">
                                    <Inbox className="w-4 h-4" /> Messages
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(Screen.PEOPLE_TO_FOLLOW)} className="gap-3 font-medium">
                                    <Users className="w-4 h-4" /> Watu
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(Screen.CONTRIBUTIONS, { initialTab: 'Saved' })} className="gap-3 font-medium">
                                    <Bookmark className="w-4 h-4" /> Bookmarks
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Main Tabs */}
                <div className="flex p-2 bg-stone-50 dark:bg-[#2B1F1C] transition-colors shrink-0">
                    <div className="flex w-full bg-stone-200 dark:bg-white/5 rounded-xl p-1 overflow-x-auto no-scrollbar">
                        {['Home', 'Explore'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 py-2 px-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-surface-dark text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 dark:text-text-muted hover:text-stone-700 dark:hover:text-white'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Bar with Dropdowns */}
                <div className="flex items-center justify-between px-4 py-2 bg-stone-50 dark:bg-[#2B1F1C] border-t border-stone-100 dark:border-white/5 relative z-30">
                    {/* Sort Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-full text-xs font-bold gap-1.5 focus-visible:ring-0 text-stone-600 dark:text-stone-400"
                            >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                Sort: {sortBy}
                                <ChevronDown className="w-3.5 h-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                            {['Latest', 'Top', 'Most Clapped'].map(option => (
                                <DropdownMenuItem
                                    key={option}
                                    onClick={() => setSortBy(option as any)}
                                    className={cn("flex justify-between font-bold", sortBy === option && "text-primary")}
                                >
                                    {option}
                                    {sortBy === option && <Check className="w-4 h-4" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Language Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-8 rounded-full text-xs font-bold gap-1.5 focus-visible:ring-0 text-stone-600 dark:text-stone-400",
                                    filterLanguage !== 'All' && "text-primary bg-primary/10"
                                )}
                            >
                                <Globe className="w-3.5 h-3.5" />
                                {filterLanguage === 'All' ? 'Language' : filterLanguage}
                                <ChevronDown className="w-3.5 h-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {['All', 'Swahili', 'Yoruba', 'Igbo', 'English'].map(lang => (
                                <DropdownMenuItem
                                    key={lang}
                                    onClick={() => setFilterLanguage(lang)}
                                    className={cn("flex justify-between font-bold", filterLanguage === lang && "text-primary")}
                                >
                                    {lang}
                                    {filterLanguage === lang && <Check className="w-4 h-4" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <main
                ref={mainRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 custom-scrollbar"
                style={{ paddingTop: headerHeight > 0 ? headerHeight + 16 : 140 }}
            >
                {fireplacePosts.length > 0 && activeTab === 'Home' && (
                    <div className="p-4 pb-2">
                        <div className="flex flex-col gap-3">
                            {fireplacePosts.map(p => (
                                <FireplaceCard key={p.id} post={p} onJoin={() => onJoinFireplace(p)} />
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-background-dark min-h-full">
                    {displayPosts.length > 0 ? (
                        displayPosts.map((post) => (
                            !post.isFireplace && (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onPostClick={handlePostClick}
                                    onUserClick={handleUserClick}
                                    onCommentClick={handleCommentClick}
                                    onLike={onLike}
                                    onRepost={onRepost}
                                    onMenuAction={handleMenuAction}
                                />
                            )
                        ))
                    ) : (
                        <div className="p-12 text-center flex flex-col items-center text-stone-500 dark:text-text-muted">
                            <Inbox className="w-12 h-12 mb-2 opacity-30" />
                            <p>Nothing to see here.</p>
                            {filterLanguage !== 'All' && <p className="text-xs mt-2">Try changing the language filter.</p>}
                        </div>
                    )}
                    <div className="h-24"></div>
                </div>
            </main>

            <div className="fixed bottom-6 right-6 z-20">
                <Button
                    onClick={() => navigate(Screen.COMPOSE_POST)}
                    size="icon"
                    className="w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
                >
                    <PenLine className="w-6 h-6" />
                </Button>
            </div>
        </div>
    );
};

export default MessagesScreen;
