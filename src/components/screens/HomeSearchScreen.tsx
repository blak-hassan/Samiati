"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Screen, Message, Conversation } from "@/types";
import SamiatiLogo from "@/components/SamiatiLogo";
import { Language, LANGUAGES } from "@/components/chat/LanguageSelector";
import SearchHero from "@/components/search/SearchHero";
import SuggestionSentences from "@/components/search/SuggestionSentences";
import SearchPhaseIndicator from "@/components/search/SearchPhaseIndicator";
import SearchResults from "@/components/search/SearchResults";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { searchWithGrounding, SearchResult, SearchImage, SearchAttachment, transcribeAudioBase64, synthesizeSpeech } from "@/services/geminiService";
import { Source } from "@/components/search/SourceCard";
import { Button } from "@/components/ui/button";
import { Menu, SquarePen, ArrowDown } from "lucide-react";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { cn } from "@/lib/utils";

interface Props {
  user?: {
    name?: string;
    handle?: string;
    avatar?: string;
    role?: string;
    location?: string;
    culturalBackground?: string;
    isGuest?: boolean;
  };
  navigate: (screen: Screen) => void;
  unreadCount?: number;
  notificationCounts?: {
    contributions?: number;
    moderation?: number;
  };
  activeConversation?: Conversation | null;
  onNewChat?: () => void;
  onSaveChat?: (conversationId: string | null, messages: Message[]) => void;
}

// User queries keep a bubble; AI replies render as plain text (Perplexity style)
const ThreadMessage: React.FC<{ msg: Message }> = ({ msg }) => (
  <div
    className={cn(
      "w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
      msg.sender === "user" && "flex justify-end"
    )}
  >
    {msg.sender === "user" ? (
      <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-md bg-primary text-primary-foreground text-sm md:text-base leading-relaxed tracking-tight whitespace-pre-wrap shadow-sm">
        {msg.text}
      </div>
    ) : (
      <p className="text-sm md:text-base leading-relaxed tracking-tight whitespace-pre-wrap font-medium text-foreground/85">
        {msg.text}
      </p>
    )}
  </div>
);

