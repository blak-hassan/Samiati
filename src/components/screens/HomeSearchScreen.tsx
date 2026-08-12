"use client";

import React, { useState, useRef, useCallback } from "react";
import { Screen } from "@/types";
import SamiatiLogo from "@/components/SamiatiLogo";
import { Language, LANGUAGES } from "@/components/chat/LanguageSelector";
import SearchHero from "@/components/search/SearchHero";
import LanguageChips from "@/components/search/LanguageChips";
import SuggestionSentences from "@/components/search/SuggestionSentences";
import SearchPhaseIndicator from "@/components/search/SearchPhaseIndicator";
import SearchResults from "@/components/search/SearchResults";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { searchWithGrounding, SearchResult } from "@/services/geminiService";
import { Source } from "@/components/search/SourceCard";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/shared/AppSidebar";

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
}

const HomeSearchScreen: React.FC<Props> = ({
  user,
  navigate,
  unreadCount = 0,
  notificationCounts,
}) => {
  // Language
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    LANGUAGES.find((l) => l.code === "sw") || LANGUAGES[0]
  );

  // Search state
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [searchComplete, setSearchComplete] = useState(false);

  // Voice state (placeholder)
  const [isRecording, setIsRecording] = useState(false);

  // Navigation drawer
  const [isNavOpen, setIsNavOpen] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery);
      setIsSearching(true);
      setSearchComplete(false);
      setAnswer("");
      setSources([]);
      setFollowUps([]);

      try {
        const result: SearchResult = await searchWithGrounding(
          searchQuery,
          selectedLanguage.name
        );
        setAnswer(result.answer);
        setSources(result.sources);
        setFollowUps(result.followUps);
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
    [selectedLanguage]
  );

  const handleSuggestionSelect = (suggestionQuery: string) => {
    handleSearch(suggestionQuery);
  };

  const handleFollowUpSelect = (followUpQuery: string) => {
    handleSearch(followUpQuery);
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
  };

  const handleNewSearch = () => {
    setSearchComplete(false);
    setQuery("");
    setAnswer("");
    setSources([]);
    setFollowUps([]);
  };

  return (
    <div className="flex min-h-[100dvh] bg-background relative overflow-hidden">
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
        <header className="sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
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

        {/* Content */}
        <main className="flex-1 flex flex-col items-center px-4 pb-12">
          {/* Hero Section (shown when no search has been made) */}
          {!searchComplete && !isSearching && (
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto animate-in fade-in duration-500">
              {/* Logo — matches ChatScreen welcome mode */}
              <div className="flex flex-col items-center mb-8 shrink-0">
                <div className="hover:scale-105 transition-transform duration-300 mb-2">
                  <SamiatiLogo size={80} className="scale-110" />
                </div>
              </div>

              {/* Search Input — language in bar via SearchHero */}
              <SearchHero
                onSubmit={handleSearch}
                onVoiceInput={handleVoiceInput}
                isSearching={isSearching}
                isRecording={isRecording}
                selectedLanguage={selectedLanguage}
                onLanguageSelect={setSelectedLanguage}
              />

              {/* Favorite Language Chips (hero mode only) */}
              <div className="mt-4 mb-8">
                <LanguageChips
                  selectedLanguage={selectedLanguage}
                  onSelect={setSelectedLanguage}
                />
              </div>

              {/* Suggestion Sentences (personalized) */}
              <SuggestionSentences
                selectedLanguage={selectedLanguage}
                user={user}
                onSelect={handleSuggestionSelect}
              />
            </div>
          )}

          {/* Compact search bar (shown during/after search) */}
          {(isSearching || searchComplete) && (
            <div className="w-full max-w-2xl mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Query display */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground truncate">
                  {query}
                </h2>
              </div>

              {/* Compact search input — language in bar via SearchHero */}
              <SearchHero
                onSubmit={handleSearch}
                isSearching={isSearching}
                compact
                selectedLanguage={selectedLanguage}
                onLanguageSelect={setSelectedLanguage}
              />

              {/* Phase Indicator */}
              <SearchPhaseIndicator isSearching={isSearching} />
            </div>
          )}

          {/* Search Results */}
          {searchComplete && answer && (
            <div
              ref={resultsRef}
              className="w-full max-w-2xl animate-in fade-in duration-500 delay-200"
            >
              <SearchResults
                answer={answer}
                sources={sources}
                followUps={followUps}
                onFollowUpSelect={handleFollowUpSelect}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HomeSearchScreen;
