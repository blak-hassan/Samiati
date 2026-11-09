'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CornerDownLeft, Search, Settings2, X } from 'lucide-react';
import {
  searchSettingsCatalog,
  SETTINGS_CATALOG,
  SETTINGS_SECTIONS,
  SettingsCatalogEntry,
} from '@/lib/settings';
import { cn } from '@/lib/utils';

export interface SettingsSearchProps {
  className?: string;
  /** Called after a result is chosen — defaults to client-side navigation. */
  onNavigate?: (entry: SettingsCatalogEntry) => void;
}

/**
 * Search across every individual setting.
 *
 * T3Chat keeps a catalogue of all of its settings (`settingsSearch.ts`) and
 * searches it from a single field, so "dark mode" or "2FA" jumps straight to
 * the row rather than making the user browse sections. Samiati's settings
 * index previously had no search at all.
 */
const SettingsSearch: React.FC<SettingsSearchProps> = ({ className, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchSettingsCatalog(query).slice(0, 8);
  }, [query]);

  const sectionTitle = (sectionId: string) =>
    SETTINGS_SECTIONS.find((section) => section.id === sectionId)?.title ?? sectionId;

  const handleSelect = (entry: SettingsCatalogEntry) => {
    setQuery('');
    inputRef.current?.blur();
    if (onNavigate) {
      onNavigate(entry);
      return;
    }
    router.push(entry.path);
  };

  const totalCount = SETTINGS_CATALOG.length;

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setQuery('');
            if (event.key === 'Enter' && results.length > 0) handleSelect(results[0]);
          }}
          placeholder="Search settings…"
          aria-label="Search settings"
          className="w-full h-11 pl-10 pr-10 rounded-2xl bg-muted/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-muted/60 transition-colors [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {!query ? (
        <p className="mt-2 px-1 text-xs text-muted-foreground flex items-center gap-1.5">
          <Settings2 className="w-3.5 h-3.5" />
          {totalCount} settings across {SETTINGS_SECTIONS.length} sections
        </p>
      ) : null}

      {query ? (
        <div className="mt-2 rounded-2xl border border-border/50 bg-card overflow-hidden shadow-lg">
          {results.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto divide-y divide-border/30">
              {results.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(entry)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors group flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{entry.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/60 px-2 py-1 rounded-full">
                      {sectionTitle(entry.section)}
                    </span>
                    <CornerDownLeft className="w-3.5 h-3.5 shrink-0 mt-1 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No settings match “{query}”.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default SettingsSearch;
