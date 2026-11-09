'use client';

import React, { useId, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Languages, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PRODUCT_LANGUAGES } from '@/lib/productLanguages';
import { cn } from '@/lib/utils';

export interface Language {
  code: string;
  nllbCode: string;
  name: string;
}

// Configured routes are not guarantees of service availability or quality.
export const LANGUAGES: Language[] = PRODUCT_LANGUAGES.filter(
  (language) => language.text === 'configured'
).map(({ code, nllbCode, name }) => ({ code, nllbCode: nllbCode ?? code, name }));

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onSelect: (language: Language) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  selectedLanguage,
  onSelect,
  open,
  onOpenChange,
  disabled,
}: LanguageSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchId = useId();
  const updateOpen = onOpenChange ?? setInternalOpen;
  const filtered = LANGUAGES.filter((language) =>
    `${language.name} ${language.code}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <Popover open={open ?? internalOpen} onOpenChange={updateOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled}
          className="h-11 max-w-full gap-2 rounded-xl px-3 text-sm"
          aria-label={`Conversation language: ${selectedLanguage.name}. Choose a language`}
        >
          <Languages className="size-4 text-primary" aria-hidden="true" />
          <span className="truncate">{selectedLanguage.name}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border-border bg-popover p-0 shadow-xl"
      >
        <div className="border-b border-border p-4">
          <p className="mb-1 font-semibold">Make yourself understood.</p>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            Text chat is experimental. Availability and answer quality can vary. Voice is not
            available yet.
          </p>
          <label htmlFor={searchId} className="sr-only">
            Search conversation languages
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-3.5 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id={searchId}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find your language"
              className="h-11 pl-9"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="max-h-[min(19rem,45dvh)] overflow-y-auto p-2" aria-label="Text languages">
          {filtered.map((language) => (
            <button
              key={language.code}
              type="button"
              aria-pressed={selectedLanguage.code === language.code}
              onClick={() => {
                onSelect(language);
                updateOpen(false);
                setSearch('');
              }}
              className={cn(
                'flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-secondary',
                selectedLanguage.code === language.code && 'bg-secondary'
              )}
            >
              <span>
                <span className="block text-sm font-semibold">{language.name}</span>
                <span className="text-xs text-muted-foreground">Text chat · experimental</span>
              </span>
              {selectedLanguage.code === language.code && (
                <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
              )}
            </button>
          ))}
          {!filtered.length && (
            <p role="status" className="px-3 py-6 text-sm text-muted-foreground">
              No matching text language. Explore planned languages below.
            </p>
          )}
        </div>
        <Link
          href="/languages"
          className="flex min-h-11 items-center border-t border-border px-4 text-sm font-medium text-primary hover:underline"
        >
          Explore all languages and availability →
        </Link>
      </PopoverContent>
    </Popover>
  );
}
