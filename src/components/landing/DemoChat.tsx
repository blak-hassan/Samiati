'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Interactive landing-page demo (`#demo`).
 *
 * A self-contained preview of a Samiati conversation: the visitor picks one of
 * the two live languages (Kikuyu / Kiswahili), asks a question, and gets a
 * sample phrase back with its English gloss. Replies cycle through the REAL
 * sample phrases published on /languages/<slug> (passed in as props from the
 * server component), so nothing here is invented copy.
 *
 * Voice mode uses the Web Speech API when the browser exposes it and degrades
 * to an explanatory message otherwise — no permission is requested until the
 * visitor actually asks for voice input.
 */

export interface DemoPhrase {
  text: string;
  translation: string;
}

export type DemoLanguage = 'kikuyu' | 'kiswahili';

interface DemoMessage {
  id: number;
  role: 'user' | 'samiati';
  text: string;
  gloss?: string;
}

/* Minimal typings for the (webkit-prefixed) Speech Recognition API, which is
   not in the standard TS DOM lib. */
interface SpeechRecognitionEventLike {
  results: { length: number; [index: number]: { 0: { transcript: string } } };
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const LANGUAGE_LABEL: Record<DemoLanguage, string> = {
  kikuyu: 'Kikuyu',
  kiswahili: 'Kiswahili',
};

const SUGGESTIONS: Record<DemoLanguage, string[]> = {
  kikuyu: ['How are you?', 'Thank you', 'Teach me a word'],
  kiswahili: ['Habari yako?', 'Asante', 'Nifundishe neno'],
};

export function DemoChat({
  phrases,
}: {
  phrases: Record<DemoLanguage, DemoPhrase[]>;
}) {
  const [language, setLanguage] = useState<DemoLanguage>('kikuyu');
  const [messages, setMessages] = useState<DemoMessage[]>(() => [
    {
      id: 1,
      role: 'samiati',
      text: phrases.kikuyu[0].text,
      gloss: phrases.kikuyu[0].translation,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<'type' | 'voice'>('type');
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  const nextIdRef = useRef(2);
  const replyIndexRef = useRef(1);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  // Stop timers / recognition on unmount so no state updates fire afterwards.
  useEffect(() => {
    return () => {
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  // Keep the transcript pinned to the newest message.
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || isTyping) return;

    setMessages((prev) => [
      ...prev,
      { id: nextIdRef.current++, role: 'user', text },
    ]);
    setInput('');
    setIsTyping(true);

    const bank = phrases[language];
    const phrase = bank[replyIndexRef.current % bank.length];
    replyIndexRef.current += 1;

    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    replyTimerRef.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: nextIdRef.current++,
          role: 'samiati',
          text: phrase.text,
          gloss: phrase.translation,
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(input);
  };

  const switchLanguage = (next: DemoLanguage) => {
    if (next === language) return;
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    setIsTyping(false);
    replyIndexRef.current = 1;
    setLanguage(next);
    setVoiceNote(null);
    setMessages([
      {
        id: nextIdRef.current++,
        role: 'samiati',
        text: phrases[next][0].text,
        gloss: phrases[next][0].translation,
      },
    ]);
  };

  const startVoiceInput = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setVoiceNote(
        'Voice input is not supported in this browser — try typing instead.',
      );
      return;
    }
    setVoiceNote(null);
    try {
      const recognition = new Ctor();
      recognition.lang = language === 'kikuyu' ? 'ki-KE' : 'sw-KE';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript ?? '';
        if (transcript) send(transcript);
      };
      recognition.onerror = () => {
        setVoiceNote('Voice input stopped — try typing instead.');
      };
      recognition.onend = () => {
        recognitionRef.current = null;
      };
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setVoiceNote('Could not start voice input — try typing instead.');
      recognitionRef.current = null;
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lg shadow-black/10">
      {/* Header — keeps the original Samiati logo mark as the avatar. */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-muted/40 px-4 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- local SVG;
            next/image would require enabling dangerouslyAllowSVG just for the
            brand mark. Decorative: the adjacent "Samiati" text names it. */}
        <img
          src="/samiati-logo.svg"
          alt=""
          aria-hidden="true"
          width={40}
          height={40}
        />

        <div className="min-w-0">
          <p className="text-sm font-bold">Samiati</p>
          <p className="text-xs text-muted-foreground">
            Talking in {LANGUAGE_LABEL[language]}
          </p>
        </div>
        <div
          role="group"
          aria-label="Demo language"
          className="ml-auto flex items-center gap-1"
        >
          {(Object.keys(LANGUAGE_LABEL) as DemoLanguage[]).map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={language === code}
              onClick={() => switchLanguage(code)}
              className={cn(
                'min-h-11 min-w-11 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                language === code
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {LANGUAGE_LABEL[code]}
            </button>
          ))}
        </div>
      </div>

      {/* Transcript */}
      <div
        ref={messagesRef}
        role="log"
        aria-live="polite"
        aria-label="Demo conversation"
        className="custom-scrollbar flex max-h-72 min-h-48 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex max-w-[85%] flex-col gap-1 rounded-2xl px-3.5 py-2.5 text-sm',
              message.role === 'user'
                ? 'self-end rounded-br-md bg-primary text-primary-foreground'
                : 'self-start rounded-bl-md bg-muted text-foreground',
            )}
          >
            <span className="break-words">{message.text}</span>
            {message.gloss && (
              <span className="break-words text-xs text-muted-foreground">
                {message.gloss}
              </span>
            )}
          </div>
        ))}
        {isTyping && (
          <div
            className="flex w-fit items-center gap-1 self-start rounded-2xl rounded-bl-md bg-muted px-3.5 py-3"
            aria-hidden="true"
          >
            <span className="size-1.5 animate-typing-dot rounded-full bg-muted-foreground" />
            <span className="size-1.5 animate-typing-dot rounded-full bg-muted-foreground [animation-delay:150ms]" />
            <span className="size-1.5 animate-typing-dot rounded-full bg-muted-foreground [animation-delay:300ms]" />
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 px-4 pb-1">
        {SUGGESTIONS[language].map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => send(suggestion)}
            disabled={isTyping}
            className="min-h-11 rounded-full border border-border px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Composer */}
      <form onSubmit={onSubmit} className="flex items-center gap-2 px-4 py-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Ask Samiati a question"
          placeholder="Ask anything…"
          maxLength={200}
          className="min-h-11 flex-1"
        />
        <Button
          type="submit"
          aria-label="Send message"
          className="min-h-11 min-w-11 px-4"
        >
          Send
        </Button>
      </form>

      {/* Mode picker */}
      <div className="border-t border-border/60 px-4 py-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          How do you want to talk to Samiati?
        </p>
        <div role="group" aria-label="Talk mode" className="flex gap-2">
          <button
            type="button"
            aria-pressed={mode === 'type'}
            onClick={() => {
              setMode('type');
              setVoiceNote(null);
            }}
            className={cn(
              'min-h-11 flex-1 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              mode === 'type'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            Type
          </button>
          <button
            type="button"
            aria-pressed={mode === 'voice'}
            onClick={() => {
              setMode('voice');
              setVoiceNote(null);
            }}
            className={cn(
              'min-h-11 flex-1 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              mode === 'voice'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            Voice
          </button>
        </div>
        {mode === 'voice' && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={startVoiceInput}
              className="min-h-11"
            >
              Start voice input
            </Button>
            <p role="status" className="text-xs text-muted-foreground">
              {voiceNote ??
                `Speak ${LANGUAGE_LABEL[language]} — your browser will transcribe what you say.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



