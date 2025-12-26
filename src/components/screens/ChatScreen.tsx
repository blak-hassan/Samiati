
import React, { useState, useEffect, useRef } from 'react';
import { Screen, User, Message, Conversation } from '@/types';
import { sendMessageToGemini } from '@/services/geminiService';
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
  Mic,
  PlusCircle,
  Image as ImageIcon,
  FileText,
  Camera,
  ArrowUp,
  History,
  Info,
  ChevronRight,
  Flame,
  Globe
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

interface Language {
  code: string;
  name: string;
  score: number; // 0-100 used to determine level
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

// Data with proficiency scores
const LANGUAGES: Language[] = [
  { code: 'sw', name: 'Swahili', score: 98 },
  { code: 'en', name: 'English', score: 100 },
  { code: 'ki', name: 'Kikuyu', score: 88 },
  { code: 'lu', name: 'Luo', score: 82 },
  { code: 'so', name: 'Somali', score: 85 },
  { code: 'lh', name: 'Luhya', score: 75 },
  { code: 'km', name: 'Kamba', score: 70 },
  { code: 'ka', name: 'Kalenjin', score: 65 },
  { code: 'gu', name: 'Gusii', score: 60 },
  { code: 'me', name: 'Meru', score: 55 },
  { code: 'ma', name: 'Maasai', score: 50 },
  { code: 'yo', name: 'Yoruba', score: 80 },
  { code: 'ig', name: 'Igbo', score: 78 },
  { code: 'ha', name: 'Hausa', score: 85 },
  { code: 'zu', name: 'Zulu', score: 72 },
  { code: 'xh', name: 'Xhosa', score: 68 },
];

const ChatScreen: React.FC<Props> = ({ user, navigate, unreadCount = 0, notificationCounts, activeConversation, onNewChat, onSaveChat, isDarkMode, toggleTheme }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Language State
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]); // Default to Swahili
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');

  // Attachment State
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

  // Feedback State
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Cultural Context Panel State
  const [showContextPanel, setShowContextPanel] = useState(true);
  const [isContextExpanded, setIsContextExpanded] = useState(true);

  // Scroll Header Logic
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const scrollY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
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
      setMessages(activeConversation.messages.length > 0 ? activeConversation.messages : [
        { id: '1', sender: 'ai', text: 'Mambo! I see you want to continue talking about this topic. How can I help further?', timestamp: new Date() }
      ]);
      setShowContextPanel(false);
    } else {
      // New Chat Default
      setMessages([
        { id: '1', sender: 'ai', text: `Mambo! How can I help you explore ${selectedLanguage.name} culture today?`, timestamp: new Date() }
      ]);
      setShowContextPanel(true);
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
  }, [messages, isTyping, isContextExpanded, showContextPanel, activeCommentId]);

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
      if (attachmentRef.current && !attachmentRef.current.contains(event.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
    };

    if (isLanguageDropdownOpen || isAttachmentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageDropdownOpen, isAttachmentMenuOpen]);

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

    setInputText('');
    setIsTyping(true);

    // Pass the selected language context to the AI service
    const contextPrompt = `[Context: User is speaking/learning ${selectedLanguage.name}] ${userMsg.text}`;
    // Pass full message objects for history context
    const aiResponseText = await sendMessageToGemini(contextPrompt, messages);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: aiResponseText,
      timestamp: new Date()
    };

    setIsTyping(false);
    setMessages(prev => {
      const updated = [...prev, aiMsg];
      return updated;
    });
  };

  const handleMicClick = () => {
    if (isMicActive) {
      setIsMicActive(false);
      return;
    }

    setIsMicActive(true);
    // Simulate listening and transcribing
    setTimeout(() => {
      setIsMicActive(false);
      const phrases = {
        'sw': ['Hujambo!', 'Habari yako?', 'Asante sana.', 'Naomba maji.', 'Bei gani?'],
        'en': ['Hello!', 'How are you?', 'Thank you very much.', 'Can I have some water?', 'How much is this?'],
        'default': ['Hello there!', 'Cultural wisdom is amazing.', 'Tell me a story.']
      };

      const langCode = selectedLanguage.code;
      // Basic fallback logic
      const langPhrases = (phrases as any)[langCode] || phrases['default'];
      const randomPhrase = langPhrases[Math.floor(Math.random() * langPhrases.length)];

      setInputText(prev => prev ? `${prev} ${randomPhrase}` : randomPhrase);
    }, 2500);
  };

  const handleNewChatClick = () => {
    // Save current chat before starting new
    if (messages.length > 1) {
      onSaveChat(messages);
    }
    setIsNavOpen(false);
    onNewChat();
  };

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
    setIsLanguageDropdownOpen(false);
    setLanguageSearch(''); // Reset search on select
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
    // Clear input but keep box open to see added comment confirmation
    setCommentText('');
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
          text: `📄 ${file.name}`,
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

  // Sort languages by score (descending) to ensure Expert (high score) is at the top
  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(languageSearch.toLowerCase())
  ).sort((a, b) => b.score - a.score);

  const getProficiencyLevel = (score: number) => {
    if (score >= 90) return 'Expert';
    if (score >= 75) return 'Advanced';
    if (score >= 50) return 'Intermediate';
    return 'Basic';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'text-rasta-green bg-rasta-green/10';
      case 'Advanced': return 'text-rasta-green/80 bg-rasta-green/5';
      case 'Intermediate': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800';
    }
  };

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

            </nav>

            <div className="p-4 border-t border-border mt-auto">
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
        {/* Header - Absolute Positioned for scroll effect */}
        <div
          ref={headerRef}
          className="absolute top-0 left-0 right-0 z-20 transition-all duration-300 ease-in-out bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
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
                {!activeConversation && (
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-black text-primary animate-pulse">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Live AI Guide
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigate(Screen.NOTIFICATIONS)}
                className="relative rounded-full"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background animate-pulse" />
                )}
              </Button>
            </div>
          </header>
        </div>

        {/* Chat Area */}
        <main
          className="flex-1 overflow-y-auto p-4 space-y-6"
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ paddingTop: headerHeight + 16 }} // +16 for base padding
        >
          {/* Cultural Context Panel */}
          {showContextPanel && (
            <Card className="bg-primary/5 border-primary/20 rounded-2xl p-4 relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                <Globe className="w-16 h-16 -mr-4 -mt-4 rotate-12" />
              </div>
              <div className={cn("flex justify-between items-center relative z-10", isContextExpanded ? 'mb-3' : 'mb-0')}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Cultural Whisper</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsContextExpanded(!isContextExpanded)}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    {isContextExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowContextPanel(false)}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {isContextExpanded && (
                <div className="relative z-10 px-1 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-sm text-foreground/80 leading-relaxed font-medium italic">
                    "Habari za asubuhi" is a common Swahili greeting meaning "Good morning". In {selectedLanguage.name} culture, greetings are an essential part of daily life and showing respect.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Messages */}
          {messages.map((msg, index) => (
            <div key={msg.id} className={cn(
              "flex flex-col gap-2 group/msg",
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
                  "p-4 rounded-3xl relative shadow-sm transition-all",
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-card border border-border rounded-tl-none'
                )}>
                  {msg.text.startsWith('data:image') ? (
                    <img src={msg.text} alt="User upload" className="rounded-2xl max-h-72 w-full object-cover shadow-inner" />
                  ) : (
                    <p className="text-sm md:text-base leading-relaxed tracking-tight font-medium whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  )}

                  {/* Message Timestamp (visible on hover) */}
                  <span className={cn(
                    "absolute -bottom-5 text-[10px] font-bold text-muted-foreground/0 group-hover/msg:text-muted-foreground/60 transition-all",
                    msg.sender === 'user' ? 'right-0' : 'left-0'
                  )}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* AI Feedback & Interaction */}
              {msg.sender === 'ai' && (
                <div className="flex flex-col gap-2 ml-11 max-w-[85%] mt-1">
                  <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFeedback(msg.id, 'up')}
                      className={cn(
                        "h-8 w-8 rounded-full",
                        msg.feedback === 'up' ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <ThumbsUp className={cn("w-3.5 h-3.5", msg.feedback === 'up' && "fill-current")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleFeedback(msg.id, 'down')}
                      className={cn(
                        "h-8 w-8 rounded-full",
                        msg.feedback === 'down' ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <ThumbsDown className={cn("w-3.5 h-3.5", msg.feedback === 'down' && "fill-current")} />
                    </Button>
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCommentBox(msg.id)}
                      className={cn(
                        "h-8 px-2.5 rounded-full gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                        activeCommentId === msg.id || (msg.comments && msg.comments.length > 0)
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <MessageCircle className={cn("w-3.5 h-3.5", msg.comments && msg.comments.length > 0 && "fill-current")} />
                      Feedback
                      {msg.comments && msg.comments.length > 0 && (
                        <Badge variant="default" className="h-4 min-w-[16px] p-0 flex items-center justify-center bg-primary text-[8px]">
                          {msg.comments.length}
                        </Badge>
                      )}
                    </Button>
                  </div>

                  {/* Feedback Expansion */}
                  {(activeCommentId === msg.id || (msg.comments && msg.comments.length > 0)) && (
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
        <div className="bg-background border-t border-border p-3 shrink-0 transition-colors duration-300 relative z-20">
          <div className="max-w-4xl mx-auto bg-muted/50 border border-primary/20 rounded-[28px] px-3 py-2 flex items-end gap-2 transition-all shadow-sm focus-within:shadow-lg focus-within:ring-2 focus-within:ring-primary/10 group">

            {/* Language Selector Popover */}
            <Popover open={isLanguageDropdownOpen} onOpenChange={setIsLanguageDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mb-1 h-8 px-3 rounded-full gap-1.5 font-bold text-[10px] uppercase tracking-wider bg-background border border-border/50 hover:bg-muted"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {selectedLanguage.name}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-[240px] p-0 mb-3 rounded-2xl shadow-xl border-border bg-background">
                <div className="p-3 border-b border-border bg-muted/30">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search languages..."
                      value={languageSearch}
                      onChange={(e) => setLanguageSearch(e.target.value)}
                      className="pl-9 h-9 rounded-xl text-sm border-none bg-background focus-visible:ring-1 focus-visible:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-1 py-1.5">
                  {filteredLanguages.length > 0 ? (
                    filteredLanguages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageSelect(lang)}
                        className={cn(
                          "w-full px-3 py-2.5 text-left hover:bg-muted transition-all flex items-center justify-between rounded-lg group",
                          selectedLanguage.code === lang.code && "bg-primary/5 shadow-inner"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-sm font-bold",
                            selectedLanguage.code === lang.code ? "text-primary" : "text-foreground"
                          )}>
                            {lang.name}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                            {getProficiencyLevel(lang.score)}
                          </span>
                        </div>
                        {selectedLanguage.code === lang.code && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white scale-75">
                            <ArrowUp className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-xs italic font-medium">
                      No matching cultures found
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Main Textarea */}
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
              placeholder="Type or Speak to Samiati..."
              className="flex-1 bg-transparent border-none text-foreground placeholder-muted-foreground/70 focus:ring-0 outline-none text-sm md:text-base resize-none min-h-[40px] max-h-[120px] py-2.5 px-1 scroll-area font-medium"
              rows={1}
            />

            {/* Actions Toolbar */}
            <div className="flex items-center gap-1.5 mb-1 mr-1">
              {isMicActive ? (
                <Button variant="ghost" size="icon" className="h-10 w-10 text-primary animate-pulse bg-primary/5 rounded-full">
                  <div className="flex gap-0.5 items-center">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-1 bg-primary rounded-full" style={{ height: Math.random() * 16 + 8 + 'px' }}></div>
                    ))}
                  </div>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMicClick}
                  className="rounded-full text-muted-foreground hover:text-primary transition-colors h-10 w-10"
                  aria-label="Voice input"
                >
                  <Mic className="w-5 h-5" />
                </Button>
              )}

              {/* Attachments Menu Popover */}
              <Popover open={isAttachmentMenuOpen} onOpenChange={setIsAttachmentMenuOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground hover:text-primary transition-colors h-10 w-10"
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
                  "w-10 h-10 rounded-full transition-all duration-300 shadow-md transform hover:translate-y-[-2px] active:scale-95",
                  inputText.trim()
                    ? "bg-primary text-primary-foreground opacity-100"
                    : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed grayscale"
                )}
              >
                <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
