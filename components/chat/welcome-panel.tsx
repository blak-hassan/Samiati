"use client";

import { ArrowRight, Compass, Handshake } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { LanguageSelector } from "@/components/language/language-selector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/data/provider";
import { useLanguagePreferences } from "@/lib/language-preferences/provider";
import { getLanguageOrDefault } from "@/lib/languages";
import { starterPrompts } from "@/lib/languages/starters";

/**
 * The welcome screen.
 *
 * It is the first thing a new user sees, so it does three things: greets the
 * user in their language, makes the language easy to change, and gets them to
 * a working conversation in one tap.
 */
export function WelcomePanel() {
  const store = useStore();
  const router = useRouter();
  const { languageId, setLanguage, favorites, recent, toggleFavorite } =
    useLanguagePreferences();

  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const language = getLanguageOrDefault(languageId);
  const prompts = starterPrompts(language.id);

  const start = React.useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      setBusy(true);
      try {
        const conversation = await store.createConversation({
          languageId,
          title: content.slice(0, 60),
        });
        router.push(
          `/chat/${conversation.id}?first=${encodeURIComponent(content)}`,
        );
      } catch {
        toast.error("Could not start a conversation. Please try again.");
        setBusy(false);
      }
    },
    [busy, languageId, router, store],
  );

  return (
    <div className="samiati-grain flex h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="animate-fade-up">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            {language.greeting}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            What would you like to talk about in{" "}
            <span className="text-primary">{language.name}</span>?
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-muted-foreground">
            Samiati answers in the language you choose. Ask a question, ask for
            help with a letter, or explore what is happening around you.
          </p>
        </div>

        <div className="mt-8 animate-fade-up">
          <div className="samiati-surface rounded-2xl p-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void start(input);
                }
              }}
              rows={2}
              disabled={busy}
              placeholder={`Ask anything in ${language.name}…`}
              aria-label={`Start a conversation in ${language.name}`}
              className="min-h-[3.5rem] resize-none border-0 bg-transparent px-3 py-2 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center justify-between gap-3 px-1 pb-1">
              <LanguageSelector
                value={languageId}
                onChange={setLanguage}
                variant="compact"
                favorites={favorites}
                recent={recent}
                onToggleFavorite={toggleFavorite}
              />
              <Button
                onClick={() => void start(input)}
                disabled={busy || !input.trim()}
                className="gap-2"
              >
                {busy ? "Starting…" : "Start"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Try one of these
            </p>
            <ul className="flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    onClick={() => void start(prompt)}
                    disabled={busy}
                    className="rounded-full border bg-background/70 px-3.5 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <Link
            href="/discover"
            className="rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-2 font-medium">
              <Compass className="h-4 w-4 text-primary" aria-hidden />
              Discover
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              African news, culture and knowledge — ready to discuss.
            </p>
          </Link>
          <Link
            href="/changa"
            className="rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-2 font-medium">
              <Handshake className="h-4 w-4 text-primary" aria-hidden />
              Changa
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Contribute translations that make Samiati better at your language.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
