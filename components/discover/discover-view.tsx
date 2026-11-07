"use client";

import {
  Bookmark,
  BookmarkCheck,
  Clock,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/data/provider";
import type { DiscoverItem, DiscoverTopic } from "@/lib/data/types";
import {
  preferredDiscoverLanguages,
  rankDiscoverItems,
} from "@/lib/discover/rank";
import { useLanguagePreferences } from "@/lib/language-preferences/provider";
import { getLanguageOrDefault } from "@/lib/languages";

const TOPICS: { id: DiscoverTopic; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "news", label: "African news" },
  { id: "technology", label: "Technology" },
  { id: "culture", label: "Culture" },
  { id: "history", label: "History" },
  { id: "education", label: "Education" },
  { id: "community", label: "Community topics" },
];

interface FeedPayload {
  source?: string;
  items?: DiscoverItem[];
}

/**
 * Discover — a reading surface for African news, culture and knowledge.
 *
 * Items come from two places: the seed catalogue, and an optional feed that
 * has been ingested with `scripts/ingest-discover.ts`. Items are ranked for
 * the reader's own languages.
 */
export function DiscoverView() {
  const store = useStore();
  const router = useRouter();
  const { languageId, favorites, recent } = useLanguagePreferences();

  const [items, setItems] = React.useState<DiscoverItem[]>([]);
  const [topic, setTopic] = React.useState<DiscoverTopic | "all">("trending");
  const [language, setLanguage] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(true);
  const [feedSource, setFeedSource] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        // Merge any ingested feed into the catalogue first.
        try {
          const response = await fetch("/discover-feed.json", { cache: "no-store" });
          if (response.ok) {
            const payload = (await response.json()) as FeedPayload;
            if (Array.isArray(payload.items) && payload.items.length > 0) {
              await store.ingestDiscoverItems(payload.items);
              setFeedSource(payload.source ?? null);
            }
          }
        } catch {
          // No ingested feed — the seed catalogue is enough.
        }
        setItems(await store.listDiscoverItems());
      } finally {
        setLoading(false);
      }
    })();
  }, [store]);

  const readerLanguages = React.useMemo(
    () => preferredDiscoverLanguages([languageId, ...recent, ...favorites], favorites),
    [favorites, languageId, recent],
  );

  const ranked = React.useMemo(
    () =>
      rankDiscoverItems(items, {
        languageIds: readerLanguages,
        savedIds: items.filter((item) => item.saved).map((item) => item.id),
        now: Date.now(),
      }),
    [items, readerLanguages],
  );

  const visible = React.useMemo(() => {
    return ranked.filter(({ item }) => {
      if (topic !== "trending" && topic !== "all" && item.topic !== topic) {
        return false;
      }
      if (language !== "all" && !item.languages.includes(language)) return false;
      return true;
    });
  }, [language, ranked, topic]);

  const toggleSaved = React.useCallback(
    async (item: DiscoverItem) => {
      const updated = await store.toggleDiscoverItemSaved(item.id);
      setItems((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      toast.success(updated.saved ? "Saved for later." : "Removed from saved.");
    },
    [store],
  );

  const discuss = React.useCallback(
    async (item: DiscoverItem) => {
      const prompt = `Tell me about "${item.title}" and what it means for people in Kenya.`;
      try {
        const conversation = await store.createConversation({
          title: item.title,
          languageId,
        });
        router.push(
          `/chat/${conversation.id}?first=${encodeURIComponent(prompt)}`,
        );
      } catch {
        toast.error("Could not start the conversation.");
      }
    },
    [languageId, router, store],
  );

  const allLanguages = React.useMemo(() => {
    const ids = new Set<string>();
    for (const item of items) {
      for (const id of item.languages) ids.add(id);
    }
    return [...ids];
  }, [items]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Discover
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            News and knowledge from across Africa
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            Read a summary, then open it in a Samiati conversation in any
            language you choose.
          </p>
          {feedSource ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" aria-hidden />
              Live feed: {feedSource}
            </p>
          ) : null}
        </header>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTopic(entry.id)}
                aria-pressed={topic === entry.id}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  topic === entry.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background/60 hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger
              className="w-[11.5rem]"
              aria-label="Filter by language"
            >
              <SelectValue placeholder="All languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All languages</SelectItem>
              {allLanguages.map((id) => (
                <SelectItem key={id} value={id}>
                  {getLanguageOrDefault(id).name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((key) => (
              <div
                key={key}
                className="h-48 animate-pulse rounded-xl border bg-muted/40"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="font-medium">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another topic or language.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {visible.map(({ item, reasons }) => (
              <li
                key={item.id}
                className="group flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="font-medium text-foreground">{item.source}</span>
                  <span aria-hidden>·</span>
                  <Clock className="h-3 w-3" aria-hidden />
                  <span>{item.readingMinutes} min</span>
                </div>

                <h2 className="font-display text-lg font-semibold leading-snug">
                  {item.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-pretty text-muted-foreground">
                  {item.summary}
                </p>

                {reasons.length > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground/80">
                    {reasons.join(" · ")}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.languages.map((id) => (
                    <span
                      key={id}
                      className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {getLanguageOrDefault(id).name}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => void discuss(item)}
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                    Discuss
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto gap-1.5"
                    onClick={() => void toggleSaved(item)}
                    aria-pressed={item.saved}
                  >
                    {item.saved ? (
                      <BookmarkCheck
                        className="h-3.5 w-3.5 text-primary"
                        aria-hidden
                      />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {item.saved ? "Saved" : "Save"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 rounded-lg border border-dashed px-4 py-3 text-xs text-muted-foreground">
          Discover reads feeds that publishers have chosen to publish — Samiati
          does not scrape the web. Run{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono">
            node scripts/ingest-discover.ts --url &lt;feed-url&gt;
          </code>{" "}
          to add a publication. See{" "}
          <span className="font-medium text-foreground">
            docs/implementation-roadmap.md
          </span>
          .
        </p>
      </div>
    </div>
  );
}
