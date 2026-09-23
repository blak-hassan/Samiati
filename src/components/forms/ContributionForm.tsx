// src/components/forms/ContributionForm.tsx
// Public contribution form. react-hook-form + zod for client validation,
// a honeypot, and a Cloudflare Turnstile widget. Submission goes through
// the `submitContribution` Server Action via `useTransition`.
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TurnstileWidget } from '@/components/turnstile/TurnstileWidget';
import {
  contributionFormSchema,
  ContributionFormFormData,
} from '@/lib/schemas';
import { submitContribution } from '@/app/actions/contribute';

export function ContributionForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    formState: { isSubmitting, isSubmitSuccessful },
  } = useForm<ContributionFormFormData>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      type: '',
      input1: '',
      input2: '',
      context: '',
      tags: [],
      website: '',
      turnstile: '',
    },
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setValue('tags', next, { shouldValidate: true });
    setTagInput('');
  }

  function removeTag(i: number) {
    const next = tags.filter((_, idx) => idx !== i);
    setTags(next);
    setValue('tags', next, { shouldValidate: true });
  }

  async function onSubmit(data: ContributionFormFormData) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const fd = new FormData();
      fd.set('type', data.type);
      fd.set('input1', data.input1);
      fd.set('input2', data.input2);
      if (data.context) fd.set('context', data.context);
      fd.set('tags', JSON.stringify(data.tags));
      fd.set('website', data.website || '');
      fd.set('turnstile', data.turnstile || '');
      const res = await submitContribution(undefined, fd);
      if (res.ok) {
        reset();
        setTags([]);
      } else {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        setError(res.error || 'Submission failed');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="sr-only" aria-hidden="true">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Contribution type</Label>
        <select
          id="type"
          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
          {...register('type')}
        >
          <option value="">Select a type…</option>
          <option value="word">Word</option>
          <option value="phrase">Phrase</option>
          <option value="proverb">Proverb</option>
          <option value="example">Example sentence</option>
          <option value="translation">Translation</option>
        </select>
        {fieldErrors.type && (
          <p className="text-destructive text-xs font-medium">{fieldErrors.type}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="input1">Content</Label>
        <Input id="input1" {...register('input1')} />
        {fieldErrors.input1 && (
          <p className="text-destructive text-xs font-medium">{fieldErrors.input1}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="input2">Translation</Label>
        <Input id="input2" {...register('input2')} />
        {fieldErrors.input2 && (
          <p className="text-destructive text-xs font-medium">{fieldErrors.input2}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="context">Context (optional)</Label>
        <Textarea id="context" rows={3} {...register('context')} />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag and press Enter"
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <TurnstileWidget
          onToken={(token) => {
            setValue('turnstile', token, { shouldValidate: true });
            clearErrors('turnstile');
          }}
          onExpire={() => setValue('turnstile', '', { shouldValidate: true })}
        />
        {(fieldErrors.turnstile) && (
          <p className="text-destructive text-xs font-medium">{fieldErrors.turnstile}</p>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {isSubmitSuccessful && (
        <div role="status" aria-live="polite" className="rounded-lg bg-success/10 p-3 text-sm text-success">
          Contribution submitted — thank you!
        </div>
      )}

      <Button type="submit" size="lg" disabled={isPending || isSubmitting} className="w-full">
        {isPending || isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          'Submit contribution'
        )}
      </Button>
    </form>
  );
}

export type { ContributionFormFormData };