const HomeSearchScreen: React.FC<Props> = ({
  user,
  navigate,
  unreadCount = 0,
  notificationCounts,
  activeConversation,
  onNewChat,
  onSaveChat,
}) => {
  // Clerk session — AI actions require an authenticated caller
  const { getToken } = useAuth();

  // Language
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    LANGUAGES.find((l) => l.code === "sw") || LANGUAGES[0]
  );

  // Search state
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [images, setImages] = useState<SearchImage[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [searchComplete, setSearchComplete] = useState(false);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // TTS state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Attachments (documents feed the model; images are kept as context chips)
  const [attachments, setAttachments] = useState<SearchAttachment[]>([]);
  const docInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Navigation drawer
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Chat-scroll state — auto-scroll to the latest message when the user is
  // near the bottom; otherwise offer a scroll-to-bottom button.
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = dist < 160;
    setShowScrollBtn(dist > 240);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    nearBottomRef.current = true;
    setShowScrollBtn(false);
  }, []);

  // Conversation thread — synced with the active conversation from the parent
  const [messages, setMessages] = useState<Message[]>(activeConversation?.messages ?? []);
  const messagesRef = useRef<Message[]>(messages);

  // Follow the latest message while chatting
  useEffect(() => {
    if (!nearBottomRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isSearching, searchComplete, answer]);

  useEffect(() => {
    const msgs = activeConversation?.messages ?? [];
    messagesRef.current = msgs;
    setMessages(msgs);
  }, [activeConversation]);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery);
      setIsSearching(true);
      setSearchComplete(false);
      setAnswer("");
      setSources([]);
      setImages([]);
      setFollowUps([]);
      nearBottomRef.current = true;

      try {
        // Attached documents become grounding context for the answer
        const documentText = attachments
          .filter((a) => a.kind === "doc" && a.text)
          .map((a) => a.text as string)
          .join("\n\n")
          .slice(0, 8000);

        const result: SearchResult = await searchWithGrounding(
          searchQuery,
          selectedLanguage.name,
          selectedLanguage.code,
          documentText,
          (await getToken()) ?? undefined
        );
        setAnswer(result.answer);
        setSources(result.sources);
        setImages(result.images);
        setFollowUps(result.followUps);

        // Persist the Q&A pair into the current conversation
        const userMsg: Message = {
          id: `u_${Date.now()}`,
          sender: "user",
          text: searchQuery,
          timestamp: new Date(),
        };
        const aiMsg: Message = {
          id: `a_${Date.now()}`,
          sender: "ai",
          text: result.answer,
          timestamp: new Date(),
        };
        const next = [...messagesRef.current, userMsg, aiMsg];
        messagesRef.current = next;
        setMessages(next);
        onSaveChat?.(activeConversation?.id ?? null, next);
      } catch (error) {
        console.error("Search failed:", error);
        setAnswer(
          error instanceof Error
            ? `Sorry, I encountered an error: ${error.message}`
            : "Sorry, I encountered an error while searching. Please try again."
        );
      } finally {
        setIsSearching(false);
        setSearchComplete(true);
      }
    },
    [selectedLanguage, onSaveChat, activeConversation?.id, attachments]
  );

  const handleSuggestionSelect = (suggestionQuery: string) => {
    handleSearch(suggestionQuery);
  };

  const handleFollowUpSelect = (followUpQuery: string) => {
    handleSearch(followUpQuery);
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Microphone access is not supported. Please use a secure connection (HTTPS) or localhost.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const base64String = String(reader.result ?? "").split(",")[1];
            if (base64String) {
              const response = await transcribeAudioBase64(base64String, (await getToken()) ?? undefined);
              if (response.text) {
                setQuery((prev) => (prev ? `${prev} ${response.text}` : response.text));
              } else if (response.error) {
                console.error("Transcription error:", response.error);
              }
            }
          } catch (err) {
            console.error("Transcription failed:", err);
          } finally {
            setIsTranscribing(false);
          }
        };

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Could not access microphone.");
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      startRecording();
    }
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    if (!answer) return;

    try {
      const result = await synthesizeSpeech(answer, selectedLanguage.code, (await getToken()) ?? undefined);
      if (result.audioBase64) {
        const audio = new Audio(`data:${result.contentType};base64,${result.audioBase64}`);
        audioRef.current = audio;
        audio.onended = () => {
          setIsPlaying(false);
          audioRef.current = null;
        };
        audio.play();
        setIsPlaying(true);
      } else if (result.error) {
        console.error("TTS error:", result.error);
      }
    } catch (err) {
      console.error("Failed to play audio:", err);
    }
  };

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Document is too large (max 2MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "").slice(0, 20000);
      setAttachments((prev) => [
        ...prev,
        { id: `doc_${Date.now()}`, name: file.name, kind: "doc" as const, text },
      ]);
    };
    reader.readAsText(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAttachments((prev) => [
      ...prev,
      { id: `img_${Date.now()}`, name: file.name, kind: "image" as const },
    ]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleNewSearch = () => {
    setSearchComplete(false);
    setQuery("");
    setAnswer("");
    setSources([]);
    setImages([]);
    setFollowUps([]);
    setAttachments([]);
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
    messagesRef.current = [];
    setMessages([]);
    onNewChat?.();
  };

  // While a fresh result is on screen, hide its Q&A from the thread to avoid duplication
  const threadMessages =
    searchComplete && !!answer && messages.length >= 2
      ? messages.slice(0, -2)
      : messages;

// Welcome mode: empty thread and no active search — centered hero
  const welcomeMode = !searchComplete && !isSearching && messages.length === 0;

  return (
    <div className="flex h-[100dvh] bg-background relative overflow-hidden">
      {/* Hidden attachment pickers */}
      <input
        ref={docInputRef}
        type="file"
        accept=".txt,.md,.csv,.json,.log,text/plain,text/markdown,text/csv,application/json"
        className="hidden"
        onChange={handleDocumentSelect}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      {/* Sidebar — persistent on desktop, drawer on mobile */}
      <AppSidebar
        open={isNavOpen}
        onOpenChange={setIsNavOpen}
        user={user}
        onNavigate={navigate}
        onNewSearch={handleNewSearch}
        notificationCounts={notificationCounts}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — floating, no border */}
        <header className="sticky top-0 z-30 shrink-0">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNavOpen((prev) => !prev)}
                className="rounded-full transition-colors bg-background/50 backdrop-blur-sm lg:hidden"
                aria-label="Toggle navigation"
                aria-expanded={isNavOpen}
              >
                <Menu className="w-6 h-6" />
              </Button>

              {activeConversation && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNewSearch}
                    className="rounded-full gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
                    aria-label="New chat"
                  >
                    <SquarePen className="w-4 h-4" />
                    <span className="hidden sm:inline">New chat</span>
                  </Button>
                  <h1 className="text-sm font-bold text-foreground truncate max-w-[160px] sm:max-w-[240px]">
                    {activeConversation.title}
                  </h1>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {user && <NotificationBell unreadCount={unreadCount} onNavigate={navigate} />}
              {!user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(Screen.SIGN_IN)}
                  className="rounded-full text-xs font-bold px-3 h-8"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Welcome Mode — centered hero with input */}
        {welcomeMode ? (
          <main className="flex-1 overflow-y-auto">
            <div className="min-h-full flex flex-col items-center justify-center w-full px-4 py-8 animate-in fade-in duration-500">
              {/* Logo */}
              <div className="flex flex-col items-center mb-8 shrink-0">
                <div className="hover:scale-105 transition-transform duration-300 mb-2">
                  <SamiatiLogo size={80} className="scale-110" />
                </div>
              </div>

              {/* Search Input — language in bar via SearchHero */}
              <SearchHero
                value={query}
                onValueChange={setQuery}
                onSubmit={handleSearch}
                onVoiceInput={handleVoiceInput}
                isSearching={isSearching}
                isRecording={isRecording}
                isTranscribing={isTranscribing}
                selectedLanguage={selectedLanguage}
                onLanguageSelect={setSelectedLanguage}
                attachments={attachments}
                onAttachDocument={() => docInputRef.current?.click()}
                onAttachImage={() => imageInputRef.current?.click()}
                onRemoveAttachment={handleRemoveAttachment}
              />

              {/* Trending Searches (personalized to language selected in dropdown) */}
              <SuggestionSentences
                selectedLanguage={selectedLanguage}
                onSelect={handleSuggestionSelect}
              />
            </div>
          </main>
        ) : (
          <>
            {/* Chat Area — scrolls, input stays pinned at the bottom */}
            <main
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
            >
              <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
                {/* Fresh Result — tabs + answer at the top of the page */}
                {searchComplete && answer && (
                  <div className="animate-in fade-in duration-500 delay-200">
                    <SearchResults
                      answer={answer}
                      sources={sources}
                      images={images}
                      followUps={followUps}
                      onFollowUpSelect={handleFollowUpSelect}
                      isPlaying={isPlaying}
                      onPlayAudio={handlePlayAudio}
                    />
                  </div>
                )}

                {/* Live turn — the just-submitted question while searching */}
                {isSearching && (
                  <div className="space-y-3">
                    <ThreadMessage
                      msg={{
                        id: `live_${Date.now()}`,
                        sender: "user",
                        text: query,
                        timestamp: new Date(),
                      }}
                    />
                    <SearchPhaseIndicator isSearching={isSearching} />
                  </div>
                )}

                {/* Conversation Thread (previous Q&As) */}
                {threadMessages.length > 0 && (
                  <div className="space-y-3 animate-in fade-in duration-500">
{threadMessages.map((msg) => (
                      <ThreadMessage key={msg.id} msg={msg} />
                    ))}
                  </div>
                )}
              </div>
            </main>

            {/* Scroll to Bottom FAB */}
            {showScrollBtn && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-36 right-4 z-30 w-10 h-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 animate-in fade-in zoom-in-75"
                aria-label="Scroll to bottom"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            )}

            {/* Bottom Input Bar — pinned like standard AI chat apps */}
            <div className="shrink-0 relative z-20 px-4 pt-4 pb-5 bg-gradient-to-t from-background via-background/80 to-transparent">
              <div className="max-w-2xl mx-auto">
                <SearchHero
                  compact
                  value={query}
                  onValueChange={setQuery}
                  onSubmit={handleSearch}
                  onVoiceInput={handleVoiceInput}
                  isSearching={isSearching}
                  isRecording={isRecording}
                  isTranscribing={isTranscribing}
                  selectedLanguage={selectedLanguage}
                  onLanguageSelect={setSelectedLanguage}
                  attachments={attachments}
                  onAttachDocument={() => docInputRef.current?.click()}
                  onAttachImage={() => imageInputRef.current?.click()}
                  onRemoveAttachment={handleRemoveAttachment}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomeSearchScreen;
