"use client";

import {
  CheckCircle2,
  Download,
  FileJson,
  Lock,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/lib/data/provider";
import type { DatasetVersion } from "@/lib/data/types";
import {
  buildRows,
  checkReadiness,
  checksumRows,
  cleanRows,
  computeMetrics,
  scoreRows,
  toCsv,
  toJsonl,
} from "@/lib/dataset/pipeline";
import { cn } from "@/lib/utils";

const STATUS_ORDER: DatasetVersion["review"]["status"][] = [
  "draft",
  "reviewed",
  "training_ready",
  "released",
];

/**
 * The dataset workspace.
 *
 * It builds a version from the accepted contributions, shows what is in it
 * and whether it may be used for training, and lets a steward move it through
 * the review states. The gates are the same ones the backend enforces.
 */
export function DatasetView() {
  const store = useStore();

  const [versions, setVersions] = React.useState<DatasetVersion[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [building, setBuilding] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const list = await store.listDatasetVersions();
      setVersions(list);
      setActiveId((current) => current ?? list[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }, [store]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const active = versions.find((version) => version.id === activeId) ?? null;

  const readiness = React.useMemo(
    () => (active ? checkReadiness(active) : { ready: false, checks: [] }),
    [active],
  );

  const buildVersion = React.useCallback(async () => {
    setBuilding(true);
    try {
      const [contributions, tasks, reviews] = await Promise.all([
        store.listContributions(),
        store.listContributionTasks(),
        store.listReviews(),
      ]);

      const raw = buildRows(contributions, tasks, reviews);
      const { rows: cleaned } = cleanRows(raw);
      const scored = scoreRows(cleaned, contributions);

      if (scored.length === 0) {
        toast.info(
          "No accepted contributions yet. A dataset can only contain reviewed translations.",
        );
        return;
      }

      const languageIds = [...new Set(scored.map((row) => row.languageId))];
      const version = await store.createDatasetVersion({
        version: `${languageIds[0] ?? "samiati"}-${new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "")}.1`,
        languageIds,
        contributionIds: scored.map((row) => row.id),
        reviewIds: reviews
          .filter((review) =>
            scored.some((row) => row.id === review.contributionId),
          )
          .map((review) => review.id),
        metrics: computeMetrics(scored),
        format: "jsonl",
        checksum: checksumRows(scored),
      });

      setVersions((current) => [version, ...current]);
      setActiveId(version.id);
      toast.success(
        `Built ${version.metrics.itemCount} rows from reviewed contributions.`,
      );
    } catch {
      toast.error("Could not build the dataset version.");
    } finally {
      setBuilding(false);
    }
  }, [store]);

  const advance = React.useCallback(
    async (version: DatasetVersion) => {
      const index = STATUS_ORDER.indexOf(version.review.status);
      const next = STATUS_ORDER[index + 1];
      if (!next) return;

      if (next === "training_ready" && !checkReadiness(version).ready) {
        toast.error(
          "This version is not ready for training yet. The checks below say why.",
        );
        return;
      }

      try {
        const updated = await store.updateDatasetVersion(version.id, {
          review: { ...version.review, status: next },
        });
        setVersions((current) =>
          current.map((entry) => (entry.id === updated.id ? updated : entry)),
        );
        toast.success(`Version moved to "${next}".`);
      } catch {
        toast.error("Could not move the version.");
      }
    },
    [store],
  );

  const download = React.useCallback(
    async (version: DatasetVersion, format: "jsonl" | "csv") => {
      const [contributions, tasks, reviews] = await Promise.all([
        store.listContributions(),
        store.listContributionTasks(),
        store.listReviews(),
      ]);
      const { rows } = cleanRows(buildRows(contributions, tasks, reviews));
      const content = format === "jsonl" ? toJsonl(rows) : toCsv(rows);

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${version.version}.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${version.version}.${format}`);
    },
    [store],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading dataset…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Dataset
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            From contributions to training data
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            A dataset version is a frozen, provenance-tracked release of reviewed
            translations. Only accepted contributions enter one, and a version
            cannot be used for training until every readiness check passes.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button onClick={() => void buildVersion()} disabled={building}>
            {building ? "Building…" : "Build a version from accepted work"}
          </Button>
        </div>

        {versions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="font-medium">No dataset versions yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Build one once contributions have been accepted in Changa.
            </p>
          </div>
        ) : (
          <>
            <ul className="mb-6 flex flex-wrap gap-2">
              {versions.map((version) => (
                <li key={version.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(version.id)}
                    aria-pressed={version.id === activeId}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      version.id === activeId
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background/60 hover:bg-accent",
                    )}
                  >
                    {version.version}
                  </button>
                </li>
              ))}
            </ul>

            {active ? (
              <section className="space-y-5">
                <div className="rounded-xl border bg-card p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold">
                      {active.version}
                    </h2>
                    <Badge variant="secondary" className="gap-1.5">
                      {active.review.status === "training_ready" ? (
                        <ShieldCheck className="h-3 w-3" aria-hidden />
                      ) : null}
                      {active.review.status.replace("_", " ")}
                    </Badge>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {active.export.checksum}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Rows", value: active.metrics.itemCount },
                      {
                        label: "Mean quality",
                        value: active.metrics.meanQualityScore.toFixed(2),
                      },
                      {
                        label: "Contributors",
                        value: active.metrics.contributorCount,
                      },
                      {
                        label: "Terms per 1k",
                        value: active.metrics.languageCoverage,
                      },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <dt className="text-xs text-muted-foreground">
                          {stat.label}
                        </dt>
                        <dd className="mt-0.5 font-display text-lg font-semibold">
                          {stat.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => void download(active, "jsonl")}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      JSONL
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => void download(active, "csv")}
                    >
                      <FileJson className="h-3.5 w-3.5" aria-hidden />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      className="ml-auto"
                      onClick={() => void advance(active)}
                      disabled={
                        active.review.status === "released" ||
                        (active.review.status === "reviewed" &&
                          !readiness.ready)
                      }
                    >
                      {active.review.status === "reviewed"
                        ? "Mark training-ready"
                        : active.review.status === "training_ready"
                          ? "Mark released"
                          : "Mark reviewed"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <div className="flex items-center gap-2">
                    {readiness.ready ? (
                      <CheckCircle2
                        className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                        aria-hidden
                      />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" aria-hidden />
                    )}
                    <h3 className="font-display text-lg font-semibold">
                      Readiness
                    </h3>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {
                        readiness.checks.filter((check) => check.passed).length
                      }
                      /{readiness.checks.length} checks passed
                    </span>
                  </div>

                  <Progress
                    value={
                      (readiness.checks.filter((check) => check.passed).length /
                        Math.max(1, readiness.checks.length)) *
                      100
                    }
                    className="mt-3"
                  />

                  <ul className="mt-4 space-y-2">
                    {readiness.checks.map((check) => (
                      <li
                        key={check.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        {check.passed ? (
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                            aria-hidden
                          />
                        ) : (
                          <XCircle
                            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                            aria-hidden
                          />
                        )}
                        <span className="min-w-0">
                          <span className="font-medium">{check.label}</span>
                          <span className="block text-xs text-muted-foreground">
                            {check.detail}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <h3 className="font-display text-lg font-semibold">
                    Provenance
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Every row in this version can be traced back to a
                    contribution and the reviews that accepted it.
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Source contributions
                      </dt>
                      <dd className="mt-0.5 font-medium">
                        {active.provenance.contributionIds.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Reviews
                      </dt>
                      <dd className="mt-0.5 font-medium">
                        {active.provenance.reviewIds.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Languages
                      </dt>
                      <dd className="mt-0.5 font-medium">
                        {active.languageIds.join(", ") || "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
