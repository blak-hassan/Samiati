'use client';

import { ChangaShell } from './ChangaShell';
import { ServiceUnavailable } from '@/components/shared/ServiceUnavailable';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/types';
import { changaCampaignTaskLabel } from '@/lib/changa';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Flame,
  Languages,
  Plus,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

interface ChangaCampaignsProps {
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
}

export default function ChangaCampaigns(props: ChangaCampaignsProps) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL)
    return (
      <ServiceUnavailable
        feature="Changa"
        active="changa"
        description="Your contribution workspace will appear when Changa is connected. No tasks or recordings are being simulated."
      />
    );
  return <LiveChangaCampaigns {...props} />;
}

function LiveChangaCampaigns({ navigate, goBack }: ChangaCampaignsProps) {
  const [showPropose, setShowPropose] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [proposalGoal, setProposalGoal] = useState('100');
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [isProposing, setIsProposing] = useState(false);

  const campaigns = useQuery(api.changa.campaigns.listActiveCampaigns, { limit: 20 });
  const userStats = useQuery(api.changa.stats.getUserContributionStats, {});
  const submitProposal = useMutation(api.changa.campaigns.submitCampaignProposal);

  const activeCampaigns = (campaigns || []).filter((c) => c.status === 'active');
  const totalContributions = activeCampaigns.reduce((sum, c) => sum + (c.currentCount || 0), 0);
  const totalGoals = activeCampaigns.reduce((sum, c) => sum + (c.goalCount || 0), 0);

  const handlePropose = async () => {
    if (!proposalTitle.trim() || !proposalDescription.trim() || isProposing) return;
    setIsProposing(true);
    setProposalError(null);
    try {
      await submitProposal({
        title: proposalTitle.trim(),
        description: proposalDescription.trim(),
        languageCode: 'sheng',
        taskTypes: ['sentence_translation', 'audio_reading'],
        goalCount: parseInt(proposalGoal) || 100,
      });
      setShowPropose(false);
      setProposalTitle('');
      setProposalDescription('');
      setProposalGoal('100');
    } catch (proposalFailure) {
      // Surface the failure instead of closing the form silently — the
      // contributor otherwise thinks their proposal was sent.
      setProposalError(
        proposalFailure instanceof Error
          ? proposalFailure.message
          : 'We could not send your proposal. Please try again.'
      );
    } finally {
      setIsProposing(false);
    }
  };

  return (
    <ChangaShell>
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            aria-label="Go back"
            className="min-h-11 min-w-11 rounded-xl p-2 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-editorial text-4xl tracking-tight">Campaigns</h1>
            <p className="text-sm text-muted-foreground">
              Join a campaign to help collect Sheng data.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPropose(!showPropose)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Propose
          </Button>
        </div>

        {/* Overall progress */}
        {activeCampaigns.length > 0 && (
          <Card className="grid grid-cols-3 divide-x divide-border p-4 text-center">
            <div>
              <p className="text-2xl font-bold text-warning ">{activeCampaigns.length}</p>
              <p className="text-xs text-muted-foreground">Active campaigns</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ai ">{totalContributions}</p>
              <p className="text-xs text-muted-foreground">Total contributions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success ">
                {totalGoals > 0 ? Math.round((totalContributions / totalGoals) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Overall progress</p>
            </div>
          </Card>
        )}

        {/* Your impact */}
        {userStats && userStats.contributionCount > 0 && (
          <Card className="flex items-center gap-4 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success  ">
              <Zap className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Your campaign contributions</p>
              <p className="text-xs text-muted-foreground">
                {userStats.contributionCount} total contributions across all campaigns
              </p>
            </div>
            {userStats.trustScore > 0 && (
              <div className="text-right">
                <p className="text-lg font-bold text-warning ">{userStats.trustScore}</p>
                <p className="text-xs text-muted-foreground">Trust</p>
              </div>
            )}
          </Card>
        )}

        {/* Propose form */}
        {showPropose && (
          <Card className="space-y-4 p-5 border-warning/40 ">
            <h3 className="text-sm font-semibold">Propose a campaign</h3>
            <input
              type="text"
              aria-label="Campaign title"
              placeholder="Campaign title"
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <textarea
              aria-label="Campaign description"
              placeholder="Describe what this campaign collects and why it matters..."
              value={proposalDescription}
              onChange={(e) => setProposalDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none"
            />
            <div className="flex items-center gap-2">
              <label htmlFor="campaign-goal" className="text-sm text-muted-foreground">
                Goal:
              </label>
              <input
                type="number"
                id="campaign-goal"
                value={proposalGoal}
                onChange={(e) => setProposalGoal(e.target.value)}
                className="w-24 rounded-lg border bg-background px-3 py-2 text-sm"
                min="10"
              />
              <span className="text-sm text-muted-foreground">contributions</span>
            </div>
            {proposalError && (
              <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {proposalError}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPropose(false);
                  setProposalError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handlePropose}
                disabled={isProposing || !proposalTitle.trim() || !proposalDescription.trim()}
              >
                {isProposing ? 'Sending…' : 'Submit proposal'}
              </Button>
            </div>
          </Card>
        )}

        {/* Campaign list */}
        {campaigns === undefined ? (
          <Card className="space-y-3 p-6 text-center">
            <div className="mx-auto size-8 animate-pulse rounded-full bg-muted" />
            <p className="text-sm text-muted-foreground">Loading campaigns...</p>
          </Card>
        ) : activeCampaigns.length === 0 ? (
          <Card className="space-y-3 p-6 text-center">
            <Target className="mx-auto size-8 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No active campaigns</h2>
            <p className="text-sm text-muted-foreground">
              Be the first to propose a campaign for collecting Sheng data.
            </p>
          </Card>
        ) : (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
              <Trophy className="size-3.5" />
              Active campaigns
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {activeCampaigns.map((campaign) => {
                const progress =
                  campaign.goalCount > 0
                    ? Math.min(100, Math.round((campaign.currentCount / campaign.goalCount) * 100))
                    : 0;
                const isComplete = progress >= 100;
                return (
                  <Card key={campaign._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{campaign.title}</p>
                          {isComplete && (
                            <span className="shrink-0 text-xs font-bold text-success">
                              Complete!
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {campaign.description}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-warning ">{progress}%</span>
                    </div>

                    {/* Metadata pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {campaign.languageCode && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <Languages className="size-2.5" />
                          {campaign.languageCode}
                        </span>
                      )}
                      {campaign.taskTypes.map((tt) => (
                        <span
                          key={tt}
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {changaCampaignTaskLabel(tt)}
                        </span>
                      ))}
                      {campaign.endAt && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <Clock className="size-2.5" />
                          Ends {new Date(campaign.endAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-colors duration-200 ${
                            isComplete ? 'bg-success/10' : 'bg-warning/10'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {campaign.currentCount} / {campaign.goalCount} contributions
                      </p>
                    </div>

                    {/* Actions */}
                    {!isComplete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={() => {
                          // Carry the campaign over so the
                          // Changa home can scope the
                          // task queue to it.
                          navigate(Screen.CHANGA, {
                            campaignId: campaign._id,
                          });
                        }}
                      >
                        <Flame className="size-3.5" />
                        Contribute to this campaign
                        <ArrowRight className="size-3.5" />
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Leaderboard hint */}
        {activeCampaigns.length > 0 && (
          <Card className="space-y-3 p-4 text-center border-dashed">
            <Users className="mx-auto size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Top contributors get higher trust scores and early access to new features.
            </p>
          </Card>
        )}
      </div>
    </ChangaShell>
  );
}
