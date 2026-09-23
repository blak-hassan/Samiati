// src/components/forms/ContactForm.tsx
// Public contact form. react-hook-form + zod, a honeypot, and a Turnstile
// widget. Submission goes through the `submitContact` Server Action.
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
  contactFormSchema,
  ContactFormFormData,
} from '@/lib/schemas';
import { submitContact } from '@/app/actions/contact';

export function ContactForm() {
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
  } = useForm<ContactFormFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', message: '', website: '', turnstile: '' },
  });

  async function onSubmit(data: ContactFormFormData) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const fd = new FormData();
      fd.set('name', data.name);
      fd.set('email', data.email);
      fd.set('message', data.message);
      fd.set('website', data.website || '');
      fd.set('turnstile', data.turnstile || '');
      const res = await submitContact(undefined, fd);
      if (res.ok) {
        reset();
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
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} />
        {fieldErrors.name && (
          <p className="text-destructive text-xs font-medium">{fieldErrors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} />
        {fieldErrors.email && (
          <p className="text-destructive text-xs font-medium">{fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={5} {...register('message')} />
        {fieldErrors.message && (
          <p className="text-destructive text-xs font-medium">{fieldErrors.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <TurnstileWidget
          onToken={(token) => {
            setValue('turnstile', token, { shouldValidate: true });
            clearErrors('turnstile');
          }}
          onExpire={() => setValue('turnstile', '', { shouldValidate: true })}
        />
        {fieldErrors.turnstile && (
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
          Message sent — thank you! We'll get back to you soon.
        </div>
      )}

      <Button type="submit" size="lg" disabled={isPending || isSubmitting} className="w-full">
        {isPending || isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          'Send message'
        )}
      </Button>
    </form>
  );
}

export type { ContactFormFormData };

// Local type alias so the hook call reads naturally.
function useFormContactFormFormData<T extends import('react-hook-form').FieldValues>(
  opts: Parameters<typeof useForm<T>>[0],
) {
  return useForm<T>(opts);
}