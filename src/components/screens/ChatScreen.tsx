"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Screen, User, Message, Conversation } from '@/types';
import { NotificationBell } from '@/components/shared/NotificationBell';

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Menu,
  Plus,
  Search,
  Bookmark,
  Heart,
  ShieldCheck,
  MessagesSquare,
  Users,
  User as UserIcon,
  Settings,
  Bell,
  ChevronUp,
  ChevronDown,
  X,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  PlusCircle,
  Image as ImageIcon,
  FileText,
  Camera,
  ArrowUp,
  History,
  Info,
  ChevronRight,
  Flame,
  Globe,
  Megaphone,
  Check,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { LanguageSelector, LANGUAGES, Language } from "@/components/chat/LanguageSelector";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  user: User;
  navigate: (screen: Screen) => void;
  unreadCount?: number;
  notificationCounts?: {
    total: number;
    contributions: number;
    moderation: number;
    mushenee: number;
    watu: number;
  };
  activeConversation: Conversation | null;
  onNewChat: () => void;
  onSaveChat: (messages: Message[]) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Drawer Item Helper
const DrawerItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, count?: number }> = ({ icon, label, onClick, count }) => (
  <button
    onClick={onClick}
    className="w-full h-11 flex items-center gap-3.5 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all group"
  >
    <div className="text-muted-foreground group-hover:text-primary transition-colors">
      {icon}
    </div>
    <span className="font-bold text-sm tracking-tight flex-1 text-left">{label}</span>
    {count !== undefined && count > 0 && (
      <Badge variant="default" className="bg-primary hover:bg-primary shadow-none h-5 min-w-[20px] px-1 justify-center font-bold text-[10px]">
        {count}
      </Badge>
    )}
  </button>
);

// Attachment Item Helper
const AttachmentItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-sm font-bold text-foreground rounded-xl active:bg-muted/80"
  >
    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
      {icon}
    </div>
    <span>{label}</span>
  </button>
);

