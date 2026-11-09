"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Send,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FEEDBACK_REASONS } from "../../../convex/feedbackConstants";
import { PromoteFeedbackDialog } from "./PromoteFeedbackDialog";

export type FeedbackContext = "chat" | "translate" | "voice" | "tts" | "search";

interface FeedbackBarProps {
  contextType: FeedbackContext;
  messageId?: string;
  conversationId?: string;
  language?: string;
  originalText?: string;
  className?: string;
  compact?: boolean;
}

const DOWN_REASONS = FEEDBACK_REASONS as Record<FeedbackContext, { id: string; label: string }[]>;

const CONTEXT_HINTS: Record<FeedbackContext, string> = {
  chat: "Suggest a better response",
  translate: "Suggest a better translation",
  voice: "Correct the transcript",
  tts: "Suggest better pronunciation",
  search: "Suggest a better answer",
};

const FeedbackBar: React.FC<FeedbackBarProps> = ({
  contextType,
  messageId,
  conversationId,
  language,
  originalText,
  className,
  compact = false,
}) => {
  const submitFeedback = useMutation(api.feedback.submit);

  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [showReasons, setShowReasons] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correction, setCorrection] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The id and public code of the report the user just filed. Both are needed
  // to offer the correction for review and to let the user quote it.
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedbackCode, setFeedbackCode] = useState<string | null>(null);
  const [showPromote, setShowPromote] = useState(false);

  const reasons = DOWN_REASONS[contextType];

  // Record the id/code the server returned so the correction can be promoted
  // and quoted afterwards.
  const trackSubmission = (result: { id?: string; code?: string | null }) => {
    if (result.id) setFeedbackId(result.id);
    if (result.code) setFeedbackCode(result.code);
  };

  const handleVote = async (type: "up" | "down") => {
    // Toggle off if same vote
    if (vote === type) {
      setVote(null);
      setShowReasons(false);
      setSelectedReason(null);
      setShowCorrection(false);
      setCorrection("");
      setSubmitted(false);
      return;
    }

    setVote(type);
    setSelectedReason(null);
    setShowCorrection(false);
    setCorrection("");
    setSubmitted(false);

    if (type === "up") {
      // Submit thumbs up immediately
      try {
        setIsSubmitting(true);
        const result = await submitFeedback({
          messageId,
          conversationId,
          type: "up",
          contextType,
          language,
          originalText,
        });
        trackSubmission(result);
        setSubmitted(true);
      } catch (err) {
        console.error("Failed to submit feedback:", err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Show reason selection for thumbs down
      setShowReasons(true);
    }
  };

  const handleReasonSelect = async (reasonId: string) => {
    setSelectedReason(reasonId);
    // Submit thumbs down with reason
    try {
      setIsSubmitting(true);
      const result = await submitFeedback({
        messageId,
        conversationId,
        type: "down",
        reason: reasonId,
        contextType,
        language,
        originalText,
      });
      trackSubmission(result);
      setSubmitted(true);
      // Show correction prompt after a brief moment
      setTimeout(() => setShowCorrection(true), 300);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCorrectionSubmit = async () => {
    if (!correction.trim()) return;
    try {
      setIsSubmitting(true);
      const result = await submitFeedback({
        messageId,
        conversationId,
        type: "down",
        reason: selectedReason ?? undefined,
        correction: correction.trim(),
        contextType,
        language,
        originalText,
      });
      trackSubmission(result);
      setSubmitted(true);
      setShowCorrection(false);
      setCorrection("");
    } catch (err) {
      console.error("Failed to submit correction:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissAll = () => {
    setShowReasons(false);
    setSelectedReason(null);
    setShowCorrection(false);
    setCorrection("");
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Main vote bar */}
      <div className={cn("flex items-center", compact ? "gap-0.5" : "gap-1")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleVote("up")}
          disabled={isSubmitting}
          className={cn(
            compact ? "h-7 w-7" : "h-8 w-8",
            "rounded-full transition-all",
            vote === "up"
              ? "text-green-500 bg-green-500/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          title="Helpful"
        >
          {submitted && vote === "up" ? (
            <Check className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
          ) : (
            <ThumbsUp className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleVote("down")}
          disabled={isSubmitting}
          className={cn(
            compact ? "h-7 w-7" : "h-8 w-8",
            "rounded-full transition-all",
            vote === "down"
              ? "text-destructive bg-destructive/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          title="Not quite right"
        >
          {submitted && vote === "down" ? (
            <Check className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
          ) : (
            <ThumbsDown className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
          )}
        </Button>

        {/* Thank you message after submission */}
        {submitted && vote && (
          <span className="text-[11px] text-muted-foreground ml-1 animate-in fade-in duration-300">
            {vote === "up" ? "Glad it helped!" : "Thanks for the feedback"}
          </span>
        )}
      </div>

      {/* Reason selection (after thumbs down) */}
      {showReasons && !submitted && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
            What went wrong?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((reason) => (
              <button
                key={reason.id}
                onClick={() => handleReasonSelect(reason.id)}
                disabled={isSubmitting}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                  "hover:bg-destructive/5 hover:border-destructive/30 hover:text-destructive",
                  "active:scale-95 disabled:opacity-50",
                  selectedReason === reason.id
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border/50 text-muted-foreground"
                )}
              >
                {reason.label}
              </button>
            ))}
          </div>
          <button
            onClick={dismissAll}
            className="mt-1.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Correction input (after reason selected) */}
      {showCorrection && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Pencil className="w-3 h-3 text-primary" />
            <p className="text-[11px] font-medium text-muted-foreground">
              {CONTEXT_HINTS[contextType]}
            </p>
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCorrectionSubmit();
                }
              }}
              placeholder={
                contextType === "translate"
                  ? "e.g. Better translation would be..."
                  : contextType === "voice"
                    ? "e.g. The correct word is..."
                    : "Your suggested improvement..."
              }
              className="flex-1 px-3 py-1.5 text-xs bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/40"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCorrectionSubmit}
              disabled={!correction.trim() || isSubmitting}
              className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Thank you after correction */}
      {submitted && !showCorrection && selectedReason && !correction && (
        <div className="animate-in fade-in duration-300">
          <button
            onClick={() => {
              setShowCorrection(true);
              setSubmitted(false);
            }}
            className="text-[11px] text-primary hover:underline font-medium"
          >
            {CONTEXT_HINTS[contextType]} (optional)
          </button>
        </div>
      )}

      {/* The correction has been filed. Offer to send it for community review,
          and give the user a quotable reference for it. */}
      {submitted && correction && feedbackId && (
        <div className="animate-in fade-in duration-300 space-y-1.5">
          <button
            onClick={() => setShowPromote(true)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
          >
            <Sparkles className="w-3 h-3" />
            Send this correction for community review
          </button>
          {feedbackCode && (
            <p className="text-[10px] text-muted-foreground/70">
              Reference: <span className="font-mono">{feedbackCode}</span>
            </p>
          )}
        </div>
      )}

      {showPromote && feedbackId && (
        <PromoteFeedbackDialog
          feedbackId={feedbackId}
          correction={correction}
          language={language}
          onClose={() => setShowPromote(false)}
        />
      )}
    </div>
  );
};

export default FeedbackBar;
