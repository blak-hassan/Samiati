"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Mic,
  ArrowUp,
  Loader2,
  Square,
  PlusCircle,
  ImageIcon,
  FileText,
  Camera,
  Globe,
  ChevronDown,
  Search,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES, Language } from "@/components/chat/LanguageSelector";
import { SearchAttachment } from "@/services/sunflowerService";

// =============================================================================
// Per-language rotating suggestion pool (Perplexity-style placeholder)
// =============================================================================
interface Suggestion {
  text: string;
  query: string;
}

const LANGUAGE_SUGGESTIONS: Record<string, Suggestion[]> = {
  sw: [
    { text: "Nifundisha methali za Kiswahili", query: "Nifundisha methali za Kiswahili na maana yake" },
    { text: "Hadithi za watu wa Kenya", query: "Ni hadithi gani maarufu za watu wa Kenya?" },
    { text: "Maneno ya kawaida ya Kikuyu", query: "Nipe maneno ya kawaida ya Kikuyu na tafsiri yake" },
    { text: "Utamaduni wa Wamaasai", query: "Eleza utamaduni na mila za Wamaasai" },
    { text: "Nyimbo za jadi za Kenya", query: "Ni nyimbo gani za jadi za Kenya na maana yake?" },
    { text: "Historia ya Lugha za Kenya", query: "Ni lugha ngapi zinazozungumzwa Kenya na historia yake?" },
    { text: "Mila za harusi za Kikuyu", query: "Eleza mila za harusi za jamii ya Kikuyu" },
    { text: "Maneno ya Luo na tafsiri", query: "Nipe maneno ya Luo na tafsiri yake Kiswahilini" },
  ],
  ki: [
    { text: "Ni mathagu ma Kikuyu?", query: "Nigatuoke mathagu mothe ma Kikuyu na thimuthio wake" },
    { text: "Warete wa guthiomi", query: "Nigatuoke warete wa guthiomi ma Kikuyu" },
    { text: "Muthoni wa guku wa Kikuyu", query: "Nigatuoke muthoni wa guku na thuthuthu wa Kikuyu" },
    { text: "Irio na ngano ya Kikuyu", query: "Nithuire irio na ngano ya Kikuyu" },
    { text: "Mathagu ma guku", query: "Nigatuoke mathagu ma guku na thimuthio wake" },
    { text: "Ruti ya Kikuyu", query: "Nigatuoke ruti ya Kikuyu na mila yake" },
    { text: "Kiama kia Kikuyu", query: "Nithuire kiama kia Kikuyu na thuthuthu wake" },
    { text: "Mihiriga ya Kikuyu", query: "Nigatuoke mihiriga ya Kikuyu na thuthuthu yothe" },
  ],
  luo: [
    { text: "Ngech mag Luo", query: "Natina ngech mag Luo kod tiendgi" },
    { text: "Kend mar Luo", query: "Natina kit kend ma jo-Luo timo kod timbendgi" },
    { text: "Wend Luo", query: "Natina wend Luo kod tiendgi" },
    { text: "Chiemo mar Luo", query: "Natina chiemo ma jo-Luo damo e chiro" },
    { text: "Ker mar Luo", query: "Natina kit locho kod tich maguena jo-Luo" },
    { text: "Nying Luo", query: "Natina nying Luo kod tiendgi" },
  ],
  kam: [
    { text: "Methali za Kikamba", query: "Ndalutie methali za Kikamba na maana syao" },
    { text: "Kimiko kya Kikamba", query: "Ndalutie kimiko na mila sya Kikamba" },
    { text: "Nyimbo sya Kikamba", query: "Ndalutie nyimbo na kathemi sya Kikamba" },
    { text: "Kilyo kya Kikamba", query: "Ndalutie kilyo kya Kikamba" },
    { text: "Ukathi wa Akamba", query: "Ndalutie ukathi na kukite sya Akamba" },
    { text: "Kwatu wa Kikamba", query: "Ndalutie kwatu na nzasa sya Kikamba" },
  ],
  kln: [
    { text: "Mumek ab Kalenjin", query: "Agoi mumek ab Kalenjin kod tiendik" },
    { text: "Chamgei ak kumari", query: "Agoi kumari ak chamgei en Kalenjin" },
    { text: "Tiletis ak ng'wendek", query: "Agoi tiletis ak ng'wendek ab Kalenjin" },
    { text: "Kinok ak kwaishisiek", query: "Agoi kinok ak kwaishisiek ab Kalenjin" },
    { text: "Sodoik ak kipotonik", query: "Agoi sodoik ak kipotonik ab Kalenjin" },
    { text: "Kosiakikab Kalenjin", query: "Agoi kosiakikab Kalenjin" },
  ],
  luy: [
    { text: "Endakho ya Abaluhya", query: "Olonde endakho ne emilimo ya Abaluhya" },
    { text: "Olurimi lw'Abaluhya", query: "Oloni olurimi lw'Abaluhya nende emigabi" },
    { text: "Emisala ya Abaluhya", query: "Olonde emisala ya Abaluhya nende oburengi" },
    { text: "Obukwe bwa Abaluhya", query: "Oloni obukwe bwa Abaluhya" },
    { text: "Emboo sya Abaluhya", query: "Olonde emboo nende enyimbo sya Abaluhya" },
    { text: "Ebiayo bya Abaluhya", query: "Oloni ebiayo ebya Abaluhya" },
  ],
  mer: [
    { text: "Icro cia Kimeru", query: "Ooria icro cia Kimeru na micungeirie" },
    { text: "Mwiko wa Ameru", query: "Ooria mwiko wa Ameru na mainya mangaine" },
    { text: "Nyamario cia Ameru", query: "Ooria nyamario cia Ameru" },
    { text: "Ruoki rwa Kimeru", query: "Ooria ruoki na mila cia Kimeru" },
    { text: "Matata ma Ameru", query: "Ooria matata na maina ma Ameru" },
    { text: "Kwenu kwa Ameru", query: "Ooria kwenu na mario kwa Ameru" },
  ],
  mas: [
    { text: "Enkata o Maa", query: "Elakita enkata na ildet o Maa ilMaasai" },
    { text: "Emurran o Maa", query: "Elakita emurran na orore o Maa ilMaasai" },
    { text: "Enkipaata o Maa", query: "Elakita enkipaata na ilopil o Maa" },
    { text: "Ilchokki o Maa", query: "Elakita ilchokki o Maa na inkoilisho" },
    { text: "Enkang o Maa", query: "Elakita enkang na mparimo o Maa" },
    { text: "Orkonyek a Maa", query: "Elakita orkonyek na ildamatisho o Maa" },
  ],
  en: [
    { text: "Tell me about Kenyan proverbs", query: "What are some famous Kenyan proverbs and their meanings?" },
    { text: "Explain Kikuyu cultural traditions", query: "Tell me about Kikuyu cultural traditions and ceremonies" },
    { text: "What are common Luo greetings?", query: "What are common greetings and phrases in Luo language?" },
    { text: "History of Maa people", query: "Tell me about the history and culture of the Maa people of Kenya" },
    { text: "Traditional Kenyan songs", query: "What are some traditional Kenyan songs and their cultural significance?" },
    { text: "Languages spoken in Kenya", query: "How many languages are spoken in Kenya and what are they?" },
    { text: "Maasai beadwork meanings", query: "What do the different colors in Maasai beadwork mean?" },
    { text: "Swahili sayings about life", query: "What are some Swahili sayings about life and wisdom?" },
  ],
};

