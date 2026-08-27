"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AudioRecorder } from "@/components/media/AudioRecorder";
import { useUploadFile } from "@/hooks/useUploadFile";
import { logChangaEvent } from "@/lib/changaTelemetry";
import { CheckCircle2, Clock3, Languages, Loader2, MessageSquare, Sparkles, XCircle } from "lucide-react";

const CODE_SWITCHING_OPTIONS = [
    { id: "pure_sheng", label: "Pure Sheng" },
    { id: "sheng_english", label: "Sheng + English" },
    { id: "sheng_swahili", label: "Sheng + Kiswahili" },
    { id: "heavy_mix", label: "Heavy code-switching" },
] as const;

type TextTask = {
    _id: Id<"changaTasks">;
    taskType: "lexicon_entry" | "phrase_translation" | "sentence_translation" | "transcription" | "audio_reading";
    languageCode: string;
    dialectCode?: string;
    promptSourceText?: string;
    promptTargetText?: string;
};

interface TaskContributionScreenProps {
    task: TextTask;
    onComplete: () => void;
}

const TASK_COPY: Record<TextTask["taskType"], { title: string; instruction: string; placeholder: string }> = {
    lexicon_entry: {
        title: "Add the word you would actually use",
        instruction: "Give the natural local-language equivalent. Do not add a category or explanation unless the task asks for one.",
        placeholder: "Type the natural word…",
    },
    phrase_translation: {
        title: "Translate this naturally",
        instruction: "Use the phrasing a fluent speaker would normally say, not necessarily a word-for-word translation.",
        placeholder: "Type the natural translation…",
    },
    sentence_translation: {
        title: "How would you actually say this?",
        instruction: "Translate the full meaning in natural language. Keep names and meaning intact.",
        placeholder: "Type the natural translation…",
    },
    transcription: {
        title: "Write what you hear",
        instruction: "Write the words as spoken. If you are unsure, skip this task rather than guessing.",
        placeholder: "Type the transcription…",
    },
    audio_reading: {
        title: "Record this in your natural voice",
        instruction: "Read the prompt as you would normally say it. Listen back, then submit the recording you are happy with.",
        placeholder: "",
    },
};

const DRAFT_PREFIX = "changa_draft_";
const ACTIVE_CONSENT_POLICY_VERSION = "changa-pilot-v1";

type SavedDraft = {
    submissionId: string;
    answer: string;
    consent: boolean;
    savedAt: number;
};

function readDraft(taskId: string): SavedDraft | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(DRAFT_PREFIX + taskId);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return null;
        const draft = parsed as Partial<SavedDraft>;
        if (typeof draft.submissionId !== "string") return null;
        return {
            submissionId: draft.submissionId,
            answer: typeof draft.answer === "string" ? draft.answer : "",
            consent: draft.consent === true,
            savedAt: typeof draft.savedAt === "number" ? draft.savedAt : 0,
        };
    } catch {
        return null;
    }
}

function writeDraft(taskId: string, draft: SavedDraft) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(DRAFT_PREFIX + taskId, JSON.stringify(draft));
    } catch {
        // Storage unavailable — the draft simply won't survive a refresh.
    }
}

function clearDraft(taskId: string) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(DRAFT_PREFIX + taskId);
    } catch {
        // ignore
    }
}

const PROCESSOR_LABELS: Record<string, string> = {
    basic_task_check: "Answer check",
    duplicate_detection: "Duplicate scan",
    language_id: "Language check",
    moderation: "Moderation",
    audio_quality: "Audio quality",
    asr: "Speech recognition",
};

