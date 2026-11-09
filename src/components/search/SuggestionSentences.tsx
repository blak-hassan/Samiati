'use client';

import { ArrowUpRight, Lightbulb, PenLine, Sprout } from 'lucide-react';
import type { Language } from '@/components/chat/LanguageSelector';

const suggestions = [
  {
    title: 'Make something clear',
    text: 'Explain a new idea simply',
    query: 'Explain how solar energy works in simple terms.',
    icon: Lightbulb,
  },
  {
    title: 'Find the right words',
    text: 'Give your writing a fresh start',
    query: 'Help me write a warm welcome message for a community event.',
    icon: PenLine,
  },
  {
    title: 'Explore a possibility',
    text: 'Turn a question into a next step',
    query: 'Help me make a practical plan for a small kitchen garden.',
    icon: Sprout,
  },
];

export default function SuggestionSentences({
  selectedLanguage,
  onSelect,
}: {
  selectedLanguage: Language;
  onSelect: (query: string) => void;
}) {
  return (
    <section className="mt-8 w-full" aria-label="Ideas for your first question">
      <div className="mb-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span>A little inspiration</span>
        <span>Example prompts in English</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {suggestions.map(({ title, text, query, icon: Icon }) => (
          <button
            key={title}
            type="button"
            onClick={() => onSelect(query)}
            className="group flex min-h-28 items-start gap-3 rounded-xl border border-border bg-card/40 p-4 text-left transition-colors duration-200 hover:bg-card"
          >
            <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {text}
              </span>
            </span>
            <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Write your own question in {selectedLanguage.name}. Examples in more languages will follow
        community review.
      </p>
    </section>
  );
}