function getSuggestionsForLanguage(language: Language | undefined): Suggestion[] {
  const code = language?.code ?? "en";
  const pool = LANGUAGE_SUGGESTIONS[code];
  return (pool ?? LANGUAGE_SUGGESTIONS.en).slice(0, 4);
}

interface RotatingPlaceholderProps {
  suggestions: Suggestion[];
  active: boolean;
}

const RotatingPlaceholder: React.FC<RotatingPlaceholderProps> = ({
  suggestions,
  active,
}) => {
  // A single monotonic counter drives the animation; display state is fully
  // derived from it. This keeps the component effect-free so React 19's
  // setState-in-effect lint rule stays happy.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active || suggestions.length === 0) return;
    const id = setInterval(() => {
      setTick((t) => (t + 1) % 1_000_000);
    }, 55);
    return () => clearInterval(id);
  }, [active, suggestions]);

  if (!active || suggestions.length === 0) {
    return null;
  }

  // Cycle: type one suggestion, hold, delete, advance.
  const firstLen = suggestions[0].text.length;
  const typeTicks = Math.max(8, firstLen);
  const holdTicks = 28; // ~1.5s
  const deleteTicks = Math.max(8, Math.floor(firstLen * 0.6));
  const cycleTicks = typeTicks + holdTicks + deleteTicks;
  const totalCycles = suggestions.length;

  const cycle = Math.floor(tick / cycleTicks) % totalCycles;
  const phaseTick = tick % cycleTicks;
  const text = suggestions[cycle]?.text ?? suggestions[0].text;
  const len = text.length;
  const localType = Math.max(8, len);
  const localHold = 28;
  const localDelete = Math.max(8, Math.floor(len * 0.6));
  const localCycle = localType + localHold + localDelete;
  const localPhase = phaseTick % localCycle;

  let visible: number;
  let phase: "typing" | "hold" | "deleting";
  if (localPhase < localType) {
    phase = "typing";
    visible = Math.min(len, Math.floor((localPhase / localType) * len) + 1);
  } else if (localPhase < localType + localHold) {
    phase = "hold";
    visible = len;
  } else {
    phase = "deleting";
    const progress = localPhase - localType - localHold;
    visible = Math.max(0, len - 1 - Math.floor((progress / localDelete) * len));
  }

  return (
    <span className="pointer-events-none absolute inset-0 flex items-center text-muted-foreground/70 font-medium">
      <span className="truncate">
        {text.slice(0, visible)}
        <span
          aria-hidden
          className={cn(
            "inline-block w-[1.5px] h-[1em] align-middle ml-0.5 bg-primary",
            phase === "hold" ? "opacity-100" : "animate-pulse"
          )}
        />
      </span>
    </span>
  );
};

