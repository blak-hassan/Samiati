"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Screen, User, Message, Conversation } from '@/types';
import { NotificationBell } from '@/components/shared/NotificationBell';
import SamiatiLogo from '@/components/SamiatiLogo';

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
  ArrowDown,
  History,
  Info,
  ChevronRight,
  Flame,
  Globe,
  Megaphone,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Mic,
  Square,
  Volume2,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn, copyToClipboard } from "@/lib/utils";

interface Props {
  user: User;
  navigate: (screen: Screen) => void;
  unreadCount?: number;
  notificationCounts?: {
    total: number;
    contributions: number;
    moderation: number;

    watu: number;
  };
  activeConversation: Conversation | null;
  onNewChat: () => void;
  onSaveChat: (messages: Message[]) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

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

interface MessageBubbleProps {
  msg: Message;
  index: number;
  user: User;
  selectedLanguage: Language;
  expandedTranslations: { [key: string]: boolean };
  playingMessageId: string | null;
  isSynthesizing: string | null;
  copiedMessageId: string | null;
  activeCommentId: string | null;
  onToggleTranslation: (id: string) => void;
  onPlayAudio: (id: string, text: string, language: string) => void;
  onCopy: (text: string, id: string) => void;
  onFeedback: (id: string, type: 'up' | 'down') => void;
  onToggleComment: (id: string) => void;
}

const MessageBubble = memo(function MessageBubble({
  msg,
  user,
  selectedLanguage,
  expandedTranslations,
  playingMessageId,
  isSynthesizing,
  copiedMessageId,
  activeCommentId,
  onToggleTranslation,
  onPlayAudio,
  onCopy,
  onFeedback,
  onToggleComment,
}: MessageBubbleProps) {
  return (
    <div className={cn(
      "flex flex-col gap-1 group/msg",
      msg.sender === 'user' ? 'items-end' : 'items-start'
    )}>
      <div className={cn(
        "flex items-start gap-3 w-full max-w-[90%] md:max-w-[80%]",
        msg.sender === 'user' && 'flex-row-reverse self-end'
      )}>
        {msg.sender === 'ai' ? (
          <Avatar className="w-8 h-8 shrink-0 shadow-sm mt-1 bg-transparent p-0">
            <AvatarImage src="/samiati-logo.svg" className="object-cover rounded-md" />
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
              {msg.sender === 'ai' && selectedLanguage.code !== 'en' && msg.translatedText ? msg.translatedText : msg.text}
            </p>
          )}

          {msg.sender === 'ai' && selectedLanguage.code !== 'en' && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleTranslation(msg.id)}
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

          {msg.sender === 'user' && (
            <span className="absolute -bottom-5 right-0 text-[10px] font-bold text-muted-foreground/0 group-hover/msg:text-muted-foreground/60 transition-all">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {msg.sender === 'ai' && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 ml-10 mt-2 mb-2 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPlayAudio(msg.id, msg.translatedText || msg.text, msg.targetLanguage || 'sw')}
            className={cn(
              "h-6 w-6 rounded-full transition-all",
              playingMessageId === msg.id
                ? "text-primary bg-primary/10 animate-pulse"
                : isSynthesizing === msg.id
                  ? "text-muted-foreground opacity-50 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            disabled={isSynthesizing === msg.id}
            title={playingMessageId === msg.id ? "Stop audio" : "Listen"}
          >
            {isSynthesizing === msg.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : playingMessageId === msg.id ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </Button>

          <div className="h-3 w-[1px] bg-border" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onFeedback(msg.id, 'up')}
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
              onClick={() => onFeedback(msg.id, 'down')}
              className={cn(
                "h-6 w-6 rounded-full hover:bg-muted/50 transition-colors",
                msg.feedback === 'down' ? "text-red-500" : "text-muted-foreground"
              )}
            >
              <ThumbsDown className={cn("w-3.5 h-3.5", msg.feedback === 'down' && "fill-current")} />
            </Button>
          </div>

          <div className="h-3 w-[1px] bg-border" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCopy(msg.text, msg.id)}
            className="h-6 w-6 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
            title="Copy text"
          >
            {copiedMessageId === msg.id ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleComment(msg.id)}
            className="h-6 w-6 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
            title="Feedback"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
});

const MESSAGES_PER_PAGE = 20;

const ChatScreen: React.FC<Props> = ({ user, navigate, unreadCount = 0, notificationCounts, activeConversation, onNewChat, onSaveChat, isDarkMode, toggleTheme }) => {
  const sendMessageAction = useAction(api.chat.sendMessage);
  const transcribeAudio = useAction(api.asr.transcribeAudio);
  const synthesizeSpeech = useAction(api.tts.synthesizeSpeech);

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

  // ASR State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // TTS State
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    copyToClipboard(text);
    setCopiedMessageId(id);
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  };

  // Welcome Mode - true when no user messages exist (Google-style centered layout)
  const isWelcomeMode = !messages.some(m => m.sender === 'user');

  // Scroll Header Logic
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [visibleCount, setVisibleCount] = useState(MESSAGES_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Scroll & State Persistence
  const conversationStates = useRef<{ [id: string]: { scrollTop: number, visibleCount: number } }>({});
  const prevConversationId = useRef<string | null>(null);

  const scrollY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldForceScroll = useRef(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const attachmentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

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

  // Scroll Handler - wrapped in useCallback with throttle
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const currentScrollY = scrollRef.current.scrollTop;
    const diff = currentScrollY - scrollY.current;

    if (currentScrollY < 0) return;

    if (diff > 10) {
      setIsHeaderVisible(false);
    } else if (diff < -10) {
      setIsHeaderVisible(true);
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollToBottom(distanceFromBottom > 150);

    if (distanceFromBottom <= 150) {
      setHasNewMessage(false);
    }

    scrollY.current = currentScrollY;

    if (activeConversation && scrollRef.current) {
      conversationStates.current[activeConversation.id] = {
        scrollTop: currentScrollY,
        visibleCount
      };
    }

    if (currentScrollY < 100 && !isLoadingMore && visibleCount < messages.length) {
      setIsLoadingMore(true);
      const prevScrollHeight = scrollRef.current.scrollHeight;
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + MESSAGES_PER_PAGE, messages.length));
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const newScrollHeight = scrollRef.current.scrollHeight;
            scrollRef.current.scrollTop = newScrollHeight - prevScrollHeight + currentScrollY;
          }
          setIsLoadingMore(false);
        });
      }, 400);
    }
  }, [activeConversation, isLoadingMore, visibleCount, messages.length]);

  // Initialize or Update Messages based on Active Conversation
  useEffect(() => {
    if (activeConversation) {
      // Check if we switched conversations
      const isDifferentConversation = activeConversation.id !== prevConversationId.current;

      // Load saved messages
      const hasUserMessages = activeConversation.messages.some(m => m.sender === 'user');
      if (hasUserMessages) {
        setMessages(activeConversation.messages);
      } else {
        setMessages([]);
      }

      if (isDifferentConversation) {
        // Restore state if available
        const savedState = conversationStates.current[activeConversation.id];
        if (savedState) {
          setVisibleCount(savedState.visibleCount);
          // Restore scroll position after render
          requestAnimationFrame(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = savedState.scrollTop;
            }
          });
        } else {
          // Default for new/unvisited conversation
          setVisibleCount(MESSAGES_PER_PAGE);
        }

        // Reset new message indicator on switch
        setHasNewMessage(false);
        prevConversationId.current = activeConversation.id;
      }
    } else {
      // New Chat Default - Start Empty
      setMessages([]);
      setVisibleCount(MESSAGES_PER_PAGE);
      setHasNewMessage(false);
      prevConversationId.current = null;
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
    if (!scrollRef.current) {
      if (shouldForceScroll.current) {
        scrollToBottom();
        shouldForceScroll.current = false;
      }
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < 150 || shouldForceScroll.current) {
      // User is near the bottom OR forced (user sent message) — auto-scroll
      scrollToBottom();
      shouldForceScroll.current = false;
    } else {
      // User is scrolled up — show new message indicator instead
      setHasNewMessage(true);
    }
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
    shouldForceScroll.current = true; // Force scroll to bottom for user messages
    onSaveChat(newMessages);

    setInputText('');
    setIsTyping(true);

    // Pass the selected language context to the AI service
    // Reply directly in the selected language (Gemma 4 supports many languages natively)
    const contextPrompt = `[Instruction: Reply in ${selectedLanguage.name} language naturally. Do NOT define words. Do NOT explain content. Just reply as a friend.]`;

    // Call Convex Action (Gemma 4 E2B)
    const history = messages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    // Add current message properly (User message + Instruction)
    const payload = [...history, { role: 'user', content: contextPrompt }];

    const aiResponseText = await sendMessageAction({ 
      messages: payload,
      targetLanguage: selectedLanguage.name
    });

    // Check if response is an error message
    if (aiResponseText.startsWith && aiResponseText.startsWith("ERROR:")) {
      console.error("Chat error:", aiResponseText);
      // Display error to user but don't crash
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date()
      }]);
      return;
    }

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: aiResponseText,
      translatedText: aiResponseText, // AI replies in target language directly
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

  const startRecording = async () => {
    try {
      // Check if the browser supports mediaDevices (requires HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Microphone access is not supported. Please ensure you use a secure connection (HTTPS) or localhost.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64String = base64data.split(',')[1];

          try {
            const response = await transcribeAudio({ audioBase64: base64String });
            if (response.text) {
              setInputText(prev => prev ? `${prev} ${response.text}` : response.text);
              // Auto-resize textarea
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
                }
              }, 0);
            }
          } catch (err) {
            console.error("Transcription failed:", err);
          } finally {
            setIsTranscribing(false);
          }
        };

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePlayAudio = async (messageId: string, text: string, language: string) => {
    if (playingMessageId === messageId) {
      // Stop current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingMessageId(null);
      return;
    }

    setIsSynthesizing(messageId);

    try {
      // Language code for TTS is derived from selectedLanguage name/nllbCode mapping
      const result = await synthesizeSpeech({
        text,
        language: selectedLanguage.code
      });

      if (result.audioBase64) {
        const audioUrl = `data:${result.contentType};base64,${result.audioBase64}`;

        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setPlayingMessageId(null);
        };

        audio.play();
        setPlayingMessageId(messageId);
      }
    } catch (err) {
      console.error("Failed to play audio:", err);
    } finally {
      setIsSynthesizing(null);
    }
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

      {/* Sidebar — persistent on desktop, drawer on mobile */}
      <AppSidebar
        open={isNavOpen}
        onOpenChange={setIsNavOpen}
        user={{
          name: user.name,
          handle: user.handle,
          avatar: user.avatar,
          role: user.role,
          isGuest: false,
        }}
        onNavigate={handleNavigate}
        onNewSearch={handleNewChatClick}
        notificationCounts={{
          contributions: notificationCounts?.contributions,
          moderation: notificationCounts?.moderation,
        }}
      />

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
                  onClick={() => setIsNavOpen((prev) => !prev)}
                  className="rounded-full transition-colors lg:hidden"
                  aria-label="Toggle navigation"
                  aria-expanded={isNavOpen}
                >
                  <Menu className="w-6 h-6" />
                </Button>
                <div className="flex flex-col cursor-pointer" onClick={handleNewChatClick}>
                  <h1 className="text-lg font-bold text-foreground truncate max-w-[200px] leading-tight tracking-tight hover:text-primary transition-colors">
                    {activeConversation ? activeConversation.title : 'Samiati'}
                  </h1>
                </div>
              </div>
              <NotificationBell unreadCount={unreadCount} onNavigate={navigate} />
            </header>
          </div>
        )}

        {/* Welcome Mode - Google-style centered layout */}
        {isWelcomeMode ? (
          <div className="flex-1 relative flex flex-col overflow-y-auto w-full">
            {/* Menu button in corner for welcome mode */}
            <div className="sticky top-0 left-0 w-full z-10 pointer-events-none p-4 flex justify-between items-start">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNavOpen((prev) => !prev)}
                className="rounded-full transition-colors pointer-events-auto bg-background/50 backdrop-blur-sm lg:hidden"
                aria-label="Toggle navigation"
                aria-expanded={isNavOpen}
              >
                <Menu className="w-6 h-6" />
              </Button>
              <div className="pointer-events-auto">
                <NotificationBell unreadCount={unreadCount} onNavigate={navigate} />
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center min-h-full w-full px-4 -mt-20 pb-8 animate-in fade-in duration-500">

              {/* Logo and Branding */}
              <div className="flex flex-col items-center mb-8 shrink-0">
                <div className="hover:scale-105 transition-transform duration-300 mb-2">
                  <SamiatiLogo size={80} className="scale-110" />
                </div>
                
              </div>

              {/* Centered Input Bar */}
              <div className="w-full max-w-2xl shrink-0 px-2 sm:px-0">
                <div ref={inputContainerRef} className="bg-background border border-border/40 rounded-[24px] px-3 sm:px-4 py-3 flex flex-col gap-2 sm:gap-3 transition-all shadow-xl shadow-primary/5 focus-within:shadow-2xl focus-within:ring-1 focus-within:ring-primary/20">

                  {/* Top Layer: Text Input */}
                  <div className="w-full">
                    <textarea
                      ref={textareaRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onFocus={() => {
                        // Scroll to end (bottom) to maximize space above for the logo
                        setTimeout(() => {
                          inputContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        }, 300);
                      }}
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
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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

                      {/* Microphone Button */}
                      <Button
                        size="icon"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isTranscribing}
                        className={cn(
                          "w-9 h-9 rounded-full transition-all duration-300 shadow-sm transition-transform active:scale-95",
                          isTranscribing
                            ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                            : isRecording
                              ? "bg-red-500 text-white animate-pulse"
                              : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        aria-label="Toggle voice recording"
                      >
                        {isTranscribing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isRecording ? (
                          <Square className="w-4 h-4 fill-current" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || isTranscribing}
                        className={cn(
                          "w-9 h-9 rounded-full transition-all duration-300 shadow-sm transition-transform active:scale-95",
                          inputText.trim() && !isTranscribing
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
          </div>
        ) : (
          <>
            {/* Chat Area */}
            <main
              className="flex-1 overflow-y-auto overflow-x-hidden pt-20 px-4 pb-4 space-y-6 scroll-smooth overscroll-contain"
              ref={scrollRef}
              onScroll={handleScroll}
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Loading older messages indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="ml-2 text-xs font-medium text-muted-foreground">Loading older messages...</span>
                </div>
              )}
              {/* Show indicator for hidden history */}
              {!isLoadingMore && visibleCount < messages.length && (
                <div className="flex items-center justify-center py-2">
                  <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">↑ Scroll up for older messages</span>
                </div>
              )}
              {/* Messages */}
              {messages.slice(-visibleCount).map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  index={0}
                  user={user}
                  selectedLanguage={selectedLanguage}
                  expandedTranslations={expandedTranslations}
                  playingMessageId={playingMessageId}
                  isSynthesizing={isSynthesizing}
                  copiedMessageId={copiedMessageId}
                  activeCommentId={activeCommentId}
                  onToggleTranslation={toggleTranslation}
                  onPlayAudio={handlePlayAudio}
                  onCopy={handleCopy}
                  onFeedback={handleFeedback}
                  onToggleComment={toggleCommentBox}
                />
              ))}

              {isTyping && (
                <div className="flex items-start gap-3 w-full self-start">
                  <Avatar className="w-8 h-8 shrink-0 border border-primary/20 shadow-sm animate-pulse">
                    <AvatarFallback>...</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted/30 border border-border p-4 rounded-3xl rounded-tl-none flex gap-1.5 items-center shadow-sm">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-typing-dot" style={{ animationDelay: '-0.3s' }}></span>
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-typing-dot" style={{ animationDelay: '-0.15s' }}></span>
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-typing-dot"></span>
                  </div>
                </div>
              )}
            </main>

            {/* Scroll to Bottom FAB */}
            {showScrollToBottom && (
              <div className="absolute bottom-24 right-4 z-30 flex flex-col items-end gap-2">
                {/* New message indicator */}
                {hasNewMessage && (
                  <button
                    onClick={() => {
                      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
                      setHasNewMessage(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    New message
                  </button>
                )}
                {/* Scroll to bottom button */}
                <button
                  onClick={() => {
                    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
                    setHasNewMessage(false);
                  }}
                  className="w-10 h-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 animate-in fade-in zoom-in-75"
                  aria-label="Scroll to bottom"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Standardized Input Area */}
            <div className="bg-background p-2 shrink-0 transition-colors duration-300 relative z-20 pb-4">
              <div ref={inputContainerRef} className="max-w-4xl mx-auto bg-background/50 border border-border/40 rounded-[24px] px-4 py-3 flex flex-col gap-2 transition-all shadow-sm focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/10 group backdrop-blur-sm">

                {/* Top Layer: Text Input */}
                <div className="w-full">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onFocus={() => {
                      // Double scroll attempt to catch immediate focus and post-keyboard animation
                      setTimeout(() => {
                        inputContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                      setTimeout(() => {
                        inputContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 500);
                    }}
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

                    {/* Microphone Button */}
                    <Button
                      size="icon"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isTranscribing}
                      className={cn(
                        "w-9 h-9 rounded-full transition-all duration-300 shadow-sm transition-transform active:scale-95",
                        isTranscribing
                          ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                          : isRecording
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                      aria-label="Toggle voice recording"
                    >
                      {isTranscribing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isRecording ? (
                        <Square className="w-4 h-4 fill-current" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>

                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || isTranscribing}
                      className={cn(
                        "w-9 h-9 rounded-full transition-all duration-300 shadow-sm transition-transform active:scale-95",
                        inputText.trim() && !isTranscribing
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