export default function TaskContributionScreen({ task, onComplete }: TaskContributionScreenProps) {
    const [answer, setAnswer] = useState("");
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [codeSwitchingType, setCodeSwitchingType] = useState<string>("pure_sheng");
    const [hasTrainingConsent, setHasTrainingConsent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [phase, setPhase] = useState<"form" | "result">("form");
    const [resultSubmissionId, setResultSubmissionId] = useState<Id<"changaSubmissions"> | null>(null);

    const claimTask = useMutation(api.changa.tasks.claimTask);
    const skipTaskMutation = useMutation(api.changa.tasks.skipTask);
    const startClaimedSubmission = useMutation(api.changa.submissions.startClaimedSubmission);
    const submitSubmission = useMutation(api.changa.submissions.submitSubmission);
    const attachSubmissionAsset = useMutation(api.changa.submissions.attachSubmissionAsset);
    const { upload, isUploading, error: uploadError } = useUploadFile();

    // Audio recordings cannot survive a reload, so drafts are only resumed
    // for text tasks; an existing audio draft is discarded on mount.
    const draftRef = useRef<SavedDraft | null>(
        task.taskType === "audio_reading" ? null : readDraft(task._id),
    );

    useEffect(() => {
        if (task.taskType === "audio_reading") {
            clearDraft(task._id);
        } else {
            const draft = draftRef.current;
            if (draft) {
                setAnswer(draft.answer);
                setHasTrainingConsent(draft.consent);
            }
        }
        // Restoring a draft happens exactly once per task screen mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [task._id]);

    const copy = TASK_COPY[task.taskType];
    const prompt = task.promptSourceText || task.promptTargetText || "This task has no prompt yet.";
    const taskLabel = task.dialectCode ? `${task.languageCode} · ${task.dialectCode}` : task.languageCode;

    const telemetryContext = {
        taskType: task.taskType,
        languageCode: task.languageCode,
        taskId: task._id,
    };

    const consent = {
        isGranted: hasTrainingConsent,
        allowTraining: hasTrainingConsent,
        allowResearch: false,
        allowPublicAttribution: false,
        grantedAt: Date.now(),
    };

    const handleSaveDraft = async () => {
        if (isSavingDraft || isSubmitting || isUploading) return;
        setIsSavingDraft(true);
        setError(null);
        try {
            let submissionId = draftRef.current?.submissionId;
            if (!submissionId) {
                const claim = await claimTask({ taskId: task._id });
                logChangaEvent({ name: "task_claimed", ...telemetryContext });
                submissionId = await startClaimedSubmission({
                    claimId: claim.claimId as Id<"changaTaskClaims">,
                    consent,
                    consentPolicyVersion: ACTIVE_CONSENT_POLICY_VERSION,
                });
            }
            draftRef.current = { submissionId, answer, consent: hasTrainingConsent, savedAt: Date.now() };
            writeDraft(task._id, draftRef.current);
            setDraftSavedAt(Date.now());
            logChangaEvent({ name: "draft_saved", ...telemetryContext });
        } catch (draftError) {
            setError(draftError instanceof Error ? draftError.message : "We could not save your draft. Please try again.");
        } finally {
            setIsSavingDraft(false);
        }
    };

    const handleSkip = async () => {
        if (isSubmitting || isUploading || isSavingDraft) return;
        logChangaEvent({ name: "task_skipped", ...telemetryContext });
        try {
            // Claim (or reuse an existing claim) so the release is recorded,
            // then release it with a skip reason for allocation analytics.
            const claim = await claimTask({ taskId: task._id });
            await skipTaskMutation({ claimId: claim.claimId, reason: "user_skipped" });
        } catch {
            // Skipping is best-effort — the contributor still moves on.
        } finally {
            onComplete();
        }
    };

    const handleSubmit = async () => {
        const hasAnswer = task.taskType === "audio_reading" ? audioBlob !== null : answer.trim().length > 0;
        if (!hasAnswer || !hasTrainingConsent || isSubmitting || isUploading) return;

        setIsSubmitting(true);
        setError(null);
        logChangaEvent({ name: "task_started", ...telemetryContext });
        try {
            let submissionId = draftRef.current?.submissionId ?? null;
            if (!submissionId) {
                const claim = await claimTask({ taskId: task._id });
                logChangaEvent({ name: "task_claimed", ...telemetryContext });
                submissionId = await startClaimedSubmission({
                    claimId: claim.claimId as Id<"changaTaskClaims">,
                    consent,
                    consentPolicyVersion: ACTIVE_CONSENT_POLICY_VERSION,
                });
            }

            if (task.taskType === "audio_reading") {
                logChangaEvent({ name: "upload_started", ...telemetryContext });
                const storageId = await upload(audioBlob!);
                if (!storageId) {
                    logChangaEvent({ name: "upload_failed", ...telemetryContext });
                    throw new Error("Your recording could not be uploaded. Please try again.");
                }
                await attachSubmissionAsset({
                    submissionId: submissionId as Id<"changaSubmissions">,
                    storageId: storageId as Id<"_storage">,
                    assetType: "audio",
                    mimeType: audioBlob!.type || "audio/webm",
                });
            }

            await submitSubmission({
                submissionId: submissionId as Id<"changaSubmissions">,
                targetText: task.taskType === "transcription" ? undefined : answer.trim(),
                transcriptText: task.taskType === "transcription" ? answer.trim() : undefined,
            });
            clearDraft(task._id);
            draftRef.current = null;
            logChangaEvent({ name: "submitted", ...telemetryContext });
            setResultSubmissionId(submissionId as Id<"changaSubmissions">);
            setPhase("result");
        } catch (submissionError) {
            logChangaEvent({ name: "needs_retry", ...telemetryContext });
            setError(submissionError instanceof Error ? submissionError.message : "We could not submit this task. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (phase === "result" && resultSubmissionId) {
        return (
            <SubmitResult
                submissionId={resultSubmissionId}
                onComplete={onComplete}
                onRetry={onComplete}
            />
        );
    }

    return (
        <main className="min-h-screen bg-amber-50 px-4 py-6 dark:bg-stone-950 sm:py-12">
            <div className="mx-auto max-w-xl space-y-5">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                    <Sparkles className="size-4" />
                    A quick Changa task
                </div>
                <Card className="space-y-6 p-5 sm:p-7">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Languages className="size-3" />{taskLabel}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Clock3 className="size-3" />about 15 seconds</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
                        <p className="text-sm text-muted-foreground">{copy.instruction}</p>
                    </div>

                    <section className="rounded-xl border bg-muted/40 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prompt</p>
                        <p className="text-lg font-medium leading-relaxed">{prompt}</p>
                    </section>

                    {task.taskType === "audio_reading" ? (
                        <AudioRecorder onRecorded={setAudioBlob} onCancel={() => setAudioBlob(null)} />
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="changa-answer">Your answer</Label>
                            <Textarea
                                id="changa-answer"
                                value={answer}
                                onChange={(event) => setAnswer(event.target.value)}
                                placeholder={copy.placeholder}
                                className="min-h-28 text-base"
                                maxLength={5000}
                            />
                        </div>
                    )}

                    {/* Code-switching metadata for Sheng translation tasks */}
                    {task.languageCode === "sheng" && task.taskType === "sentence_translation" && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                                <MessageSquare className="size-3.5 text-muted-foreground" />
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    What type of Sheng did you use?
                                </Label>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {CODE_SWITCHING_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setCodeSwitchingType(option.id)}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                            codeSwitchingType === option.id
                                                ? "bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100"
                                                : "bg-muted text-muted-foreground hover:bg-accent"
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-relaxed">
                        <Checkbox
                            checked={hasTrainingConsent}
                            onCheckedChange={(value) => setHasTrainingConsent(value === true)}
                            aria-label="Allow this contribution to be used to improve Samiati"
                        />
                        <span>
                            I allow Samiati to use this contribution to improve its language models and research. My name will not be publicly attached to it.
                        </span>
                    </label>

                    {draftSavedAt && (
                        <p role="status" className="rounded-lg bg-emerald-100 p-3 text-sm text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                            Draft saved. You can close this page and come back later.
                        </p>
                    )}

                    {(error || uploadError) && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error || uploadError}</p>}

                    <div className="space-y-3">
                        <Button className="w-full" size="lg" disabled={(task.taskType === "audio_reading" ? !audioBlob : !answer.trim()) || !hasTrainingConsent || isSubmitting || isUploading} onClick={handleSubmit}>
                            {isSubmitting || isUploading ? "Uploading contribution…" : "Submit contribution"}
                        </Button>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" disabled={task.taskType === "audio_reading" || isSubmitting || isUploading} onClick={handleSaveDraft}>
                                {isSavingDraft ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                                Save draft
                            </Button>
                            <Button variant="ghost" disabled={isSubmitting || isUploading || isSavingDraft} onClick={handleSkip}>
                                Skip this task
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </main>
    );
}

// Live submission status: polls the submission's processing runs and derived
// status reactively, so the contributor watches their work pass the checks
// instead of seeing a static confirmation.
function SubmitResult({ submissionId, onComplete, onRetry }: {
    submissionId: Id<"changaSubmissions">;
    onComplete: () => void;
    onRetry: () => void;
}) {
    const status = useQuery(api.changa.processing.getSubmissionStatus, { submissionId });

    const finishedChecks = status?.processingRuns.filter((run) => run.status === "completed").length ?? 0;
    const totalChecks = status?.processingRuns.length ?? 0;

    return (
        <main className="min-h-screen bg-amber-50 px-4 py-12 dark:bg-stone-950">
            <div className="mx-auto max-w-lg space-y-5">
                <Card className="space-y-5 p-8 text-center">
                    {status === undefined ? (
                        <>
                            <Loader2 className="mx-auto size-12 animate-spin text-amber-600" />
                            <h1 className="text-2xl font-bold">Checking your contribution…</h1>
                            <p className="text-sm text-muted-foreground">Quality checks are running now. This page updates automatically.</p>
                        </>
                    ) : (
                        <>
                            {status.status === "accepted" ? (
                                <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
                            ) : status.status === "rejected" ? (
                                <XCircle className="mx-auto size-12 text-destructive" />
                            ) : status.status === "needs_retry" ? (
                                <XCircle className="mx-auto size-12 text-amber-600" />
                            ) : (
                                <Loader2 className="mx-auto size-12 animate-spin text-amber-600" />
                            )}
                            <h1 className="text-2xl font-bold">
                                {status.status === "accepted" ? "Contribution accepted"
                                    : status.status === "rejected" ? "Not accepted"
                                        : status.status === "needs_retry" ? "Needs a small fix"
                                            : "Contribution received"}
                            </h1>
                            <p className="text-sm text-muted-foreground">{status.message}</p>

                            {/* Live pipeline */}
                            {totalChecks > 0 && (
                                <ul className="space-y-2 rounded-xl border bg-muted/40 p-4 text-left">
                                    {status.processingRuns.map((run) => (
                                        <li key={run.processor} className="flex items-center justify-between text-sm">
                                            <span>{PROCESSOR_LABELS[run.processor] ?? run.processor}</span>
                                            {run.status === "completed" ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                                                    <CheckCircle2 className="size-4" /> done
                                                </span>
                                            ) : run.status === "failed" ? (
                                                <span className="inline-flex items-center gap-1 text-destructive">
                                                    <XCircle className="size-4" /> needs attention
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                    <Loader2 className="size-4 animate-spin" /> queued
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {finishedChecks > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {finishedChecks} of {totalChecks} quality checks passed.
                                </p>
                            )}

                            <div className="space-y-2">
                                <Button className="w-full" onClick={onComplete}>View my Changa activity</Button>
                                {status.status === "needs_retry" && (
                                    <Button variant="outline" className="w-full" onClick={onRetry}>Try another task</Button>
                                )}
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </main>
    );
}