const ChatScreen: React.FC<Props> = ({ user, navigate, unreadCount = 0, notificationCounts, activeConversation, onNewChat, onSaveChat, isDarkMode, toggleTheme }) => {
  const translate = useAction(api.translate.translateText);
  const sendMessageAction = useAction(api.chat.sendMessage);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Language State - Default to Swahili so translations are enabled by default
  // LANGUAGES order: Kenyan languages first
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    LANGUAGES.find(l => l.code === 'sw') || LANGUAGES[0]
  );
  // Replaced with internal state in LanguageSelector, but we keep this for controlled if needed,
  // or simply use it to toggle. Actually, we can remove isLanguageDropdownOpen if we use the component properly.
  // But wait, the component needs an 'open' prop if we want to control it, or we rely on its internal state.
  // The existing code has two places using it. It's better to keep it controlled or separate.
  // We'll use separate states for the two instances or just let them manage themselves if possible?
  // Language Selector now manages its own open state internally


  // Attachment State
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  // Feedback State
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');


  // Translation Visibility State
  const [expandedTranslations, setExpandedTranslations] = useState<{ [key: string]: boolean }>({});

  // Copy State
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Welcome Mode - true when no user messages exist (Google-style centered layout)
  const isWelcomeMode = !messages.some(m => m.sender === 'user');

  // Scroll Header Logic
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const scrollY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const attachmentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hidden File Inputs Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Measure Header Height
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  // Scroll Handler
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const currentScrollY = scrollRef.current.scrollTop;
    const diff = currentScrollY - scrollY.current;

    // Ignore bounce
    if (currentScrollY < 0) return;

    if (diff > 10) {
      // Scrolling Down (towards bottom/newer messages) -> Hide Header
      setIsHeaderVisible(false);
    } else if (diff < -10) {
      // Scrolling Up (towards top/history) -> Show Header
      setIsHeaderVisible(true);
    }

    scrollY.current = currentScrollY;
  };

  // Initialize or Update Messages based on Active Conversation
  useEffect(() => {
    if (activeConversation) {
      // Load saved messages
      // STRICT CHECK: If the conversation only contains AI messages (legacy greetings),
      // we treat it as a new chat to enforce the Welcome Screen.
      const hasUserMessages = activeConversation.messages.some(m => m.sender === 'user');
      if (hasUserMessages) {
        setMessages(activeConversation.messages);
      } else {
        setMessages([]);
      }
    } else {
      // New Chat Default - Start Empty
      setMessages([]);
    }
  }, [activeConversation]);

  // Scroll to bottom logic
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      // Sync scroll tracker
      scrollY.current = scrollRef.current.scrollTop;
    }
  };

  // Auto-scroll when messages change or UI expands
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, activeCommentId]);

  // Auto-scroll on window resize (e.g., keyboard open)
  useEffect(() => {
    const handleResize = () => scrollToBottom();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputText]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // NOTE: We rely on standard Radix UI behavior for closing on outside click for many things,
      // but if we need manual control, we can add it here.
      // For now, ensuring attachment menu closes is fine if we had a ref, but we removed the manual dropdown ref.
      // We can keep attachmentRef logic if we restore the Ref, or just trust the Popover component.
      // The current Popover component from shadcn usually handles outside clicks automatically.
      if (attachmentRef.current && !attachmentRef.current.contains(event.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
    };

    if (isAttachmentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAttachmentMenuOpen]);


  // Wrapper to save chat before navigating
  const handleNavigate = (screen: Screen) => {
    if (messages.length > 1) { // Save if there's more than just the greeting
      onSaveChat(messages);
    }
    navigate(screen);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    onSaveChat(newMessages);

    setInputText('');
    setIsTyping(true);

    // Pass the selected language context to the AI service
    // Instruction: React naturally in ENGLISH (to be translated). Avoid explanations.
    const contextPrompt = `[Instruction: React naturally to "${userMsg.text}". REPLY IN ENGLISH ONLY. Do NOT define words. Do NOT explain content. Just reply as a friend.]`;

    // Call Convex Action (Llama 3)
    const history = messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    // Add current message properly (User message + Instruction)
    const payload = [...history, { role: 'user', content: contextPrompt }];

    const aiResponseText = await sendMessageAction({ messages: payload });

    // Call translation if selected language is not English
    let translatedText = undefined;
    if (selectedLanguage.code !== 'en') {
      try {
        const result = await translate({
          text: aiResponseText,
          targetLanguage: selectedLanguage.nllbCode
        });

        // Backend now returns "N/A" on failure.
        // If result is valid (including "N/A"), use it.
        // We no longer fallback to original text here.
        if (result) {
          translatedText = result;
        }
      } catch (error) {
        console.error("Translation failed:", error);
        translatedText = "N/A";
      }
    }

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: aiResponseText,
      translatedText,
      targetLanguage: selectedLanguage.name,
      timestamp: new Date()
    };

    setIsTyping(false);
    setMessages(prev => {
      const updated = [...prev, aiMsg];
      setTimeout(() => onSaveChat(updated), 0);
      return updated;
    });
  };



  const handleNewChatClick = () => {
    // Save current chat before starting new
    if (messages.length > 1) {
      onSaveChat(messages);
    }

    // Explicitly reset state for new chat to trigger Welcome Mode
    setMessages([]);
    setInputText('');
    setExpandedTranslations({});
    setIsNavOpen(false);
    onNewChat();
  };

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        // Toggle feedback if already selected
        const newFeedback = m.feedback === type ? undefined : type;
        return { ...m, feedback: newFeedback };
      }
      return m;
    }));
  };

  const toggleCommentBox = (messageId: string) => {
    if (activeCommentId === messageId) {
      setActiveCommentId(null);
      setCommentText('');
    } else {
      setActiveCommentId(messageId);
      setCommentText('');
    }
  };

  const submitComment = (messageId: string) => {
    if (!commentText.trim()) return;

    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        // Only allow one comment per message
        if (m.comments && m.comments.length > 0) return m;

        const currentComments = m.comments || [];
        return { ...m, comments: [...currentComments, commentText] };
      }
      return m;
    }));
    // Clear input and close box
    setCommentText('');
    setActiveCommentId(null);
  };

  const toggleTranslation = (messageId: string) => {
    setExpandedTranslations(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Handle File Selections
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (type === 'image') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: base64, // Storing data URL in text field for simplicity in this demo
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMsg]);

          setIsTyping(true);
          // Simulate AI response to image
          setTimeout(() => {
            const aiMsg: Message = {
              id: (Date.now() + 1).toString(),
              sender: 'ai',
              text: "That's a nice image! In Swahili culture, visual storytelling is very important.",
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
          }, 2000);
        };
        reader.readAsDataURL(file);
      } else {
        const userMsg: Message = {
          id: Date.now().toString(),
          sender: 'user',
          text: `ðŸ“„ ${file.name}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);

        setIsTyping(true);
        // Simulate AI response to document
        setTimeout(() => {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: `I've received "${file.name}". Would you like me to summarize it or translate it?`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMsg]);
          setIsTyping(false);
        }, 1500);
      }
    }
    // Reset file input so same file can be selected again if needed
    e.target.value = '';
    setIsAttachmentMenuOpen(false);
  };

  // Removed local filtering/helper functions in favor of LanguageSelector component logic

  return (
    <div className="flex h-[100dvh] bg-background-light dark:bg-background-dark relative overflow-hidden transition-colors duration-300">
      {/* Hidden File Inputs */}
      <input type="file" ref={photoInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => handleFileSelect(e, 'image')} />
      <input type="file" ref={documentInputRef} className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileSelect(e, 'document')} />
      <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => handleFileSelect(e, 'image')} />

      {/* Navigation Drawer using Sheet */}
      <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 border-r border-border bg-background">
          <div className="flex flex-col h-full bg-muted/30">
            <div className="p-6">
              <SheetHeader className="text-left mb-8">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <SheetTitle className="text-lg font-bold tracking-tight">{user.name}</SheetTitle>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{user.handle}</p>
                  </div>
                </div>
              </SheetHeader>

              <Button
                onClick={handleNewChatClick}
                className="w-full h-12 rounded-xl gap-2 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Kaanze
              </Button>
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">


              <DrawerItem
                icon={<History className="w-5 h-5" />}
                label="Kaendelee"
                onClick={() => handleNavigate(Screen.SAVED_CONVERSATIONS)}
              />

              <DrawerItem
                icon={<Flame className="w-5 h-5" />}
                label="Changa"
                count={notificationCounts?.contributions}
                onClick={() => handleNavigate(Screen.CONTRIBUTIONS)}
              />
              <DrawerItem
                icon={<MessagesSquare className="w-5 h-5" />}
                label="Mushenee"
                count={notificationCounts?.mushenee}
                onClick={() => handleNavigate(Screen.MESSAGES)}
              />
              {user.role === 'moderator' || user.role === 'admin' && (
                <DrawerItem
                  icon={<ShieldCheck className="w-5 h-5" />}
                  label="Moderation"
                  count={notificationCounts?.moderation}
                  onClick={() => handleNavigate(Screen.MODERATION_DASHBOARD)}
                />
              )}

            </nav>

            <div className="p-4 mt-auto">
              <DrawerItem
                icon={<Settings className="w-5 h-5" />}
                label="Settings"
                onClick={() => handleNavigate(Screen.SETTINGS)}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full h-full relative">
        {/* Header - Hidden in welcome mode, visible when chatting */}
        {!isWelcomeMode && (
          <div
            ref={headerRef}
            className="absolute top-0 left-0 right-0 z-20 transition-all duration-300 ease-in-out bg-background/95 backdrop-blur-md shadow-sm"
            style={{ marginTop: isHeaderVisible ? 0 : -headerHeight }}
          >
            <header className="h-16 flex items-center justify-between px-4 shrink-0 transition-colors duration-300">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsNavOpen(true)}
                  className="rounded-full transition-colors"
                  aria-label="Toggle navigation"
                >
                  <Menu className="w-6 h-6" />
                </Button>
                <div className="flex flex-col">
                  <h1 className="text-lg font-bold text-foreground truncate max-w-[200px] leading-tight tracking-tight">
                    {activeConversation ? activeConversation.title : 'Samiati'}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <NotificationBell unreadCount={unreadCount} onNavigate={handleNavigate} />
              </div>
            </header>
          </div>
        )}

        {/* Welcome Mode - Google-style centered layout */}
        {isWelcomeMode ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 animate-in fade-in duration-500">
            {/* Menu button in corner for welcome mode */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsNavOpen(true)}
              className="absolute top-4 left-4 rounded-full transition-colors"
              aria-label="Toggle navigation"
            >
              <Menu className="w-6 h-6" />
            </Button>

            {/* Notification bell in corner */}
            <div className="absolute top-4 right-4">
              <NotificationBell unreadCount={unreadCount} onNavigate={handleNavigate} />
            </div>

            {/* Logo and Branding */}
            <div className="flex flex-col items-center mb-8 animate-in zoom-in-50 duration-500">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg mb-4">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVEz4UTCpp223l9QRsdxYGf4pegaKfIoxUYdvO2wPo8XCkY1wn0s7omDDuk5l9UfGHmSUMYiZUUiyeVrj5DHh5gKGghBS5J2alPWrLAd8VmA-CBLb7qbiOcvqYtIFuk8Iw9ZjCmIWsqxrq9lXoxaDfBKx3IEbV995TSPyPknJVXq7CE98Xs5Bc97lpSiqftZE4YnDIH4KY3CfDGILDtoz-44vJc1F-kNPQ3hBDDIXf21ifYT-byy_M-5rVvOpQ851C6YS0xkM3lcM"
                  alt="Samiati Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">
                Samiati
              </h1>
              <p className="text-muted-foreground text-sm md:text-base font-medium">
                How can I help you explore {selectedLanguage.name} culture today?
              </p>
            </div>

            {/* Centered Input Bar */}
            <div className="w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-500 delay-150">
              <div className="bg-background border border-border/40 rounded-[24px] px-4 py-3 flex flex-col gap-3 transition-all shadow-xl shadow-primary/5 focus-within:shadow-2xl focus-within:ring-1 focus-within:ring-primary/20">

                {/* Top Layer: Text Input */}
                <div className="w-full">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type or Speak..."
                    className="w-full bg-transparent border-none text-foreground placeholder-muted-foreground/70 focus:ring-0 outline-none text-base md:text-lg resize-none min-h-[40px] max-h-[160px] p-0 font-medium leading-relaxed"
                    rows={1}
                  />
                </div>

                {/* Bottom Layer: Actions */}
                <div className="flex items-center justify-between w-full">
                  {/* Left: Language Selector */}
                  <LanguageSelector
                    selectedLanguage={selectedLanguage}
                    onSelect={handleLanguageSelect}
                  />

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    {/* Attachments Menu Popover */}
                    <Popover open={isAttachmentMenuOpen} onOpenChange={setIsAttachmentMenuOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-muted-foreground hover:text-primary transition-colors h-9 w-9 hover:bg-muted/50"
                          aria-label="Add attachments"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" align="end" className="w-[180px] p-1.5 mb-3 rounded-2xl shadow-xl border-border bg-background">
                        <AttachmentItem
                          icon={<ImageIcon className="w-4 h-4 text-blue-500" />}
                          label="Photo / Video"
                          onClick={() => photoInputRef.current?.click()}
                        />
                        <AttachmentItem
                          icon={<FileText className="w-4 h-4 text-orange-500" />}
                          label="Document"
                          onClick={() => documentInputRef.current?.click()}
                        />
                        <AttachmentItem
                          icon={<Camera className="w-4 h-4 text-green-500" />}
                          label="Live Camera"
                          onClick={() => cameraInputRef.current?.click()}
                        />
                      </PopoverContent>
                    </Popover>

                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!inputText.trim()}
                      className={cn(
                        "w-9 h-9 rounded-full transition-all duration-300 shadow-sm transition-transform active:scale-95",
                        inputText.trim()
                          ? "bg-primary text-primary-foreground opacity-100 hover:scale-105"
                          : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                      )}
                    >
                      <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Area */}
            <main
              className="flex-1 overflow-y-auto p-4 space-y-6"
              ref={scrollRef}
              onScroll={handleScroll}
            >
              {/* Messages */}
              {messages.map((msg, index) => (
                <div key={msg.id} className={cn(
                  "flex flex-col gap-1 group/msg", // Reduced gap
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                )}>
                  <div className={cn(
                    "flex items-start gap-3 w-full max-w-[90%] md:max-w-[80%]",
                    msg.sender === 'user' && 'flex-row-reverse self-end'
                  )}>
                    {msg.sender === 'ai' ? (
                      <Avatar className="w-8 h-8 shrink-0 border border-primary/20 shadow-sm mt-1">
                        <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVEz4UTCpp223l9QRsdxYGf4pegaKfIoxUYdvO2wPo8XCkY1wn0s7omDDuk5l9UfGHmSUMYiZUUiyeVrj5DHh5gKGghBS5J2alPWrLAd8VmA-CBLb7qbiOcvqYtIFuk8Iw9ZjCmIWsqxrq9lXoxaDfBKx3IEbV995TSPyPknJVXq7CE98Xs5Bc97lpSiqftZE4YnDIH4KY3CfDGILDtoz-44vJc1F-kNPQ3hBDDIXf21ifYT-byy_M-5rVvOpQ851C6YS0xkM3lcM" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="w-8 h-8 shrink-0 border border-border shadow-sm mt-1">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                    )}

                    <div className={cn(
                      "relative transition-all",
                      msg.sender === 'user'
                        ? 'p-4 rounded-2xl shadow-sm bg-[#EDE4D9] dark:bg-[#4A4035] text-[#4A4035] dark:text-[#EDE4D9]'
                        : 'p-0 text-foreground bg-transparent'
                    )}>
                      {msg.text.startsWith('data:image') ? (
                        <img src={msg.text} alt="User upload" className="rounded-2xl max-h-72 w-full object-cover shadow-inner" />
                      ) : (
                        <p className="text-sm md:text-base leading-relaxed tracking-tight font-medium whitespace-pre-wrap">
                          {/* Show translated text for AI messages if available AND language is not English, otherwise show original text */}
                          {msg.sender === 'ai' && selectedLanguage.code !== 'en' && msg.translatedText ? msg.translatedText : msg.text}
                        </p>
                      )}

                      {/* Collapsible English Original - Only for AI messages with translations AND when not in English mode */}
                      {msg.sender === 'ai' && selectedLanguage.code !== 'en' && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          {/* Toggle Button for English Original */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTranslation(msg.id)}
                            className="h-7 px-2.5 rounded-full gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all"
                          >
                            {expandedTranslations[msg.id] ? (
                              <>
                                <ChevronUp className="w-3 h-3" />
                                Hide English
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                View English
                              </>
                            )}
                          </Button>

                          {/* English Original (Collapsible) */}
                          {expandedTranslations[msg.id] && (
                            <div className="mt-2 pt-2 border-t border-border/30 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">
                                <Globe className="w-3 h-3" />
                                English Original
                              </div>
                              <p className="text-sm md:text-base leading-relaxed tracking-tight font-medium whitespace-pre-wrap border-l-2 border-muted-foreground/20 pl-3 py-0.5 text-muted-foreground">
                                {msg.text}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* User Message Timestamp (Absolute) */}
                      {msg.sender === 'user' && (
                        <span className="absolute -bottom-5 right-0 text-[10px] font-bold text-muted-foreground/0 group-hover/msg:text-muted-foreground/60 transition-all">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Actions Row: Timestamp | Thumbs | Copy | Feedback */}
                  {msg.sender === 'ai' && (
                    <div className="flex items-center gap-4 ml-11 mt-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200">
                      {/* Timestamp */}
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {/* Divider */}
                      <div className="h-3 w-[1px] bg-border" />

                      {/* Thumbs Up/Down */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFeedback(msg.id, 'up')}
                          className={cn(
                            "h-6 w-6 rounded-full hover:bg-muted/50 transition-colors",
                            msg.feedback === 'up' ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          <ThumbsUp className={cn("w-3.5 h-3.5", msg.feedback === 'up' && "fill-current")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFeedback(msg.id, 'down')}
                          className={cn(
                            "h-6 w-6 rounded-full hover:bg-muted/50 transition-colors",
                            msg.feedback === 'down' ? "text-red-500" : "text-muted-foreground"
                          )}
                        >
                          <ThumbsDown className={cn("w-3.5 h-3.5", msg.feedback === 'down' && "fill-current")} />
                        </Button>
                      </div>

                      {/* Divider */}
                      <div className="h-3 w-[1px] bg-border" />

                      {/* Copy Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="h-6 w-6 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
                        title="Copy text"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>

                      {/* Feedback Text Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCommentBox(msg.id)}
                        className="h-6 px-2 text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider gap-1.5 rounded-md hover:bg-muted/50"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Feedback
                      </Button>

                    </div>
                  )}



                  {/* Feedback Expansion */}
                  {(activeCommentId === msg.id) && (
                    <div className="bg-muted/50 rounded-2xl p-3 border border-border/50 space-y-3 animate-in fade-in slide-in-from-top-1">
                      {msg.comments && msg.comments.length > 0 && (
                        <div className="space-y-2">
                          {msg.comments.map((comment, i) => (
                            <div key={i} className="flex gap-2 items-start">
                              <div className="mt-1 w-1 h-1 bg-primary rounded-full shrink-0" />
                              <p className="text-xs font-medium text-foreground/70 leading-relaxed italic">{comment}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {(!msg.comments || msg.comments.length === 0) ? (
                        <div className="flex gap-2">
                          <Input
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Improve this..."
                            className="h-9 text-xs rounded-xl bg-background border-none focus-visible:ring-1 focus-visible:ring-primary/50 font-medium"
                            onKeyDown={(e) => e.key === 'Enter' && submitComment(msg.id)}
                          />
                          <Button
                            size="icon"
                            variant="default"
                            className="h-9 w-9 rounded-xl shrink-0 shadow-lg shadow-primary/20"
                            onClick={() => submitComment(msg.id)}
                            disabled={!commentText.trim()}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.1em] py-1 border-t border-primary/10">
                          <ShieldCheck className="w-3 h-3" />
                          Knowledge Contribution Received
                        </div>
                      )}
                    </div>
                  )}
                </div>

              ))}

              {isTyping && (
                <div className="flex items-start gap-3 w-full self-start">
                  <Avatar className="w-8 h-8 shrink-0 border border-primary/20 shadow-sm animate-pulse">
                    <AvatarFallback>...</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted/30 border border-border p-4 rounded-3xl rounded-tl-none flex gap-1.5 items-center shadow-sm">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
            </main>

            {/* Standardized Input Area */}
            <div className="bg-background p-2 shrink-0 transition-colors duration-300 relative z-20 pb-4">
              <div className="max-w-4xl mx-auto bg-background/50 border border-border/40 rounded-[24px] px-4 py-3 flex flex-col gap-2 transition-all shadow-sm focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/10 group backdrop-blur-sm">

                {/* Top Layer: Text Input */}
                <div className="w-full">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type or Speak..."
                    className="w-full bg-transparent border-none text-foreground placeholder-muted-foreground/70 focus:ring-0 outline-none text-base md:text-lg resize-none min-h-[40px] max-h-[160px] p-0 font-medium leading-relaxed"
                    rows={1}
                  />
                </div>

                {/* Bottom Layer: Actions */}
                <div className="flex items-center justify-between w-full">
                  {/* Left: Language Selector */}
                  <LanguageSelector
                    selectedLanguage={selectedLanguage}
                    onSelect={handleLanguageSelect}
                  />

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    {/* Attachments Menu Popover */}
                    <Popover open={isAttachmentMenuOpen} onOpenChange={setIsAttachmentMenuOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-muted-foreground hover:text-primary transition-colors h-9 w-9 hover:bg-muted/50"
                          aria-label="Add attachments"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" align="end" className="w-[180px] p-1.5 mb-3 rounded-2xl shadow-xl border-border bg-background">
                        <AttachmentItem
                          icon={<ImageIcon className="w-4 h-4 text-blue-500" />}
                          label="Photo / Video"
                          onClick={() => photoInputRef.current?.click()}
                        />
                        <AttachmentItem
                          icon={<FileText className="w-4 h-4 text-orange-500" />}
                          label="Document"
                          onClick={() => documentInputRef.current?.click()}
                        />
                        <AttachmentItem
                          icon={<Camera className="w-4 h-4 text-green-500" />}
                          label="Live Camera"
                          onClick={() => cameraInputRef.current?.click()}
                        />
                      </PopoverContent>
                    </Popover>

                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!inputText.trim()}
                      className={cn(
                        "w-9 h-9 rounded-full transition-all duration-300 shadow-sm transition-transform active:scale-95",
                        inputText.trim()
                          ? "bg-primary text-primary-foreground opacity-100 hover:scale-105"
                          : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                      )}
                    >
                      <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
        }
      </div >
    </div >
  );
};

export default ChatScreen;

