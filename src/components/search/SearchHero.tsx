"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ArrowUp as CheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES, Language } from "@/components/chat/LanguageSelector";
import { SearchAttachment } from "@/services/geminiService";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Controlled when the parent provides value/onValueChange; otherwise
  // falls back to internal state (keeps the component self-sufficient).
  const query = value !== undefined ? value : internalQuery;
  const updateQuery = (next: string) => {
    if (onValueChange) onValueChange(next);
    else setInternalQuery(next);
  };

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
    <div className={cn("w-full", "max-w-2xl")}>
      <div
        className={cn(
          "bg-background border border-border/40 rounded-[24px] transition-all duration-300",
          "shadow-xl shadow-primary/5",
          "focus-within:shadow-2xl focus-within:ring-1 focus-within:ring-primary/20",
          compact ? "px-3 py-2" : "px-3 sm:px-4 py-3"
        )}
      >
        {/* Text Input */}
        <div className="w-full">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type or Speak..."
            className={cn(
              "w-full bg-transparent border-none text-foreground placeholder-muted-foreground/70",
              "focus:ring-0 outline-none resize-none font-medium leading-relaxed",
              "min-h-[40px] p-0",
              compact ? "text-base" : "text-base md:text-lg"
            )}
            rows={1}
          />
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
                      filteredLangs.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLangSelect(lang)}
                          className={cn(
                            "w-full px-3 py-2 text-left hover:bg-muted transition-all flex items-center justify-between rounded-lg",
                            selectedLanguage.code === lang.code &&
                              "bg-primary/5 shadow-inner"
                          )}
                        >
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
                          {selectedLanguage.code === lang.code && (
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white">
                              <CheckIcon className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      ))
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
