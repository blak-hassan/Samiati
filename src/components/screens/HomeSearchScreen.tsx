'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAction } from 'convex/react';
import {
  ArrowDown,
  Check,
  Compass,
  Copy,
  HeartHandshake,
  Languages,
  Menu,
  MessageCircle,
  SquarePen,
} from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { type Conversation, type Message, Screen } from '@/types';
import { LanguageSelector, LANGUAGES, type Language } from '@/components/chat/LanguageSelector';
import SearchHero from '@/components/search/SearchHero';
import SuggestionSentences from '@/components/search/SuggestionSentences';
import SearchPhaseIndicator from '@/components/search/SearchPhaseIndicator';
import SearchResults from '@/components/search/SearchResults';
import {
  fetchWikipediaLinks,
  fetchCommonsImages,
  type SearchImage,
  type SearchAttachment,
} from '@/services/sunflowerService';
import { type Source } from '@/components/search/SourceCard';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/shared/AppSidebar';
import FeedbackBar from '@/components/feedback/FeedbackBar';
import { ThemeToggle } from '@/components/product/ThemeToggle';
import { getProductLanguage } from '@/lib/productLanguages';
import { useSettings } from '@/hooks/useSettings';
import { formatMessageTime } from '@/lib/settings';
import { getSavedLanguageCode, isServiceError } from '@/components/chat/history';
import { cn } from '@/lib/utils';

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
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  unreadCount?: number;
  notificationCounts?: { contributions?: number; moderation?: number };
  activeConversation?: Conversation | null;
  onNewChat?: () => void;
  onSaveChat?: (conversationId: string | null, messages: Message[], language?: Language) => void;
  conversations?: Conversation[];
  initialQuery?: string;
}
interface ChatActions {
  searchAction?: (args: {
    query: string;
    language: string;
    links: Source[];
    document: string;
  }) => Promise<{ answer: string; sources: Source[]; followUps: string[] }>;
  transcribeAction?: (args: {
    audioBase64: string;
  }) => Promise<{ text: string; error: string | null }>;
  ttsAction?: (args: {
    text: string;
    language: string;
  }) => Promise<{ audioBase64: string | null; contentType?: string; error: string | null }>;
}

