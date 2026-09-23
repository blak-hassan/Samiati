"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SamiatiLogo from "@/components/SamiatiLogo";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/lib/schemas";
import { isDemoMode } from "@/lib/appMode";
import { useSignIn } from "@clerk/nextjs";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'reset'>('request');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useSignIn();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const email = watch('email');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      if (isDemoMode) {
        // Demo mode only: no real backend, simulate the delay.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsSubmitted(true);
      } else if (signIn) {
        // Production path: delegate to Clerk's hosted password reset flow.
        // Clerk intentionally returns success even when the email is unknown
        // to avoid account enumeration, so we always advance to the reset step.
        await signIn.create({
          identifier: data.email,
          strategy: "reset_password_email_code",
        });
        setResetStep('reset');
      } else {
        // Clerk sign-in is not ready — block submission instead of silently
        // falling through to the demo branch.
        setError("Password reset is temporarily unavailable. Please try again later.");
      }
    } catch {
      setError("We couldn't start the password reset. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onCompleteReset = async () => {
    if (!signIn) return;
    setIsResetting(true);
    setError(null);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
      });
      if (attempt.status as string === "needsNewPassword") {
        await signIn.resetPassword({ password: newPassword });
      }
      setIsSubmitted(true);
    } catch {
      setError("The code or password was invalid. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  if (isSubmitted) {
    return (
      <main id="main" tabIndex={-1} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background-light to-background-dark p-4">
        <div className="w-full max-w-md">
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[32px] p-8 shadow-2xl shadow-primary/5 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-3xl">✉️</span>
              </div>
            </div>

            <h1 className="text-2xl font-black text-foreground mb-3">Check your email</h1>

            <p className="text-muted-foreground mb-6">
              We sent a password reset link to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>

            <p className="text-sm text-muted-foreground mb-6">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-primary hover:underline font-medium"
              >
                try again
              </button>
            </p>

            <Link href="/sign-in">
              <Button variant="outline" className="w-full rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main" tabIndex={-1} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background-light to-background-dark p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <SamiatiLogo size={60} />
          </Link>
        </div>

        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[32px] p-8 shadow-2xl shadow-primary/5">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-foreground mb-2">Forgot password?</h1>
            <p className="text-muted-foreground text-sm">
              No worries, we&apos;ll send you reset instructions.
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {resetStep === 'reset' ? (
            <form
              onSubmit={(e) => { e.preventDefault(); onCompleteReset(); }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="code" className="text-stone-700 dark:text-stone-300">
                  Verification code
                </Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  placeholder="Enter the code from your email"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-12 rounded-xl bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-stone-700 dark:text-stone-300">
                  New password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter a new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-12 rounded-xl bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-700"
                />
              </div>
              <Button
                type="submit"
                disabled={isResetting}
                className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-stone-700 dark:text-stone-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className="h-12 rounded-xl bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-700"
                />
                {errors.email && (
                  <p className="text-destructive text-xs font-medium">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/sign-in"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
