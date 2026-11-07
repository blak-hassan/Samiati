"use client";

import { Award, ShieldCheck, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TIER_REQUIREMENTS,
  tierLabel,
  type ContributorStanding,
} from "@/lib/changa/recognition";

export interface StandingCardProps {
  standing: ContributorStanding;
}

/**
 * Shows a contributor's standing and recognition tier.
 *
 * The tier is earned from quality, not volume, so the numbers on show are the
 * acceptance rate and the reviewer agreement — not a raw count of
 * contributions.
 */
export function StandingCard({ standing }: StandingCardProps) {
  const nextRequirement = standing.nextTier
    ? TIER_REQUIREMENTS.find(
        (requirement) => requirement.tier === standing.nextTier,
      )
    : undefined;

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Award className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">
            {tierLabel(standing.tier)}
          </h2>
          <p className="text-xs text-muted-foreground">
            {standing.points} impact points
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto gap-1.5">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          {Math.round(standing.reliability * 100)}% acceptance
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Accepted", value: standing.accepted },
          { label: "Rejected", value: standing.rejected },
          { label: "Reviews", value: standing.reviews },
          {
            label: "Mean quality",
            value: standing.meanQuality.toFixed(2),
          },
        ].map((stat) => (
          <div key={stat.label}>
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="mt-0.5 font-display text-lg font-semibold">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {nextRequirement ? (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Progress to {tierLabel(nextRequirement.tier)}
            </span>
            <span className="font-medium">
              {Math.round(standing.progressToNext * 100)}%
            </span>
          </div>
          <Progress value={standing.progressToNext * 100} className="mt-1.5" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {nextRequirement.description}
          </p>
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          You have reached the highest recognition tier.
        </p>
      )}

      {standing.tier === "none" ||
      standing.tier === "first" ||
      standing.tier === "trusted" ? (
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/changa/review">Open the review queue</Link>
        </Button>
      ) : null}
    </section>
  );
}
