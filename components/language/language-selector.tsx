"use client";

import { Check, ChevronDown, Heart, Search, Sparkles } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { describeCapability } from "@/lib/languages/capability";
import {
  getLanguageOrDefault,
  orderLanguages,
  searchLanguages,
  type SamiatiLanguage,
} from "@/lib/languages";

export interface LanguageSelectorProps {
  value: string;
  onChange: (languageId: string) => void;
  /** "full" shows the language name, "compact" shows a chip, "icon" shows initials. */
  variant?: "full" | "compact" | "icon";
  /** Languages the user has starred — pinned to the top of the list. */
  favorites?: string[];
  /** Languages used recently — shown in their own group. */
  recent?: string[];
  /** Called when the user stars or unstars a language. */
  onToggleFavorite?: (languageId: string) => void;
  className?: string;
  align?: "start" | "center" | "end";
  placeholder?: string;
}

/**
 * The Samiati language selector.
 *
 * This replaces the model picker that a typical AI chat app shows. It is used
 * in the chat header, in conversation settings, in onboarding, on the profile
 * page and in settings — everywhere a user might want to change the language
 * they are working in.
 */
export function LanguageSelector({
  value,
  onChange,
  variant = "full",
  favorites = [],
  recent = [],
  onToggleFavorite,
  className,
  align = "start",
  placeholder = "Choose a language",
}: LanguageSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = getLanguageOrDefault(value);

  const results = React.useMemo(() => {
    const matched = searchLanguages(query).map((entry) => entry.language);
    return orderLanguages(matched, { favorites, recent });
  }, [query, favorites, recent]);

  const byId = React.useCallback(
    (id: string) => {
      const match = searchLanguages(id).find(
        (entry) => entry.language.id === id,
      );
      return match?.language;
    },
    [],
  );

  const favoriteLanguages = React.useMemo(
    () =>
      favorites
        .map(byId)
        .filter((language): language is SamiatiLanguage => Boolean(language)),
    [favorites, byId],
  );

  const recentLanguages = React.useMemo(
    () =>
      recent
        .map(byId)
        .filter((language): language is SamiatiLanguage => Boolean(language))
        .filter((language) => !favorites.includes(language.id)),
    [recent, favorites, byId],
  );

  const handleSelect = (languageId: string) => {
    onChange(languageId);
    setOpen(false);
    setQuery("");
  };

  const renderOption = (language: SamiatiLanguage) => {
    const translation = describeCapability(language.translation);
    const isSelected = language.id === value;

    return (
      <CommandItem
        key={language.id}
        value={`${language.id} ${language.name} ${language.nativeName}`}
        onSelect={() => handleSelect(language.id)}
        className="items-start gap-3 py-2.5"
      >
        <Check
          className={`mt-0.5 h-4 w-4 shrink-0 ${
            isSelected ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden
        />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{language.name}</span>
            <span className="truncate text-sm text-muted-foreground">
              {language.nativeName}
            </span>
            {onToggleFavorite ? (
              <button
                type="button"
                aria-label={
                  favorites.includes(language.id)
                    ? `Remove ${language.name} from favourites`
                    : `Add ${language.name} to favourites`
                }
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFavorite(language.id);
                }}
                className="ml-auto rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
              >
                <Heart
                  className={`h-3.5 w-3.5 ${
                    favorites.includes(language.id)
                      ? "fill-destructive text-destructive"
                      : ""
                  }`}
                  aria-hidden
                />
              </button>
            ) : null}
          </span>
          <span className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-medium ${translation.badgeClass}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${translation.dotClass}`}
              />
              {translation.label} translation
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {language.region}
            </span>
          </span>
        </span>
      </CommandItem>
    );
  };

  const trigger =
    variant === "icon" ? (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {selected.name.slice(0, 2)}
      </span>
    ) : variant === "compact" ? (
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
        <span className="text-sm font-medium">{selected.name}</span>
      </span>
    ) : (
      <span className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        <span className="font-medium">{selected.name}</span>
        <span className="text-sm text-muted-foreground">
          {selected.nativeName}
        </span>
      </span>
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={variant === "full" ? "default" : "sm"}
          className={className}
          aria-label={`Current language: ${selected.name}. ${placeholder}`}
        >
          {trigger}
          <ChevronDown
            className="ml-1 h-4 w-4 shrink-0 opacity-60"
            aria-hidden
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(24rem,calc(100vw-2rem))] p-0"
        align={align}
        sideOffset={8}
      >
        <Command shouldFilter={false}>
          <div className="flex items-center gap-2 border-b px-3">
            <Search
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search languages…"
              className="h-11 border-0 px-0 focus-visible:ring-0"
            />
          </div>
          <CommandList className="max-h-[24rem] overflow-y-auto">
            <CommandEmpty>
              No language matches “{query}”. Samiati is adding more — tell us
              which one you need in Changa.
            </CommandEmpty>

            {!query && favoriteLanguages.length > 0 ? (
              <>
                <CommandGroup heading="Favourites">
                  {favoriteLanguages.map(renderOption)}
                </CommandGroup>
                {recentLanguages.length > 0 ? <CommandSeparator /> : null}
              </>
            ) : null}

            {!query && recentLanguages.length > 0 ? (
              <CommandGroup heading="Recently used">
                {recentLanguages.map(renderOption)}
              </CommandGroup>
            ) : null}

            {query ? (
              <CommandGroup heading="Results">
                {results.map(renderOption)}
              </CommandGroup>
            ) : (
              <CommandGroup heading="All languages">
                {results
                  .filter(
                    (language) =>
                      !favoriteLanguages.some(
                        (entry) => entry.id === language.id,
                      ) &&
                      !recentLanguages.some(
                        (entry) => entry.id === language.id,
                      ),
                  )
                  .map(renderOption)}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
