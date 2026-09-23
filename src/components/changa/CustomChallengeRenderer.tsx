"use client";

import { useState } from "react";
import { useChangaMutation as useMutation } from "@/hooks/useChangaData";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { logChangaEvent } from "@/lib/changaTelemetry";
import type { Id } from "../../../convex/_generated/dataModel";

type Field = {
    id: string;
    label: string;
    inputType: "text" | "textarea" | "audio" | "select" | "checkbox";
    required: boolean;
    options?: string[];
};

interface CustomChallengeRendererProps {
    taskId: Id<"changaTasks">;
    templateId: Id<"changaCustomTaskTemplates">;
    fields: Field[];
    onComplete?: () => void;
}

export default function CustomChallengeRenderer({
    taskId,
    templateId,
    fields,
    onComplete,
}: CustomChallengeRendererProps) {
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = useMutation(api.changa.customTasks.submitCustomSubmission);

    const setField = (id: string, value: string) => {
        setResponses((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async () => {
        for (const f of fields) {
            if (f.required && !responses[f.id]?.trim()) {
                setError(`Please answer: ${f.label}`);
                return;
            }
        }
        setSubmitting(true);
        setError(null);
        try {
            await submit({ taskId, templateId, responses });
            logChangaEvent({ name: "custom_challenge_submitted" });
            setDone(true);
            onComplete?.();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <Card className="p-6 text-center">
                <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
                <p className="mt-2 font-bold">Submitted — thank you!</p>
            </Card>
        );
    }

    return (
        <Card className="space-y-4 p-5">
            {fields.map((f) => (
                <div key={f.id}>
                    <label className="text-sm font-bold">
                        {f.label}
                        {f.required && <span className="ml-1 text-red-500">*</span>}
                    </label>
                    {f.inputType === "textarea" ? (
                        <textarea
                            value={responses[f.id] ?? ""}
                            onChange={(e) => setField(f.id, e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                        />
                    ) : f.inputType === "select" ? (
                        <select
                            value={responses[f.id] ?? ""}
                            onChange={(e) => setField(f.id, e.target.value)}
                            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                        >
                            <option value="">— pick one —</option>
                            {(f.options ?? []).map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ) : f.inputType === "checkbox" ? (
                        <label className="mt-1 flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={responses[f.id] === "true"}
                                onChange={(e) => setField(f.id, e.target.checked ? "true" : "false")}
                            />
                            Yes
                        </label>
                    ) : f.inputType === "audio" ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                            Audio recording will be captured in the next step.
                        </p>
                    ) : (
                        <input
                            type="text"
                            value={responses[f.id] ?? ""}
                            onChange={(e) => setField(f.id, e.target.value)}
                            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                        />
                    )}
                </div>
            ))}
            {error && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
                    {error}
                </div>
            )}
            <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5">
                    {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    Submit
                </Button>
            </div>
        </Card>
    );
}
