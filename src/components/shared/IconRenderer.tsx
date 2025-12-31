"use client";

import React from 'react';
import {
    BookOpen,
    Quote,
    Languages,
    Music,
    MessageSquare,
    FileText,
    HelpCircle,
    Utensils,
    Mic,
    Sparkles,
    History,
    ArrowLeft,
    Plus,
    ThumbsUp,
    ThumbsDown,
    MessageCircle,
    Share2,
    Send,
    Bookmark,
    Edit3,
    Paperclip,
    Eye,
    X,
    Link,
    CheckCircle,
    GraduationCap,
    Trophy,
    Search,
    Loader2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Upload,
    ArrowRight,
    Clock,
    Users
} from 'lucide-react';

interface IconRendererProps {
    name: string;
    className?: string;
    size?: number;
    fill?: boolean;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className, size = 20, fill = false }) => {
    const props = { className, size, fill: fill ? 'currentColor' : 'none' };

    switch (name) {
        // Legacy Material Symbol names to Lucide migration
        case 'menu_book': return <BookOpen {...props} />;
        case 'format_quote': return <Quote {...props} />;
        case 'translate': return <Languages {...props} />;
        case 'music_note': return <Music {...props} />;
        case 'forum': return <MessageSquare {...props} />;
        case 'history_edu': return <FileText {...props} />;
        case 'quiz': return <HelpCircle {...props} />;
        case 'restaurant': return <Utensils {...props} />;
        case 'record_voice_over': return <Mic {...props} />;
        case 'auto_stories': return <Sparkles {...props} />;
        case 'history': return <History {...props} />;

        // General icons
        case 'arrow_back': return <ArrowLeft {...props} />;
        case 'add': return <Plus {...props} />;
        case 'thumb_up': return <ThumbsUp {...props} />;
        case 'thumb_down': return <ThumbsDown {...props} />;
        case 'chat_bubble': return <MessageCircle {...props} />;
        case 'share': return <Share2 {...props} />;
        case 'send': return <Send {...props} />;
        case 'bookmark': return <Bookmark {...props} />;
        case 'edit_note': return <Edit3 {...props} />;
        case 'attachment': return <Paperclip {...props} />;
        case 'visibility': return <Eye {...props} />;
        case 'close': return <X {...props} />;
        case 'link': return <Link {...props} />;
        case 'check_circle': return <CheckCircle {...props} />;
        case 'school': return <GraduationCap {...props} />;
        case 'mic': return <Mic {...props} />;
        case 'emoji_events': return <Trophy {...props} />;
        case 'find_in_page': return <Search {...props} />;
        case 'progress_activity': return <Loader2 {...props} className={className + " animate-spin"} />;
        case 'expand_more': return <ChevronDown {...props} />;
        case 'chevron_left': return <ChevronLeft {...props} />;
        case 'chevron_right': return <ChevronRight {...props} />;
        case 'publish': return <Upload {...props} />;
        case 'arrow_forward': return <ArrowRight {...props} />;
        case 'schedule': return <Clock {...props} />;
        case 'groups': return <Users {...props} />;
        case 'bookmark_border': return <Bookmark {...props} />;

        default:
            // Fallback to Search or check if name is already a Lucide-like name
            return <Search {...props} />;
    }
};
