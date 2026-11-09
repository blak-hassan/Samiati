"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { FALLBACK_CONSENT_POLICY_VERSION } from "../../../convex/changa/constants";

interface PromoteFeedbackDialogProps {
  feedbackId: string;
  correction: string;
  language?: string;
  onClose: () => void;
}

/**
 * Send a reported correction into the community review queue.
 *
 * The correction a user typed is a language contribution. Sending it for
 * review puts it in front of other speakers, and — if it is accepted — into
 * the dataset Samiati trains on. Consent is explicit: nothing is filed for
 * training until the user ticks the box.
 */
export const PromoteFeedbackDialog: React.FC<PromoteFeedbackDialogProps> = ({
  feedbackId,
  correction,
  language,
  onClose,
}) => {
  const promote = useMutation(api.feedback.promoteToChanga);
  const consentPolicy = useQuery(api.changa.consent.getActiveConsentPolicy);

  const [hasTrainingConsent, setHasTrainingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The consent policy that is actually in force. Until it loads we must not
  // submit — the server rejects a submission agreed to under an outdated
  // policy version, so guessing here would fail at the last step.
  const consentPolicyLoaded = consentPolicy !== undefined;
  const consentPolicyVersion =
    consentPolicy?.policyVersion ?? FALLBACK_CONSENT_POLICY_VERSION;

  const handleSubmit = async () => {
    if (!hasTrainingConsent || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await promote({
        feedbackId: feedbackId as Id<"feedback">,
        consent: {
          isGranted: true,
          allowTraining: true,
          allowResearch: false,
          allowPublicAttribution: false,
          grantedAt: Date.now(),
        },
        consentPolicyVersion,
      });
      setDone(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not send this correction for review. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {done ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-500" />
                Sent for review
              </DialogTitle>
              <DialogDescription>
                Other speakers will check your correction. If they agree, it
                becomes part of the language data Samiati learns from.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                Send this for community review
              </DialogTitle>
              <DialogDescription>
                Your correction is filed as a language contribution and reviewed
                by other speakers
                {language ? ` in ${language}` : ""}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Your correction
                </Label>
                <p className="mt-1 text-sm">{correction}</p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-relaxed">
                <Checkbox
                  checked={hasTrainingConsent}
                  onCheckedChange={(value) => setHasTrainingConsent(value === true)}
                  aria-label="Allow storage, community review, and internal model training for this correction"
                />
                <span>
                  I allow Samiati to collect and store this correction, share it
                  with peer reviewers for validation, and use it for internal
                  language-model training. This does not authorize separate
                  research, public dataset release, commercial use or licensing, or public
                  attribution of my name.
                  {consentPolicy?.summaryText && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {consentPolicy.summaryText}
                    </span>
                  )}
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Consent policy {consentPolicyVersion}
                  </span>
                </span>
              </label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Read about{' '}
                <Link href="/privacy-policy#changa-consent" className="underline underline-offset-4">
                  Changa consent and withdrawal
                </Link>
                . To request withdrawal, email{' '}
                <a href="mailto:hasb8882@gmail.com" className="underline underline-offset-4">
                  hasb8882@gmail.com
                </a>
                . Previously released copies or trained models may require separate review.
              </p>

              {error && (
                <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!hasTrainingConsent || isSubmitting || !consentPolicyLoaded}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending…
                  </>
                ) : !consentPolicyLoaded ? (
                  "Loading consent policy…"
                ) : (
                  "Send for review"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PromoteFeedbackDialog;
