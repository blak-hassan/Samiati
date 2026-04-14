"use client";

import React, { lazy, Suspense, memo } from 'react';

// Critical icons loaded eagerly (used everywhere on initial load)
import { Search, Loader2 } from 'lucide-react';

// All other icons loaded lazily on demand
const BookOpen = lazy(() => import('lucide-react').then(mod => ({ default: mod.BookOpen })));
const Quote = lazy(() => import('lucide-react').then(mod => ({ default: mod.Quote })));
const Languages = lazy(() => import('lucide-react').then(mod => ({ default: mod.Languages })));
const Music = lazy(() => import('lucide-react').then(mod => ({ default: mod.Music })));
const MessageSquare = lazy(() => import('lucide-react').then(mod => ({ default: mod.MessageSquare })));
const FileText = lazy(() => import('lucide-react').then(mod => ({ default: mod.FileText })));
const HelpCircle = lazy(() => import('lucide-react').then(mod => ({ default: mod.HelpCircle })));
const Utensils = lazy(() => import('lucide-react').then(mod => ({ default: mod.Utensils })));
const Mic = lazy(() => import('lucide-react').then(mod => ({ default: mod.Mic })));
const Sparkles = lazy(() => import('lucide-react').then(mod => ({ default: mod.Sparkles })));
const History = lazy(() => import('lucide-react').then(mod => ({ default: mod.History })));
const ArrowLeft = lazy(() => import('lucide-react').then(mod => ({ default: mod.ArrowLeft })));
const Plus = lazy(() => import('lucide-react').then(mod => ({ default: mod.Plus })));
const ThumbsUp = lazy(() => import('lucide-react').then(mod => ({ default: mod.ThumbsUp })));
const ThumbsDown = lazy(() => import('lucide-react').then(mod => ({ default: mod.ThumbsDown })));
const MessageCircle = lazy(() => import('lucide-react').then(mod => ({ default: mod.MessageCircle })));
const Share2 = lazy(() => import('lucide-react').then(mod => ({ default: mod.Share2 })));
const Send = lazy(() => import('lucide-react').then(mod => ({ default: mod.Send })));
const Bookmark = lazy(() => import('lucide-react').then(mod => ({ default: mod.Bookmark })));
const Edit3 = lazy(() => import('lucide-react').then(mod => ({ default: mod.Edit3 })));
const Paperclip = lazy(() => import('lucide-react').then(mod => ({ default: mod.Paperclip })));
const Eye = lazy(() => import('lucide-react').then(mod => ({ default: mod.Eye })));
const X = lazy(() => import('lucide-react').then(mod => ({ default: mod.X })));
const Link = lazy(() => import('lucide-react').then(mod => ({ default: mod.Link })));
const CheckCircle = lazy(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })));
const GraduationCap = lazy(() => import('lucide-react').then(mod => ({ default: mod.GraduationCap })));
const Trophy = lazy(() => import('lucide-react').then(mod => ({ default: mod.Trophy })));
const ChevronDown = lazy(() => import('lucide-react').then(mod => ({ default: mod.ChevronDown })));
const ChevronLeft = lazy(() => import('lucide-react').then(mod => ({ default: mod.ChevronLeft })));
const ChevronRight = lazy(() => import('lucide-react').then(mod => ({ default: mod.ChevronRight })));
const Upload = lazy(() => import('lucide-react').then(mod => ({ default: mod.Upload })));
const ArrowRight = lazy(() => import('lucide-react').then(mod => ({ default: mod.ArrowRight })));
const Clock = lazy(() => import('lucide-react').then(mod => ({ default: mod.Clock })));
const Users = lazy(() => import('lucide-react').then(mod => ({ default: mod.Users })));

interface IconRendererProps {
    name: string;
    className?: string;
    size?: number;
    fill?: boolean;
}

const IconFallback = ({ size = 20, className }: { size?: number, className?: string }) => (
    <div 
        className={`inline-flex items-center justify-center opacity-30 ${className || ''}`}
        style={{ width: size, height: size }}
    >
        <Loader2 size={size} className="animate-spin" />
    </div>
);

const IconRendererComponent: React.FC<IconRendererProps> = ({ name, className, size = 20, fill = false }) => {
    const props = { className, size, fill: fill ? 'currentColor' : 'none' };

    const renderIcon = () => {
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
                return <Search {...props} />;
        }
    };

    return (
        <Suspense fallback={<IconFallback size={size} className={className} />}>
            {renderIcon()}
        </Suspense>
    );
};

// Memoize to prevent unnecessary re-renders
export const IconRenderer = memo(IconRendererComponent);
