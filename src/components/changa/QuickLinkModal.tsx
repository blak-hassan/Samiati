"use client";

import React, { useMemo, useState } from "react";
import { useChangaMutation as useMutation, useChangaQuery as useQuery } from "@/hooks/useChangaData";
import { CheckCircle2, Link2, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { logChangaEvent } from "@/lib/changaTelemetry";
import type { Id } from "../../../convex/_generated/dataModel";

interface QuickLinkModalProps {
  open: boolean;
  onClose: () => void;
  defaultLanguageCode: string;
  defaultCampaignId?: Id<"changaCampaigns"> | null;
  onSubmitted?: (documentId: Id<"changaDocuments">) => void;
}

const LANGUAGE_OPTIONS = [
  { id: "sheng", label: "Sheng" },
  { id: "sw", label: "Kiswahili" },
  { id: "en", label: "English" },
  { id: "ki", label: "Kikuyu" },
  { id: "luo", label: "Dholuo" },
  { id: "kam", label: "Kamba" },
  { id: "yo", label: "Yoruba" },
  { id: "ig", label: "Igbo" },
  { id: "ha", label: "Hausa" },
  { id: "zu", label: "Zulu" },
];

export default function QuickLinkModal({
  open,
  onClose,
  defaultLanguageCode,
  defaultCampaignId,
  onSubmitted,
}: QuickLinkModalProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [languageCode, setLanguageCode] = useState(defaultLanguageCode);
  const [campaignId, setCampaignId] = useState<string | undefined>(
    defaultCampaignId ?? undefined
  );
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<Id<"changaDocuments"> | null>(null);
  const createQuickLink = useMutation(api.changa.documents.createQuickLink);
  const campaigns = useQuery(api.changa.campaigns.listActiveCampaigns, { limit: 20 }) as { _id: string; title?: string; [k: string]: unknown }[] | undefined;

  const trimmedUrl = url.trim();
  const isValidUrl = useMemo(
    () => /^https?:\/\/[^\s]+/i.test(trimmedUrl),
    [trimmedUrl]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl) {
      setError("Please enter a valid http(s) URL");
      return;
    }
    setError(null);
    try {
      const id = await createQuickLink({
        url: trimmedUrl,
        title: title.trim() || undefined,
        languageCode,
        campaignId: campaignId ? (campaignId as Id<"changaCampaigns">) : undefined,
      });
      logChangaEvent({ name: "quick_link_submitted", languageCode });
      setSubmittedId(id as Id<"changaDocuments">);
      onSubmitted?.(id as Id<"changaDocuments">);
    } catch (e) {
      // Convex surfaces a "ArgumentValidationError" for malformed ids; we
      // expose the raw message so the user can tell "invalid campaign"
      // apart from "network down" without inventing a mapping.
      const message = e instanceof Error ? e.message : "Couldn't save this link";
      setError(message);
      logChangaEvent({ name: "quick_link_failed", languageCode });
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-link-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-t-3xl bg-background p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="size-4" />
        </button>

        {submittedId ? (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="space-y-1">
              <h2 id="quick-link-title" className="text-lg font-semibold">
                Link saved
              </h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ll record the source. You can add entries later from My Documents.
              </p>
            </div>
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <h2
                id="quick-link-title"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Link2 className="size-4 text-amber-700 dark:text-amber-300" />
                Add a link
              </h2>
              <p className="text-sm text-muted-foreground">
                Paste a public URL. We&apos;ll record the source — you can add entries later.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="quick-link-url"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                URL
              </label>
              <input
                id="quick-link-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://archive.org/your-source"
                autoFocus
                className="w-full rounded-xl border-2 border-stone-200 bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-amber-600 dark:border-white/10"
                inputMode="url"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="quick-link-title"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Title (optional)
              </label>
              <input
                id="quick-link-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Coastal Sheng dictionary"
                className="w-full rounded-xl border-2 border-stone-200 bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-amber-600 dark:border-white/10"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="quick-link-language"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Language
              </label>
              <select
                id="quick-link-language"
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="w-full rounded-xl border-2 border-stone-200 bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-amber-600 dark:border-white/10"
              >
                {LANGUAGE_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {campaigns && campaigns.length > 0 && (
              <div className="space-y-1.5">
                <label
                  htmlFor="quick-link-campaign"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Attach to a campaign (optional)
                </label>
                <select
                  id="quick-link-campaign"
                  value={campaignId ?? ""}
                  onChange={(e) =>
                    setCampaignId(e.target.value === "" ? undefined : e.target.value)
                  }
                  className="w-full rounded-xl border-2 border-stone-200 bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-amber-600 dark:border-white/10"
                >
                  <option value="">None</option>
                  {campaigns.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={!isValidUrl} className="flex-1">
                Save link
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
