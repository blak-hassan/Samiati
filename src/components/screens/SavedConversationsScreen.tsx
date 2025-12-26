import React, { useState } from 'react';
import { Screen, Conversation } from '@/types';
import {
    ArrowLeft,
    Search,
    Pin,
    Trash2,
    MessageSquare,
    Clock,
    ChevronRight,
    BookOpen,
    Music,
    Scroll,
    History,
    Type
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
    navigate: (screen: Screen) => void;
    goBack: () => void;
    conversations: Conversation[];
    setConversations: (conversations: Conversation[]) => void;
    onChatSelect: (id: string) => void;
}

const SavedConversationsScreen: React.FC<Props> = ({
    navigate,
    goBack,
    conversations,
    setConversations,
    onChatSelect
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'All' | 'Pinned' | 'Recent'>('All');

    const filtered = conversations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    let displayedConversations = filtered;
    if (activeTab === 'Recent') {
        displayedConversations = [...filtered].sort((a, b) => b.lastActive - a.lastActive);
    } else if (activeTab === 'Pinned') {
        displayedConversations = filtered.filter(c => c.isPinned);
    }

    const pinned = displayedConversations.filter(c => c.isPinned);
    const others = displayedConversations.filter(c => !c.isPinned);

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setConversations(conversations.filter(c => c.id !== id));
    };

    const handleTogglePin = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setConversations(conversations.map(c =>
            c.id === id ? { ...c, isPinned: !c.isPinned } : c
        ));
    };



    const handleShareStory = () => {
        navigate(Screen.ADD_CONTRIBUTION);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background relative overflow-hidden font-body">
            {/* Abstract Background Shapes */}
            <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[30%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[30%] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goBack}
                        className="rounded-full hover:bg-muted/50 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-black tracking-tight text-foreground">Kaendelee</h1>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/30">
                    {conversations.length} Saved
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative z-10 p-4 max-w-2xl mx-auto w-full space-y-6 overflow-y-auto no-scrollbar pb-24">





                {/* Search Bar */}
                <div className="relative group animate-in fade-in slide-in-from-top-4 duration-500 delay-400">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        type="text"
                        placeholder="Find a conversation..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-12 pl-12 rounded-2xl bg-card/50 backdrop-blur-xl border-border/50 focus:bg-background transition-all shadow-sm"
                    />
                </div>

                {/* Categories / Tabs */}
                <div className="flex gap-2 animate-in fade-in slide-in-from-top-4 duration-500 delay-500">
                    {['All', 'Pinned', 'Recent'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border",
                                activeTab === tab
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                                    : "bg-card/50 text-muted-foreground border-border/50 hover:bg-muted/50"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Conversation List */}
                <div className="space-y-4">
                    {/* Pinned Section */}
                    {activeTab !== 'Recent' && pinned.length > 0 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2 px-1">
                                <Pin className="w-4 h-4 text-primary fill-primary" />
                                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pinned</h2>
                            </div>
                            {pinned.map((c, idx) => (
                                <ConversationCard
                                    key={c.id}
                                    conversation={c}
                                    onClick={() => onChatSelect(c.id)}
                                    onTogglePin={(e) => handleTogglePin(e, c.id)}
                                    onDelete={(e) => handleDelete(e, c.id)}
                                    index={idx}
                                />
                            ))}
                        </div>
                    )}

                    {/* Regular Section */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {others.length > 0 && (activeTab === 'All' || activeTab === 'Recent') && (
                            <>
                                <div className="flex items-center gap-2 px-1 mt-6">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                        {activeTab === 'Recent' ? 'Most Recent' : 'All Conversations'}
                                    </h2>
                                </div>
                                {others.map((c, idx) => (
                                    <ConversationCard
                                        key={c.id}
                                        conversation={c}
                                        onClick={() => onChatSelect(c.id)}
                                        onTogglePin={(e) => handleTogglePin(e, c.id)}
                                        onDelete={(e) => handleDelete(e, c.id)}
                                        index={idx}
                                    />
                                ))}
                            </>
                        )}
                    </div>

                    {/* Empty State */}
                    {displayedConversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-black text-foreground mb-2">Start Preserving Heritage</h3>
                            <p className="text-muted-foreground text-sm max-w-[280px] mb-6">
                                {searchQuery
                                    ? "No conversations match your search. Try different keywords."
                                    : "Your cultural contributions will appear here. Every word you save is a gift to future generations."}
                            </p>
                            {!searchQuery && (
                                <Button onClick={handleShareStory} className="rounded-xl font-bold">
                                    Share Your First Story
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

interface CardProps {
    conversation: Conversation;
    onClick: () => void;
    onTogglePin: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    index: number;
}

const ConversationCard: React.FC<CardProps> = ({
    conversation,
    onClick,
    onTogglePin,
    onDelete,
    index
}) => {
    const getCategoryIcon = (category?: string) => {
        switch (category) {
            case 'proverb': return <Scroll className="w-6 h-6" />;
            case 'story': return <BookOpen className="w-6 h-6" />;
            case 'song': return <Music className="w-6 h-6" />;
            case 'history': return <History className="w-6 h-6" />;
            case 'word': return <Type className="w-6 h-6" />;
            default: return <MessageSquare className="w-6 h-6" />;
        }
    };

    const getCategoryColor = (category?: string) => {
        switch (category) {
            case 'proverb': return 'bg-rasta-red/10 text-rasta-red'; // Rasta Red
            case 'story': return 'bg-rasta-gold/10 text-amber-600 dark:text-rasta-gold'; // Rasta Gold
            case 'song': return 'bg-rasta-gold/20 text-amber-700 dark:text-rasta-gold/80'; // Rasta Gold (darker)
            case 'history': return 'bg-rasta-red/20 text-red-800 dark:text-rasta-red/80'; // Rasta Red (darker)
            case 'word': return 'bg-rasta-green/10 text-rasta-green'; // Rasta Green
            default: return 'bg-primary/10 text-primary';
        }
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 transition-all duration-300",
                "hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.99] cursor-pointer",
                "animate-in fade-in slide-in-from-bottom-4 duration-500"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex items-center gap-4">
                {/* Avatar / Icon */}
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300",
                    getCategoryColor(conversation.category)
                )}>
                    {getCategoryIcon(conversation.category)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {conversation.title}
                        </h3>
                        {conversation.language && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md shrink-0">
                                {conversation.language}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {conversation.messageCount} Messages
                        </span>
                        {conversation.viewCount && conversation.viewCount > 0 && (
                            <>
                                <span className="w-1 h-1 bg-border rounded-full" />
                                <span>{conversation.viewCount} views</span>
                            </>
                        )}
                        <span className="w-1 h-1 bg-border rounded-full" />
                        <span className="text-[10px]">{conversation.date}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-2 relative z-30">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            onTogglePin(e);
                        }}
                        className={cn(
                            "w-9 h-9 rounded-xl inline-flex items-center justify-center hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                            conversation.isPinned ? "text-primary" : "text-muted-foreground"
                        )}
                        aria-label={conversation.isPinned ? "Unpin" : "Pin"}
                    >
                        <Pin className={cn("w-4 h-4", conversation.isPinned && "fill-primary")} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            onDelete(e);
                        }}
                        className="w-9 h-9 rounded-xl inline-flex items-center justify-center hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/20"
                        aria-label="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors ml-1" />
                </div>
            </div>
        </div>
    );
};

export default SavedConversationsScreen;
