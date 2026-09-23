"use client";

import { useChangaQuery as useQuery } from "@/hooks/useChangaData";
import { api } from "../../../convex/_generated/api";
import { useNavigation } from "@/hooks/useNavigation";
import { Screen } from "@/types";
import { Button } from "@/components/ui/button";
import { Sparkles, Megaphone, ArrowRight } from "lucide-react";
import { logChangaEvent } from "@/lib/changaTelemetry";

interface PostThreadChangaBannerProps {
  languageTag?: string;
  postId: string;
  isModerator: boolean;
  postContent?: string;
}

/**
 * Renders a contextual banner under the post header that surfaces
 * matching Changa campaigns and offers one-tap entry into the changa
 * flow. Non-moderators can join a matching campaign; moderators can
 * additionally spin up a new campaign seeded from the post.
 */
export default function PostThreadChangaBanner({
  languageTag,
  postId,
  isModerator,
  postContent,
}: PostThreadChangaBannerProps) {
  const { navigate } = useNavigation();
  const campaigns = useQuery(
    api.changa.campaigns.listActiveCampaigns,
    languageTag ? { languageCode: languageTag, limit: 5 } : { limit: 5 }
  );

  const matching = languageTag
    ? (campaigns || []).find((c: { _id: string; languageCode?: string }) => c.languageCode === languageTag)
    : (campaigns || [])[0] as { _id: string; languageCode?: string } | undefined;

  const handleJoin = () => {
    if (!matching) return;
    logChangaEvent({ name: "attach_chip_attach", taskId: String(matching._id), languageCode: languageTag });
    navigate(Screen.CHALLENGE_DETAILS, {
      campaignId: String(matching._id),
      legacyChallengeId: String(matching._id),
    });
  };

  const handleCreate = () => {
    logChangaEvent({ name: "cta_banner_clicked", languageCode: languageTag });
    navigate(Screen.ADD_CHALLENGE, {
      type: "CUSTOM",
      seedPostId: postId,
      languageCode: languageTag,
      title: postContent?.slice(0, 60),
    });
  };

  return (
    <div className="mx-6 mb-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-700/40 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900 dark:bg-amber-800/50 dark:text-amber-200">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
            Turn this post into a Changa mission
          </p>
          <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/80">
            {matching
              ? `There's an active campaign in ${languageTag ?? "this language"}. Join to contribute, or start a new one.`
              : "No matching campaign yet. Help your language by starting one for this post."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {matching && (
              <Button
                size="sm"
                onClick={handleJoin}
                className="gap-1.5"
              >
                Join matching campaign
                <ArrowRight className="size-3.5" />
              </Button>
            )}
            {isModerator && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreate}
                className="gap-1.5"
              >
                <Megaphone className="size-3.5" />
                Create campaign from this post
              </Button>
            )}
            {!matching && !isModerator && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCreate}
                className="gap-1.5"
              >
                Suggest a changa for this post
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
