"use client";

import { Check, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/data/provider";
import type { Community } from "@/lib/data/types";
import { getLanguageOrDefault } from "@/lib/languages";

/**
 * Communities — language-scoped spaces where speakers help each other.
 *
 * Membership is stored on the community record, so joining and leaving is a
 * real, persisted action rather than a decorative toggle.
 */
export function CommunitiesView() {
  const store = useStore();
  const [communities, setCommunities] = React.useState<Community[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      setCommunities(await store.listCommunities());
    } finally {
      setLoading(false);
    }
  }, [store]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const toggle = React.useCallback(
    async (community: Community) => {
      const isMember = community.memberIds.length > 0;
      const updated = isMember
        ? await store.leaveCommunity(community.id)
        : await store.joinCommunity(community.id);
      setCommunities((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      toast.success(
        isMember
          ? `You left ${community.name}.`
          : `You joined ${community.name}.`,
      );
    },
    [store],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Communities
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Talk with speakers of your language
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            Each community is scoped to one language. Join the ones you speak
            and help set the tone for how Samiati uses them.
          </p>
        </header>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className="h-32 animate-pulse rounded-xl border bg-muted/40"
              />
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {communities.map((community) => {
              const language = getLanguageOrDefault(community.languageId);
              const isMember = community.memberIds.length > 0;
              return (
                <li key={community.id} className="rounded-xl border bg-card p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Users className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-display text-lg font-semibold">
                        <Link
                          href={`/communities/${community.id}`}
                          className="hover:underline"
                        >
                          {community.name}
                        </Link>
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {language.name} · {language.region}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isMember ? "outline" : "default"}
                      className="ml-auto gap-1.5"
                      onClick={() => void toggle(community)}
                    >
                      {isMember ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          Joined
                        </>
                      ) : (
                        "Join"
                      )}
                    </Button>
                  </div>

                  <p className="mt-3 text-sm text-pretty text-muted-foreground">
                    {community.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {community.topics.map((topic) => (
                      <Badge key={topic} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-8 rounded-lg border border-dashed px-4 py-3 text-xs text-muted-foreground">
          Community discussion threads are the next milestone. Membership,
          language scoping and moderation roles are already modelled — see{" "}
          <span className="font-medium text-foreground">
            docs/changa-architecture.md
          </span>
          .
        </p>
      </div>
    </div>
  );
}
