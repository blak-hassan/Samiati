"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SamiatiLogo from "@/components/SamiatiLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Clerk handles password reset via their hosted flow
    // For custom implementation, you would use Clerk's API
    // For now, we'll simulate the flow and redirect
    try {
      // In production, this would call Clerk's password reset API
      // await clerkClient.users.sendResetPasswordCode(email);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch (err) {
      setError("Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background-light to-background-dark p-4">
        <div className="w-full max-w-md">
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[32px] p-8 shadow-2xl shadow-primary/5 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-3xl">✉️</span>
              </div>
            </div>
            
            <h1 className="text-2xl font-black text-foreground mb-3">
              Check your email
            </h1>
            
            <p className="text-muted-foreground mb-6">
              We sent a password reset link to <span className="font-medium text-foreground">{email}</span>
            </p>
            
            <p className="text-sm text-muted-foreground mb-6">
              Didn't receive the email? Check your spam folder or{" "}
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
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background-light to-background-dark p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <SamiatiLogo size={60} />
          </Link>
        </div>

        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[32px] p-8 shadow-2xl shadow-primary/5">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-foreground mb-2">
              Forgot password?
            </h1>
            <p className="text-muted-foreground text-sm">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-stone-700 dark:text-stone-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-700"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

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
    </div>
  );
}
