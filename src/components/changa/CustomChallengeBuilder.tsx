"use client";

import { useState } from "react";
import { useChangaMutation as useMutation } from "@/hooks/useChangaData";
import { api } from "../../../convex/_generated/api";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, X, Sparkles, Loader2 } from "lucide-react";
import { logChangaEvent } from "@/lib/changaTelemetry";
import type { Id } from "../../../convex/_generated/dataModel";

type CustomField = {
    id: string;
    label: string;
    inputType: "text" | "textarea" | "audio" | "select" | "checkbox";
    required: boolean;
    options?: string[];
};

const TASK_TYPE_OPTIONS = [
    { value: "lexicon_entry", label: "Word / Lexicon" },
    { value: "phrase_translation", label: "Phrase translation" },
    { value: "sentence_translation", label: "Sentence translation" },
    { value: "transcription", label: "Transcription" },
    { value: "audio_reading", label: "Audio reading" },
    { value: "cultural_context", label: "Cultural context" },
    { value: "dialect_mapping", label: "Dialect mapping" },
] as const;

interface CustomChallengeBuilderProps {
    initialTitle?: string;
    initialLanguageCode?: string;
    initialCampaignId?: string;
}

export default function CustomChallengeBuilder({
    initialTitle = "",
    initialLanguageCode = "sheng",
    initialCampaignId,
}: CustomChallengeBuilderProps) {
    const { goBack, navigate } = useNavigation();
    const [step, setStep] = useState(1);
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState("");
    const [taskType, setTaskType] = useState<typeof TASK_TYPE_OPTIONS[number]["value"]>("lexicon_entry");
    const [languageCode, setLanguageCode] = useState(initialLanguageCode);
    const [goalCount, setGoalCount] = useState(50);
    const [successCriteria, setSuccessCriteria] = useState("");
    const [fields, setFields] = useState<CustomField[]>([
        { id: "q1", label: "Your answer", inputType: "textarea", required: true },
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createCampaign = useMutation(api.changa.campaigns.createCampaign);
    const createTemplate = useMutation(api.changa.customTasks.createCustomTemplate);

    const handleAddField = (inputType: CustomField["inputType"]) => {
        const newField: CustomField = {
            id: `q${Date.now().toString(36)}`,
            label: inputType === "audio" ? "Audio" : inputType === "select" ? "Pick one" : "Your answer",
            inputType,
            required: true,
        };
        if (inputType === "select") newField.options = ["Option A", "Option B"];
        setFields([...fields, newField]);
    };

    const handleRemoveField = (id: string) => {
        setFields(fields.filter((f) => f.id !== id));
    };

    const handleUpdateField = (id: string, patch: Partial<CustomField>) => {
        setFields(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    };

    const canAdvance = (s: number) => {
        if (s === 1) return title.trim().length > 0 && description.trim().length > 0;
        if (s === 2) return fields.length > 0 && fields.every((f) => f.label.trim().length > 0);
        return true;
    };

    const handleLaunch = async () => {
        setSubmitting(true);
        setError(null);
        try {
            // Create the campaign first.
            const campaignId = await createCampaign({
                title: title.trim(),
                description: description.trim(),
                languageCode,
                taskTypes: [taskType],
                goalCount,
                status: "active",
            });
            // Then the custom template attached to it.
            await createTemplate({
                title: title.trim(),
                description: description.trim(),
                taskType,
                languageCode,
                campaignId: campaignId as Id<"changaCampaigns">,
                inputSchema: fields.map((f) => ({
                    id: f.id,
                    label: f.label.trim(),
                    inputType: f.inputType,
                    required: f.required,
                    options: f.options,
                })),
                successCriteria: successCriteria.trim() || undefined,
            });
            logChangaEvent({ name: "custom_challenge_created", languageCode, taskType });
            navigate(Screen.CHALLENGE_DETAILS, {
                campaignId: String(campaignId),
                legacyChallengeId: String(campaignId),
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to create custom challenge");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-amber-50 px-4 py-6 dark:bg-stone-950 sm:py-10">
            <div className="mx-auto max-w-2xl space-y-5">
                <header className="flex items-center gap-3">
                    <button
                        onClick={step === 1 ? goBack : () => setStep(step - 1)}
                        className="rounded-full p-2 hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                            <Sparkles className="size-5 text-amber-700" />
                            Custom challenge
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Step {step} of 3 — {step === 1 ? "Basics" : step === 2 ? "Inputs" : "Review & launch"}
                        </p>
                    </div>
                </header>

                {error && (
                    <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <Card className="space-y-4 p-5">
                        <div>
                            <label className="text-sm font-bold">Title</label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Map Sheng slang in Nairobi Eastlands"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold">Description</label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Why does this matter? What does success look like?"
                                rows={4}
                                className="mt-1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-bold">Task type</label>
                                <select
                                    value={taskType}
                                    onChange={(e) => setTaskType(e.target.value as typeof taskType)}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                >
                                    {TASK_TYPE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold">Language</label>
                                <select
                                    value={languageCode}
                                    onChange={(e) => setLanguageCode(e.target.value)}
                                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                >
                                    <option value="sheng">Sheng</option>
                                    <option value="sw">Kiswahili</option>
                                    <option value="en">English</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-bold">Goal: {goalCount} contributions</label>
                            <input
                                type="range"
                                min={10}
                                max={500}
                                step={10}
                                value={goalCount}
                                onChange={(e) => setGoalCount(Number(e.target.value))}
                                className="mt-2 w-full accent-amber-700"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => setStep(2)} disabled={!canAdvance(1)}>
                                Next
                            </Button>
                        </div>
                    </Card>
                )}

                {step === 2 && (
                    <Card className="space-y-4 p-5">
                        <p className="text-sm text-muted-foreground">
                            Define the questions contributors will answer. Each field becomes part of the submission form.
                        </p>
                        <div className="space-y-3">
                            {fields.map((f) => (
                                <div key={f.id} className="rounded-xl border bg-background p-3">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={f.label}
                                            onChange={(e) => handleUpdateField(f.id, { label: e.target.value })}
                                            placeholder="Question label"
                                            className="flex-1"
                                        />
                                        <select
                                            value={f.inputType}
                                            onChange={(e) => handleUpdateField(f.id, { inputType: e.target.value as CustomField["inputType"] })}
                                            className="rounded-lg border bg-background px-2 py-1 text-sm"
                                        >
                                            <option value="text">Short text</option>
                                            <option value="textarea">Long text</option>
                                            <option value="audio">Audio</option>
                                            <option value="select">Select</option>
                                            <option value="checkbox">Checkbox</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveField(f.id)}
                                            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                    {f.inputType === "select" && (
                                        <Textarea
                                            value={(f.options ?? []).join("\n")}
                                            onChange={(e) =>
                                                handleUpdateField(f.id, { options: e.target.value.split("\n").filter(Boolean) })
                                            }
                                            placeholder="One option per line"
                                            rows={3}
                                            className="mt-2"
                                        />
                                    )}
                                    <label className="mt-2 flex items-center gap-2 text-xs">
                                        <input
                                            type="checkbox"
                                            checked={f.required}
                                            onChange={(e) => handleUpdateField(f.id, { required: e.target.checked })}
                                        />
                                        Required
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(["text", "textarea", "audio", "select", "checkbox"] as const).map((t) => (
                                <Button
                                    key={t}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddField(t)}
                                    className="gap-1"
                                >
                                    <Plus className="size-3" /> {t}
                                </Button>
                            ))}
                        </div>
                        <div>
                            <label className="text-sm font-bold">Success criteria (optional)</label>
                            <Textarea
                                value={successCriteria}
                                onChange={(e) => setSuccessCriteria(e.target.value)}
                                placeholder="What does an excellent answer look like?"
                                rows={3}
                                className="mt-1"
                            />
                        </div>
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={() => setStep(3)} disabled={!canAdvance(2)}>Next</Button>
                        </div>
                    </Card>
                )}

                {step === 3 && (
                    <Card className="space-y-4 p-5">
                        <h2 className="text-lg font-bold">{title || "(untitled)"}</h2>
                        <p className="text-sm text-muted-foreground">{description}</p>
                        <div className="rounded-xl border bg-muted/30 p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Submission form
                            </p>
                            <ol className="mt-2 space-y-2">
                                {fields.map((f, idx) => (
                                    <li key={f.id} className="text-sm">
                                        <span className="font-bold">{idx + 1}. {f.label}</span>{" "}
                                        <span className="text-muted-foreground">({f.inputType}{f.required ? ", required" : ""})</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                            <Button onClick={handleLaunch} disabled={submitting} className="gap-1.5">
                                {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                                Launch custom challenge
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </main>
    );
}
