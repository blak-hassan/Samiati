"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Flag, Languages, Loader2, ShieldAlert, Wrench, XCircle } from "lucide-react";

const REJECT_CODES: Array<{ code: "duplicate" | "unsafe" | "unclear_audio" | "wrong_language"; label: string }> = [
    { code: "duplicate", label: "Duplicate" },
    { code: "unsafe", label: "Unsafe content" },
    { code: "unclear_audio", label: "Audio unclear" },
    { code: "wrong_language", label: "Wrong language" },
];

const SUBMISSION_TYPE_LABELS: Record<string, string> = {
    lexicon_entry: "Word",
    phrase_translation: "Phrase",
    sentence_translation: "Sentence",
    transcription: "Transcription",
    audio_reading: "Recording",
};

interface ValidationRunnerProps {
    languageCode?: string;
    goBack: () => void;
}

export default function ValidationRunner({ languageCode, goBack }: ValidationRunnerProps) {
    const queue = useQuery(api.changa.validation.listValidationQueue, {
        languageCode,
        limit: 20,
    });

    const submitValidationVote = useMutation(api.changa.validation.submitValidationVote);
    const escalateSubmission = useMutation(api.changa.validation.escalateSubmission);

    const [index, setIndex] = useState(0);
    const [isVoting, setIsVoting] = useState(false);
    const [showRejectCodes, setShowRejectCodes] = useState(false);
    const [selectedCode, setSelectedCode] = useState<typeof REJECT_CODES[number]["code"] | null>(null);
    const [comment, setComment] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const current = queue?.[index];

    // Blind review: the bundle hides earlier votes unless the reviewer is a
    // moderator. Assets and transcript are shown so the verdict is informed.
    const bundle = useQuery(
        api.changa.validation.getValidationBundle,
        current ? { submissionId: current._id } : "skip",
    );
    const audioAsset = bundle?.assets.find((asset) => asset.assetType === "audio");
    const audioUrl = useQuery(
        api.changa.validation.getSubmissionAssetUrl,
        audioAsset ? { assetId: audioAsset._id } : "skip",
    );

    const advance = () => {
        setSelectedCode(null);
        setShowRejectCodes(false);
        setComment("");
        setError(null);
        if (queue && index + 1 >= queue.length) {
            setDone(true);
        } else {
            setIndex((value) => value + 1);
        }
    };

    const handleVote = async (vote: "accept" | "minor_fix" | "reject") => {
        if (!current || isVoting) return;
        if (vote === "reject" && !selectedCode) {
            setShowRejectCodes(true);
            return;
        }
        setIsVoting(true);
        try {
            await submitValidationVote({
                submissionId: current._id,
                // Reject codes are first-class vote values: the chosen reason
                // is recorded as the verdict, not a free-text side note.
                vote: vote === "reject" ? selectedCode ?? "reject" : vote,
                issueCodes: vote === "reject" ? [selectedCode ?? "reject"] : undefined,
                comment: comment.trim() || undefined,
            });
            advance();
        } catch (voteError) {
            setError(voteError instanceof Error ? voteError.message : "We could not record your review. Please try again.");
        } finally {
            setIsVoting(false);
        }
    };

    const handleEscalate = async () => {
        if (!current || isVoting) return;
        setIsVoting(true);
        try {
            await escalateSubmission({
                submissionId: current._id,
                reason: comment.trim() || undefined,
            });
            advance();
        } catch (escalateError) {
            setError(escalateError instanceof Error ? escalateError.message : "We could not escalate this item. Please try again.");
        } finally {
            setIsVoting(false);
        }
    };

    if (done) {
        return (
            <main className="min-h-screen bg-stone-50 px-4 py-12 dark:bg-stone-950">
                <Card className="mx-auto max-w-lg space-y-4 p-8 text-center">
                    <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
                    <h1 className="text-2xl font-bold">Queue cleared</h1>
                    <p className="text-sm text-muted-foreground">Thanks for reviewing. New submissions appear here as they pass quality checks.</p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={goBack}>Back</Button>
                        <Button className="flex-1" onClick={() => { setDone(false); setIndex(0); }}>Keep reviewing</Button>
                    </div>
                </Card>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-stone-50 px-4 py-6 dark:bg-stone-950 sm:py-10">
            <div className="mx-auto max-w-xl space-y-5">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Community review</h1>
                    <button onClick={goBack} className="text-sm text-muted-foreground hover:text-foreground">Back</button>
                </div>

                {queue === undefined || (queue.length === 0 && !current) ? (
                    <Card className="space-y-3 p-8 text-center">
                        {queue === undefined ? <Loader2 className="mx-auto size-6 animate-spin" /> : <ShieldAlert className="mx-auto size-8 text-muted-foreground" />}
                        <h2 className="text-lg font-semibold">{queue === undefined ? "Loading the queue…" : "Nothing to review right now"}</h2>
                        <p className="text-sm text-muted-foreground">
                            {queue === undefined
                                ? "Fetching submissions awaiting review."
                                : "Submissions land here once they pass their quality checks. Check back soon."}
                        </p>
                    </Card>
                ) : current && bundle === undefined ? (
                    <Card className="p-8 text-center text-sm text-muted-foreground">
                        <Loader2 className="mx-auto mb-3 size-6 animate-spin" />
                        Loading the submission…
                    </Card>
                ) : current && bundle ? (
                    <div className="space-y-5">
                        <Card className="space-y-4 p-5 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                                    <Languages className="size-3" />
                                    {bundle.languageCode}
                                    {bundle.dialectCode ? ` · ${bundle.dialectCode}` : ""}
                                </span>
                                <span className="rounded-full bg-muted px-2.5 py-1">
                                    {SUBMISSION_TYPE_LABELS[bundle.submissionType] ?? bundle.submissionType}
                                </span>
                                {current.requiresModerator && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                        <Flag className="size-3" /> Needs moderator attention
                                    </span>
                                )}
                                {current.voteCount > 0 && (
                                    <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                                        {current.voteCount} review{current.voteCount === 1 ? "" : "s"} so far
                                    </span>
                                )}
                            </div>

                            {bundle.sourceText && (
                                <section className="rounded-xl border bg-muted/40 p-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prompt</p>
                                    <p className="text-base leading-relaxed">{bundle.sourceText}</p>
                                </section>
                            )}

                            {(bundle.targetText || bundle.transcriptText) && (
                                <section className="rounded-xl border p-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Submitted answer</p>
                                    <p className="text-base leading-relaxed">{bundle.targetText || bundle.transcriptText}</p>
                                </section>
                            )}

                            {bundle.contextNote && (
                                <p className="text-xs text-muted-foreground">Context: {bundle.contextNote}</p>
                            )}

                            {audioAsset && (
                                <div className="space-y-1">
                                    <Label>Recording</Label>
                                    {audioUrl === undefined ? (
                                        <p className="text-sm text-muted-foreground">Loading audio…</p>
                                    ) : audioUrl ? (
                                        <audio controls preload="metadata" src={audioUrl} className="w-full" />
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Audio is temporarily unavailable.</p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="review-note">Note to the contributor (optional)</Label>
                                <Textarea
                                    id="review-note"
                                    value={comment}
                                    onChange={(event) => setComment(event.target.value)}
                                    placeholder="One clear sentence — what should change, if anything?"
                                    className="min-h-20 text-sm"
                                    maxLength={2000}
                                />
                            </div>

                            {showRejectCodes && (
                                <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                                    <p className="text-sm font-medium">Why should this be rejected?</p>
                                    <div className="flex flex-wrap gap-2">
                                        {REJECT_CODES.map((option) => (
                                            <button
                                                key={option.code}
                                                onClick={() => setSelectedCode(option.code)}
                                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                                    selectedCode === option.code
                                                        ? "bg-destructive text-destructive-foreground"
                                                        : "bg-muted hover:bg-accent"
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
                        </Card>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                disabled={isVoting}
                                onClick={() => handleVote("accept")}
                                className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-900/30"
                            >
                                <CheckCircle2 className="mr-2 size-4" /> Accept
                            </Button>
                            <Button
                                variant="outline"
                                disabled={isVoting}
                                onClick={() => handleVote("minor_fix")}
                                className="border-sky-300 text-sky-800 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-200 dark:hover:bg-sky-900/30"
                            >
                                <Wrench className="mr-2 size-4" /> Needs a small fix
                            </Button>
                            <Button
                                variant="outline"
                                disabled={isVoting}
                                onClick={() => handleVote("reject")}
                                className="border-destructive/40 text-destructive hover:bg-destructive/5"
                            >
                                <XCircle className="mr-2 size-4" /> Reject
                            </Button>
                            <Button variant="ghost" disabled={isVoting} onClick={handleEscalate}>
                                <Flag className="mr-2 size-4" /> Escalate
                            </Button>
                        </div>

                        {isVoting && <p className="text-center text-xs text-muted-foreground">Recording your review…</p>}
                    </div>
                ) : null}
            </div>
        </main>
    );
}

export type ValidationSubmissionId = Id<"changaSubmissions">;