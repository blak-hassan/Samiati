"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANGUAGES, Language } from "@/components/chat/LanguageSelector";

const FAVORITE_LANGUAGE_CODES = ["sw", "ki", "en"];

interface LanguageChipsProps {
  selectedLanguage: Language;
  onSelect: (lang: Language) => void;
}

const LanguageChips: React.FC<LanguageChipsProps> = ({
  selectedLanguage,
  onSelect,
}) => {
  const favoriteLanguages = LANGUAGES.filter((l) =>
    FAVORITE_LANGUAGE_CODES.includes(l.code)
  );

  return (
    <div className="w-full max-w-2xl flex justify-center">
      <div className="flex items-center gap-2">
        {favoriteLanguages.map((lang) => (
          <Button
            key={lang.code}
            variant="ghost"
            size="sm"
            onClick={() => onSelect(lang)}
            className={cn(
              "h-8 px-3 rounded-full text-xs font-bold transition-all duration-200 border",
              selectedLanguage.code === lang.code
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-card/40 text-muted-foreground border-border/40 hover:bg-card hover:text-foreground hover:border-border"
            )}
          >
            {lang.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default LanguageChips;
