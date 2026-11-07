"use client";

import { Award, Flame, Globe2, Heart, Sparkles } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSamiatiData } from "@/lib/data/provider";
import type { Community, Contribution } from "@/lib/data/types";
import { useLanguagePreferences } from "@/lib/language-preferences/provider";
import { getLanguageOrDefault } from "@/lib/languages";

const HEATMAP_WEEKS = 16;
const HEATMAP_DAYS = 7;

/**
 * A deterministic activity level for a day cell.
 *
 * With no contribution history there is nothing real to show, so the grid is
 * generated from a stable hash rather than random numbers — the same day
 * always has the same value, and the "sample" nature of the grid is stated in
 * the UI.
 */
function demoActivity(dayIndex: number, weekIndex: number): number {
  const seed = (dayIndex * 31 + weekIndex * 17) % 7;
  return seed > 4 ? seed - 4 : 0;
}

export function ProfileView() {
  const { store, user } = useSamiatiData();
  const { favorites, recent, toggleFavorite } = useLanguagePreferences();

  const [contributions, setContributions] = React.useState<Contribution[]>([]);
  const [communities, setCommunities] = React.useState<Community[]>([]);

  React.useEffect(() => {
    void (async () => {
      try {
        setContributions(await store.listContributions());
        setCommunities(await store.listCommunities());
      } catch {
        // The profile page must still render if these fail.
      }
    })();
  }, [store]);

  const accepted = contributions.filter(
    (contribution) => contribution.status === "accepted",
  ).length;

  const joined = communities.filter(
    (community) => community.memberIds.length > 0,
  );

  const favoriteLanguages = favorites.map((id) => getLanguageOrDefault(id));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-espresso-700 to-bronze-600 font-display text-2xl font-semibold text-sand-50">
            {user?.displayName?.slice(0, 1).toUpperCase() ?? "S"}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {user?.displayName ?? "Samiati member"}
            </h1>
            <p className="text-sm text-muted-foreground">
              @{user?.username ?? "member"} ·{" "}
              {user?.plan === "supporter" ? "Supporter" : "Free plan"}
            </p>
          </div>
        </header>

        <section className="mb-8">
          <h2 className="font-display text-xl font-semibold">
            Preferred languages
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your favourites sit at the top of the language selector.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {favoriteLanguages.map((language) => (
              <li key={language.id}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => toggleFavorite(language.id)}
                >
                  <Heart
                    className="h-3.5 w-3.5 fill-destructive text-destructive"
                    aria-hidden
                  />
                  {language.name}
                  <span className="text-muted-foreground">
                    {language.nativeName}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
          {recent.length > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Recently used:{" "}
              {recent.map((id) => getLanguageOrDefault(id).name).join(", ")}
            </p>
          ) : null}
        </section>

        <section className="mb-8">
          <h2 className="font-display text-xl font-semibold">Contribution</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Submitted", value: contributions.length },
              { label: "Accepted", value: accepted },
              {
                label: "Languages helped",
                value: new Set(contributions.map((c) => c.languageId)).size,
              },
              { label: "Communities", value: joined.length },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border bg-card p-4">
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                <dd className="mt-1 font-display text-2xl font-semibold">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mb-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Flame className="h-5 w-5 text-clay-500" aria-hidden />
            Activity
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border bg-card p-4">
            <div
              className="flex gap-1"
              style={{ minWidth: HEATMAP_WEEKS * 14 }}
            >
              {Array.from({ length: HEATMAP_WEEKS }).map((_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {Array.from({ length: HEATMAP_DAYS }).map((__, dayIndex) => {
                    const level = demoActivity(dayIndex, weekIndex);
                    return (
                      <div
                        key={dayIndex}
                        title={`${level === 0 ? "No" : level} contribution${
                          level === 1 ? "" : "s"
                        }`}
                        className={`h-3 w-3 rounded-[3px] ${
                          level === 0
                            ? "bg-muted"
                            : level === 1
                              ? "bg-bronze-300"
                              : level === 2
                                ? "bg-bronze-400"
                                : "bg-bronze-600"
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Sample activity grid. Real contribution history replaces it once
              Changa is connected to a live backend.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Award className="h-5 w-5 text-bronze-500" aria-hidden />
            Recognition
          </h2>
          {accepted > 0 ? (
            <ul className="mt-4 space-y-2">
              {contributions
                .filter((contribution) => contribution.status === "accepted")
                .map((contribution) => (
                  <li
                    key={contribution.id}
                    className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm"
                  >
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">
                      {getLanguageOrDefault(contribution.languageId).name}{" "}
                      translation accepted
                    </span>
                    <Badge variant="secondary">Accepted</Badge>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              No accepted contributions yet. Your first one is waiting in{" "}
              <span className="font-medium text-foreground">Changa</span>.
            </p>
          )}
        </section>

        <section>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Globe2 className="h-5 w-5 text-primary" aria-hidden />
            Communities
          </h2>
          {joined.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {joined.map((community) => (
                <li key={community.id}>
                  <Badge variant="secondary">{community.name}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              You have not joined a community yet.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