const getMaturityBadge = (score: number) => {
  if (score >= 90) return { label: "Excellent", color: "text-green-600 bg-green-500/10" };
  if (score >= 75) return { label: "Good", color: "text-blue-600 bg-blue-500/10" };
  if (score >= 50) return { label: "Beta", color: "text-yellow-600 bg-yellow-500/10" };
  return { label: "Basic", color: "text-muted-foreground bg-muted/50" };
};

interface AttachmentItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const AttachmentItem: React.FC<AttachmentItemProps> = ({
  icon,
  label,
  onClick,
}) => (
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

interface SearchHeroProps {
  onSubmit: (query: string) => void;
  onVoiceInput?: () => void;
  isSearching: boolean;
  isRecording?: boolean;
  isTranscribing?: boolean;
  compact?: boolean;
  selectedLanguage?: Language;
  onLanguageSelect?: (lang: Language) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  attachments?: SearchAttachment[];
  onAttachDocument?: () => void;
  onAttachImage?: () => void;
  onRemoveAttachment?: (id: string) => void;
}

const SearchHero: React.FC<SearchHeroProps> = ({
  onSubmit,
  onVoiceInput,
  isSearching,
  isRecording = false,
  isTranscribing = false,
  compact = false,
  selectedLanguage,
  onLanguageSelect,
  value,
  onValueChange,
  attachments = [],
  onAttachDocument,
  onAttachImage,
  onRemoveAttachment,
}) => {
  const [internalQuery, setInternalQuery] = useState("");
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [enableRotator, setEnableRotator] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Per-language suggestion pool that drives the rotating placeholder
  const suggestions = useMemo(
    () => getSuggestionsForLanguage(selectedLanguage),
    [selectedLanguage]
  );

  // Controlled when the parent provides value/onValueChange; otherwise
  // falls back to internal state (keeps the component self-sufficient).
  const query = value !== undefined ? value : internalQuery;
  const updateQuery = (next: string) => {
    if (onValueChange) onValueChange(next);
    else setInternalQuery(next);
  };

  // Pause the rotating placeholder while the user is interacting
  const rotatorActive = enableRotator && !isInputFocused && !query;

  const filteredLangs = LANGUAGES.filter((l) =>
    l.name.toLowerCase().includes(langSearch.toLowerCase())
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        compact ? 80 : 120
      )}px`;
    }
  }, [query, compact]);

  const handleSubmit = () => {
    if (!query.trim() || isSearching) return;
    onSubmit(query.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleLangSelect = (lang: Language) => {
    onLanguageSelect?.(lang);
    setIsLangOpen(false);
    setLangSearch("");
  };

  return (
    <div className={cn("w-full", "max-w-3xl mx-auto")}>
      <div
        className={cn(
          "bg-background border border-border/40 rounded-[20px] transition-all duration-300",
          "shadow-xl shadow-primary/5",
          "focus-within:shadow-2xl focus-within:ring-1 focus-within:ring-primary/20",
          compact ? "px-2.5 py-1.5" : "px-3 sm:px-3.5 py-2"
        )}
      >
        {/* Text Input */}
        <div className="relative w-full">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsInputFocused(true);
              setEnableRotator(false);
            }}
            onBlur={() => {
              setIsInputFocused(false);
              if (!query) setEnableRotator(true);
            }}
            placeholder=""
            aria-label="Search"
            className={cn(
              "relative w-full bg-transparent border-none text-foreground placeholder-transparent",
              "focus:ring-0 outline-none resize-none font-medium leading-snug",
              "min-h-[28px] p-0 z-10",
              compact ? "text-sm" : "text-sm md:text-base"
            )}
            rows={1}
          />
          {/* Rotating Perplexity-style placeholder */}
          {rotatorActive && (
            <RotatingPlaceholder
              key={suggestions.map((s) => s.query).join("|")}
              suggestions={suggestions}
              active={rotatorActive}
            />
          )}
        </div>

        {/* Attached files */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1.5 pb-1">
            {attachments.map((att) => (
              <span
                key={att.id}
                className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-muted/70 border border-border/40 text-[11px] font-bold text-foreground max-w-[180px]"
              >
                {att.kind === "doc" ? (
                  <FileText className="w-3 h-3 text-orange-500 shrink-0" />
                ) : (
                  <ImageIcon className="w-3 h-3 text-blue-500 shrink-0" />
                )}
                <span className="truncate">{att.name}</span>
                {onRemoveAttachment && (
                  <button
                    onClick={() => onRemoveAttachment(att.id)}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors shrink-0"
                    aria-label={`Remove ${att.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between w-full">
          {/* Left: Language */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Language Selector */}
            {selectedLanguage && onLanguageSelect && (
              <Popover open={isLangOpen} onOpenChange={setIsLangOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2.5 rounded-full gap-1.5 font-bold text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {selectedLanguage.name}
                    </span>
                    <span className="sm:hidden">
                      {selectedLanguage.code.toUpperCase()}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="start"
                  className="w-[220px] p-0 mb-3 rounded-2xl shadow-xl border-border bg-background"
                >
                  <div className="p-2.5 border-b border-border bg-muted/30">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search languages..."
                        value={langSearch}
                        onChange={(e) => setLangSearch(e.target.value)}
                        className="pl-9 h-9 rounded-xl text-sm border-none bg-background focus-visible:ring-1 focus-visible:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1 py-1.5">
                    {filteredLangs.length > 0 ? (
                      filteredLangs.map((lang) => {
                        const badge = getMaturityBadge(lang.score);
                        return (
                          <button
                            key={lang.code}
                            onClick={() => handleLangSelect(lang)}
                            className={cn(
                              "w-full px-3 py-2 text-left hover:bg-muted transition-all flex items-center justify-between rounded-lg",
                              selectedLanguage.code === lang.code &&
                                "bg-primary/5 shadow-inner"
                            )}
                          >
                            <div className="flex flex-col">
                              <span
                                className={cn(
                                  "text-sm font-bold",
                                  selectedLanguage.code === lang.code
                                    ? "text-primary"
                                    : "text-foreground"
                                )}
                              >
                                {lang.name}
                              </span>
                              <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full w-fit mt-0.5", badge.color)}>
                                {badge.label}
                              </span>
                            </div>
                            {selectedLanguage.code === lang.code && (
                              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-muted-foreground text-xs italic font-medium">
                        No matching languages found
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Right: Attachments + Mic + Submit */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Attachments Menu */}
            <Popover open={isAttachmentOpen} onOpenChange={setIsAttachmentOpen}>
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
              <PopoverContent
                side="top"
                align="end"
                className="w-[180px] p-1.5 mb-3 rounded-2xl shadow-xl border-border bg-background"
              >
                <AttachmentItem
                  icon={<ImageIcon className="w-4 h-4 text-blue-500" />}
                  label="Photo / Video"
                  onClick={() => {
                    setIsAttachmentOpen(false);
                    onAttachImage?.();
                  }}
                />
                <AttachmentItem
                  icon={<FileText className="w-4 h-4 text-orange-500" />}
                  label="Document"
                  onClick={() => {
                    setIsAttachmentOpen(false);
                    onAttachDocument?.();
                  }}
                />
                <AttachmentItem
                  icon={<Camera className="w-4 h-4 text-green-500" />}
                  label="Live Camera"
                  onClick={() => {
                    setIsAttachmentOpen(false);
                    onAttachImage?.();
                  }}
                />
              </PopoverContent>
            </Popover>

            {/* Microphone Button */}
            {onVoiceInput && (
              <Button
                size="icon"
                onClick={onVoiceInput}
                disabled={isTranscribing}
                className={cn(
                  "w-9 h-9 rounded-full transition-all duration-300 shadow-sm transition-transform active:scale-95",
                  isTranscribing
                    ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                    : isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                aria-label="Voice search"
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-4 h-4 fill-current" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            )}

            {/* Submit */}
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!query.trim() || isSearching}
              className={cn(
                "w-9 h-9 rounded-full transition-all duration-300 shadow-sm transition-transform active:scale-95",
                query.trim() && !isSearching
                  ? "bg-primary text-primary-foreground opacity-100 hover:scale-105"
                  : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
              )}
              aria-label="Search"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              )}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SearchHero;