function ThreadMessage({
  msg,
  conversationId,
  language,
  children,
  feedbackEnabled = true,
}: {
  msg: Message;
  conversationId?: string;
  language?: string;
  children?: React.ReactNode;
  feedbackEnabled?: boolean;
}) {
  const { settings } = useSettings();
  const [copyStatus, setCopyStatus] = useState('');
  const timestamp = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp);
  const validTimestamp = Number.isFinite(timestamp.getTime());
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopyStatus('Answer copied.');
    } catch {
      setCopyStatus('Copy is unavailable. Select and copy the answer text instead.');
    }
  };
  return (
    <article
      aria-label={msg.sender === 'user' ? 'Your message' : 'Samiati response'}
      className={cn('min-w-0 py-2', msg.sender === 'user' && 'flex justify-end')}
    >
      {msg.sender === 'user' ? (
        <div className="max-w-[90%] rounded-2xl rounded-br-md border border-border bg-secondary px-4 py-3 leading-relaxed [overflow-wrap:anywhere]">
          <p className="whitespace-pre-wrap">{msg.text}</p>
          {settings.showTimestamps && validTimestamp && (
            <time
              dateTime={timestamp.toISOString()}
              className="mt-2 block text-xs text-muted-foreground"
            >
              {formatMessageTime(timestamp, settings.timeFormat)}
            </time>
          )}
        </div>
      ) : (
        <div className="min-w-0">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-primary">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-ai" />
            Samiati
          </p>
          {children ?? (
            <>
              <p className="whitespace-pre-wrap leading-7 [overflow-wrap:anywhere]">{msg.text}</p>
              {msg.translatedText && (
                <details className="mt-3 rounded-xl border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    View saved translation
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">
                    {msg.translatedText}
                  </p>
                </details>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 text-muted-foreground"
                  aria-label={copyStatus === 'Answer copied.' ? 'Answer copied' : 'Copy answer'}
                  onClick={copy}
                >
                  {copyStatus === 'Answer copied.' ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
                {feedbackEnabled && (
                  <div className="ml-auto [&_button]:min-h-11 [&_button]:min-w-11">
                    <FeedbackBar
                      contextType="search"
                      messageId={msg.id}
                      conversationId={conversationId}
                      language={language}
                      originalText={msg.text}
                      compact
                    />
                  </div>
                )}
              </div>
              {copyStatus && (
                <p role="status" className="text-xs text-muted-foreground">
                  {copyStatus}
                </p>
              )}
            </>
          )}
          {settings.showTimestamps && validTimestamp && (
            <time
              dateTime={timestamp.toISOString()}
              className="mt-2 block text-xs text-muted-foreground"
            >
              {formatMessageTime(timestamp, settings.timeFormat)}
            </time>
          )}
        </div>
      )}
    </article>
  );
}

function ConnectedChat(props: Props) {
  const searchAction = useAction(api.sunflower.search);
  const transcribeAction = useAction(api.asr.transcribeAudio);
  const ttsAction = useAction(api.tts.synthesizeSpeech);
  return (
    <ChatSurface
      {...props}
      searchAction={searchAction}
      transcribeAction={transcribeAction}
      ttsAction={ttsAction}
    />
  );
}

// Local UI remains usable when the optional backend has not been configured.
export default function HomeSearchScreen(props: Props) {
  return process.env.NEXT_PUBLIC_CONVEX_URL ? (
    <ConnectedChat {...props} />
  ) : (
    <ChatSurface {...props} />
  );
}

function ChatSurface({
  user,
  navigate,
  notificationCounts,
  activeConversation,
  onNewChat,
  onSaveChat,
  conversations = [],
  initialQuery,
  searchAction,
  transcribeAction,
  ttsAction,
}: Props & ChatActions) {
  const { settings, updateSetting } = useSettings();
  const initialLanguageCode =
    getSavedLanguageCode(activeConversation) ?? settings.preferredLanguage;
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    () => LANGUAGES.find((language) => language.code === initialLanguageCode) ?? LANGUAGES[0]
  );
  const [query, setQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [images, setImages] = useState<SearchImage[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [latestMessageId, setLatestMessageId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(activeConversation?.messages ?? []);
  const messagesRef = useRef(messages);
  const requestIdRef = useRef(0);
  const ownSaveRef = useRef(false);
  const previousConversationId = useRef(activeConversation?.id);
  const initialQueryRef = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLElement>(null);
  const nearBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [attachments, setAttachments] = useState<SearchAttachment[]>([]);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const languageInfo = getProductLanguage(selectedLanguage.code);
  const voiceDisabledReason =
    languageInfo?.voice === 'unavailable'
      ? 'Voice is not available for this language.'
      : 'Voice is not available yet. Write your question below.';
  const latestAnswer = messages.find((message) => message.id === latestMessageId)?.text ?? '';

  useEffect(() => {
    const next = activeConversation?.messages ?? [];
    messagesRef.current = next;
    setMessages(next);
    if (!activeConversation) {
      setSelectedLanguage(
        LANGUAGES.find((language) => language.code === settings.preferredLanguage) ?? LANGUAGES[0]
      );
    }
    if (previousConversationId.current !== activeConversation?.id && !ownSaveRef.current) {
      requestIdRef.current += 1;
      setQuery('');
      setLastQuery('');
      setError(null);
      setStatus('');
      setIsSearching(false);
      setSources([]);
      setImages([]);
      setFollowUps([]);
      setLatestMessageId(null);
      setAttachments([]);
      const savedCode = getSavedLanguageCode(activeConversation) ?? settings.preferredLanguage;
      setSelectedLanguage(
        LANGUAGES.find((language) => language.code === savedCode) ?? LANGUAGES[0]
      );
      audioRef.current?.pause();
      setIsPlaying(false);
    }
    previousConversationId.current = activeConversation?.id;
    ownSaveRef.current = false;
  }, [activeConversation, settings.preferredLanguage]);

  useEffect(() => {
    if (nearBottomRef.current)
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: settings.reduceMotion ? 'instant' : 'smooth',
      });
  }, [messages, isSearching, error, settings.reduceMotion]);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      audioRef.current?.pause();
    },
    []
  );

  const handleSearch = useCallback(
    async (rawQuery: string) => {
      const searchQuery = rawQuery.trim();
      if (!searchQuery || searchQuery.length > 5000 || isSearching) return;
      if (!user || user.isGuest) {
        navigate(Screen.SIGN_IN);
        return;
      }
      if (!searchAction) {
        setStatus(
          'Sending messages is not available in this preview. You can still explore the interface.'
        );
        return;
      }
      const requestId = ++requestIdRef.current;
      setQuery('');
      setLastQuery(searchQuery);
      setIsSearching(true);
      setError(null);
      setStatus('');
      setLatestMessageId(null);
      setSources([]);
      setImages([]);
      setFollowUps([]);
      nearBottomRef.current = true;
      const timeout = setTimeout(() => {
        if (requestId !== requestIdRef.current) return;
        requestIdRef.current += 1;
        setIsSearching(false);
        setError('The response is taking longer than expected. Please try again.');
      }, 60_000);
      try {
        const documentText = attachments
          .filter((attachment) => attachment.kind === 'doc' && attachment.text)
          .map((attachment) => attachment.text)
          .join('\n\n')
          .slice(0, 8000);
        // These searches are related reading, not sources used to generate the answer.
        const [links, relatedImages, result] = await Promise.all([
          fetchWikipediaLinks(searchQuery, selectedLanguage.code === 'sw' ? 'sw' : 'en').catch(
            () => []
          ),
          settings.dataSaver
            ? Promise.resolve([])
            : fetchCommonsImages(searchQuery).catch(() => []),
          searchAction({
            query: searchQuery,
            language:
              selectedLanguage.code === 'sw'
                ? 'Swahili'
                : selectedLanguage.code === 'luo'
                  ? 'Luo'
                  : selectedLanguage.name,
            links: [],
            document: documentText,
          }),
        ]);
        if (requestId !== requestIdRef.current) return;
        if (!result.answer?.trim() || isServiceError(result.answer))
          throw new Error('No response available');
        setSources(links);
        setImages(relatedImages);
        setFollowUps(result.followUps ?? []);
        const timestamp = Date.now();
        const userMessage: Message = {
          id: `u_${timestamp}`,
          sender: 'user',
          text: searchQuery,
          targetLanguage: selectedLanguage.code,
          timestamp: new Date(timestamp),
        };
        const assistantMessage: Message = {
          id: `a_${timestamp}`,
          sender: 'ai',
          text: result.answer,
          targetLanguage: selectedLanguage.code,
          timestamp: new Date(timestamp),
        };
        const next = [...messagesRef.current, userMessage, assistantMessage];
        messagesRef.current = next;
        setMessages(next);
        setLatestMessageId(assistantMessage.id);
        setAttachments([]);
        ownSaveRef.current = true;
        try {
          onSaveChat?.(activeConversation?.id ?? null, next, selectedLanguage);
        } catch {
          ownSaveRef.current = false;
          setStatus(
            'Your answer is here, but this browser could not save the conversation. Copy anything you want to keep.'
          );
        }
      } catch {
        if (requestId === requestIdRef.current)
          setError('Samiati could not answer this time. Check your connection and try again.');
      } finally {
        clearTimeout(timeout);
        if (requestId === requestIdRef.current) setIsSearching(false);
      }
    },
    [
      isSearching,
      user,
      navigate,
      searchAction,
      attachments,
      selectedLanguage,
      settings.dataSaver,
      onSaveChat,
      activeConversation?.id,
    ]
  );

  useEffect(() => {
    if (!initialQuery || initialQueryRef.current === initialQuery || !user) return;
    initialQueryRef.current = initialQuery;
    void handleSearch(initialQuery);
  }, [initialQuery, user, handleSearch]);

  const handleNewChat = () => {
    requestIdRef.current += 1;
    ownSaveRef.current = false;
    setQuery('');
    setLastQuery('');
    setError(null);
    setStatus('');
    setIsSearching(false);
    setSources([]);
    setImages([]);
    setFollowUps([]);
    setLatestMessageId(null);
    setAttachments([]);
    messagesRef.current = [];
    setMessages([]);
    audioRef.current?.pause();
    setIsPlaying(false);
    setSelectedLanguage(
      LANGUAGES.find((language) => language.code === settings.preferredLanguage) ?? LANGUAGES[0]
    );
    onNewChat?.();
  };

  const handleLanguageSelect = (language: Language) => {
    if (isSearching) return;
    setSelectedLanguage(language);
    updateSetting('preferredLanguage', language.code);
  };

  const handleDocumentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!/\.(txt|md|csv|json|log)$/i.test(file.name)) {
      setStatus('Choose a plain text, Markdown, CSV, JSON or log document.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatus('Choose a text document smaller than 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setStatus('This document could not be read. Please try another file.');
    reader.onload = () => {
      setAttachments((previous) => [
        ...previous,
        {
          id: `doc_${Date.now()}`,
          name: file.name,
          kind: 'doc',
          text: String(reader.result ?? '').slice(0, 20000),
        },
      ]);
      setStatus('Document attached. Up to 8,000 characters will be used as context.');
    };
    reader.readAsText(file);
  };

  // Existing speech actions stay wired, but controls remain unavailable until
  // catalogue availability and browser recording support have been verified.
  const handleVoiceInput = async () => {
    if (voiceDisabledReason) {
      setStatus(voiceDisabledReason);
      return;
    }
    if (!transcribeAction) return;
    if (isRecording) {
      recorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined' ||
      !MediaRecorder.isTypeSupported('audio/webm')
    ) {
      setStatus('Voice recording is not supported by this browser. Please type your message.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsTranscribing(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const audioBase64 = String(reader.result ?? '').split(',')[1];
            const result = await transcribeAction({ audioBase64 });
            if (result.error)
              setStatus('The recording could not be transcribed. Please try typing.');
            else setQuery((previous) => `${previous} ${result.text}`.trim());
          } catch {
            setStatus('The recording could not be transcribed. Please try typing.');
          } finally {
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(new Blob(chunks, { type: 'audio/webm' }));
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      setStatus('Microphone access was not available. Please type your message.');
    }
  };

  const handlePlayAudio = async () => {
    if (voiceDisabledReason || !ttsAction) {
      setStatus(voiceDisabledReason);
      return;
    }
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    try {
      const result = await ttsAction({ text: latestAnswer, language: selectedLanguage.code });
      if (!result.audioBase64) {
        setStatus('Audio is unavailable for this response.');
        return;
      }
      const audio = new Audio(`data:${result.contentType};base64,${result.audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      await audio.play();
      setIsPlaying(true);
    } catch {
      setStatus('Audio could not be played. The written response is still available.');
    }
  };

  const composerProps = {
    value: query,
    onValueChange: setQuery,
    onSubmit: handleSearch,
    onVoiceInput: handleVoiceInput,
    isSearching,
    isRecording,
    isTranscribing,
    selectedLanguage,
    onLanguageSelect: handleLanguageSelect,
    attachments,
    onAttachDocument: () => docInputRef.current?.click(),
    onRemoveAttachment: (id: string) =>
      setAttachments((previous) => previous.filter((attachment) => attachment.id !== id)),
    voiceDisabledReason,
  };
  const welcomeMode = messages.length === 0 && !isSearching && !error;
  const mobileDestinations = [
    { label: 'Chat', href: '/dashboard', icon: MessageCircle },
    { label: 'Discover', href: '/dashboard/discover', icon: Compass },
    { label: 'Languages', href: '/languages', icon: Languages },
    { label: 'Changa', href: '/dashboard/changa', icon: HeartHandshake },
  ];

  return (
    <div className="relative flex h-[100dvh] min-h-0 overflow-hidden bg-background">
      <input
        ref={docInputRef}
        type="file"
        accept=".txt,.md,.csv,.json,.log,text/plain,text/markdown,text/csv,application/json"
        className="hidden"
        aria-label="Attach a text document"
        onChange={handleDocumentSelect}
      />
      <AppSidebar
        open={isNavOpen}
        onOpenChange={setIsNavOpen}
        user={user}
        onNavigate={navigate}
        onNewSearch={handleNewChat}
        notificationCounts={notificationCounts}
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        onChatSelect={(id) => navigate(Screen.HOME_CHAT, { chatId: id })}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-20 flex min-h-16 shrink-0 items-center justify-between gap-1 border-b border-border px-2 sm:px-5">
          <div className="flex min-w-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-11 lg:hidden"
              onClick={() => setIsNavOpen(true)}
              aria-label="Open conversation history"
              aria-expanded={isNavOpen}
            >
              <Menu className="size-5" />
            </Button>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onSelect={handleLanguageSelect}
              disabled={isSearching}
            />
            <span className="hidden border-l border-border pl-4 text-xs text-muted-foreground sm:block">
              A little closer to home.
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                onClick={handleNewChat}
                aria-label="Start a new chat"
              >
                <SquarePen className="size-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                className="h-11 px-3 text-xs"
                onClick={() => navigate(Screen.SIGN_IN)}
              >
                Sign in
              </Button>
            )}
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          ref={scrollRef}
          onScroll={() => {
            const element = scrollRef.current;
            if (!element) return;
            const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
            nearBottomRef.current = distance < 160;
            setShowScrollBtn(distance > 240);
          }}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          {welcomeMode ? (
            <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-4 py-10 sm:px-8 sm:py-16">
              <div className="mb-8">
                <p className="mb-5 flex items-center gap-2 text-xs font-semibold tracking-wide text-primary">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-ai" />
                  YOUR WORDS. YOUR WORLD.
                </p>
                <h1 className="font-editorial text-[clamp(2.75rem,6vw,4.75rem)] leading-[1.04] tracking-tight">
                  What would you
                  <br className="hidden sm:block" /> like to{' '}
                  <em className="font-normal text-primary">explore?</em>
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-6 text-muted-foreground">
                  An idea, a question, a fresh perspective. Start with the language you call home.
                </p>
              </div>
              <SearchHero {...composerProps} />
              <div
                role="status"
                aria-live="polite"
                className="mt-3 text-center text-xs leading-relaxed text-muted-foreground"
              >
                {status ||
                  (!searchAction
                    ? 'Preview mode · Sending messages is not available yet.'
                    : !user
                      ? 'Explore freely. Sign in when you are ready to send a message.'
                      : 'Answers are AI-generated. Check important information.')}
              </div>
              <SuggestionSentences
                selectedLanguage={selectedLanguage}
                onSelect={(prompt) => setQuery(prompt)}
              />
            </div>
          ) : (
            <div
              className="mx-auto w-full max-w-[var(--app-content-width)] space-y-5 px-4 py-8 sm:px-6"
              aria-busy={isSearching}
            >
              <p className="mb-5 text-xs text-muted-foreground">
                AI answers can be mistaken. Each question is answered independently.
              </p>
              {messages.map((message) => (
                <ThreadMessage
                  key={message.id}
                  msg={message}
                  conversationId={activeConversation?.id}
                  language={message.targetLanguage ?? selectedLanguage.code}
                  feedbackEnabled={Boolean(searchAction)}
                >
                  {message.id === latestMessageId ? (
                    <SearchResults
                      answer={message.text}
                      sources={sources}
                      followUps={followUps}
                      images={images}
                      onFollowUpSelect={setQuery}
                      isPlaying={isPlaying}
                      onPlayAudio={handlePlayAudio}
                      audioDisabledReason={voiceDisabledReason}
                      contextType="search"
                      messageId={message.id}
                      conversationId={activeConversation?.id}
                      language={message.targetLanguage ?? selectedLanguage.code}
                    />
                  ) : undefined}
                </ThreadMessage>
              ))}
              {(isSearching || error) && (
                <ThreadMessage
                  msg={{ id: 'pending', sender: 'user', text: lastQuery, timestamp: new Date() }}
                />
              )}
              {isSearching && <SearchPhaseIndicator isSearching />}
              {error && (
                <SearchResults
                  answer=""
                  error={error}
                  sources={[]}
                  followUps={[]}
                  onFollowUpSelect={setQuery}
                  onRetry={() => handleSearch(lastQuery)}
                />
              )}
            </div>
          )}
        </main>
        {!welcomeMode && (
          <div className="relative shrink-0 border-t border-border bg-background px-3 pt-3 pb-2 sm:px-6">
            {showScrollBtn && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  scrollRef.current?.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: settings.reduceMotion ? 'instant' : 'smooth',
                  });
                  nearBottomRef.current = true;
                }}
                className="absolute -top-14 right-5 size-11 rounded-full bg-card shadow-sm"
                aria-label="Scroll to latest message"
              >
                <ArrowDown className="size-4" />
              </Button>
            )}
            <div className="mx-auto max-w-[var(--app-content-width)]">
              <SearchHero {...composerProps} compact />
              <p
                role="status"
                aria-live="polite"
                className="mt-1 text-center text-xs leading-relaxed text-muted-foreground"
              >
                {status}
              </p>
            </div>
          </div>
        )}
        <nav
          aria-label="Mobile navigation"
          className="grid shrink-0 grid-cols-4 border-t border-border bg-background px-2 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          {mobileDestinations.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              aria-current={label === 'Chat' ? 'page' : undefined}
              className={cn(
                'flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[0.6875rem] font-semibold',
                label === 'Chat'
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
