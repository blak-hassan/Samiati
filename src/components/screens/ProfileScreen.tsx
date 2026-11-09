'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { NavigateFn, Screen, User, LanguageSkill, ProfileDashboard } from '@/types';
import { useAccountSettings } from '@/hooks/useAccountSettings';
import { PageIntro } from '@/components/product/PageIntro';
import { ProductNav } from '@/components/product/ProductNav';
import { RecentActivityCalendar } from '@/components/profile/RecentActivityCalendar';
import { MyCorrections } from '@/components/feedback/MyCorrections';
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  Bookmark,
  CheckCircle2,
  Edit3,
  FileCheck2,
  Globe,
  Languages,
  Lock,
  MapPin,
  MessageCircle,
  Mic,
  PenLine,
  Settings,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
  user: User;
  navigate: NavigateFn;
  goBack: () => void;
  unreadCount?: number;
  isOwnProfile?: boolean;
  languages: LanguageSkill[];
  dashboard?: ProfileDashboard | null;
  loading?: boolean;
  conversationCount?: number;
  messageCount?: number;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-warning/10 text-warning' },
  submitted: { label: 'Quality checks', className: 'bg-ai/10 text-ai' },
  in_validation: { label: 'Community review', className: 'bg-ai/10 text-ai' },
  validated: { label: 'Accepted', className: 'bg-success/10 text-success' },
  curated: { label: 'Accepted', className: 'bg-success/10 text-success' },
  needs_fix: { label: 'Needs a fix', className: 'bg-warning/10 text-warning' },
  rejected: { label: 'Not accepted', className: 'bg-destructive/10 text-destructive' },
  withdrawn: { label: 'Withdrawn', className: 'bg-muted text-muted-foreground' },
};

export default function ProfileScreen({
  user,
  navigate,
  goBack,
  isOwnProfile = true,
  languages,
  dashboard,
  loading = false,
  conversationCount = 0,
  messageCount = 0,
}: Props) {
  const { privacy, setPrivacyPreference } = useAccountSettings();
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const contribution = dashboard?.contribution;
  const skills = user.languages?.length ? user.languages : languages;
  const level = dashboard?.contributorLevel;
  const timeline = dashboard?.timeline ?? [];
  const accepted = contribution?.accepted ?? 0;
  const levelProgress = level
    ? Math.min(100, Math.max(0, ((accepted - (level.level - 1) * 5) / 5) * 100))
    : 0;

  const handleShare = async () => {
    try {
      if (navigator.share)
        await navigator.share({ title: `${user.name} · Samiati`, url: window.location.href });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setShareStatus('Profile link copied.');
      } else setShareStatus('Sharing is unavailable in this browser.');
    } catch (failure) {
      if (!(failure instanceof DOMException && failure.name === 'AbortError'))
        setShareStatus('We could not share this profile. Try again.');
    }
  };

  return (
    <div className="min-h-dvh bg-background pb-24 md:pb-8">
      <ProductNav active="profile" />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10"
      >
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={goBack}
            className="-ml-3 min-h-11 gap-2 text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          {isOwnProfile ? (
            <Button asChild variant="ghost" className="min-h-11 gap-2">
              <Link href="/dashboard/settings">
                <Settings className="size-4" />
                Settings
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" className="min-h-11 gap-2" onClick={handleShare}>
              <Share2 className="size-4" />
              Share profile
            </Button>
          )}
        </div>
        {shareStatus && (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            {shareStatus}
          </p>
        )}
        <PageIntro
          eyebrow="Your corner of Samiati"
          title={isOwnProfile ? 'A voice. A story. Yours.' : 'Every voice has a story.'}
        />
        {loading && dashboard === undefined ? (
          <div role="status" className="rounded-2xl border bg-card p-8 text-muted-foreground">
            Loading your profile…
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-8">
              <Avatar className="size-20 shrink-0 border border-border sm:size-24">
                <AvatarImage src={user.avatar} alt="" />
                <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-2">
                <h2 className="break-words text-2xl font-semibold tracking-tight">{user.name}</h2>
                <p className="break-words text-sm text-muted-foreground">{user.handle}</p>
                {user.bio && <p className="break-words text-sm leading-relaxed">{user.bio}</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  {user.culturalBackground && (
                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="size-3.5" />
                      {user.culturalBackground}
                    </span>
                  )}
                  {user.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {user.location}
                    </span>
                  )}
                  {user.role === 'moderator' && (
                    <span className="inline-flex items-center gap-1.5 text-ai">
                      <ShieldCheck className="size-3.5" />
                      Moderator
                    </span>
                  )}
                  {dashboard && (
                    <span>
                      Joined{' '}
                      {new Date(dashboard.joinedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                {dashboard && (
                  <p className="text-xs text-muted-foreground">
                    {dashboard.followerCount} followers · {dashboard.followingCount} following
                  </p>
                )}
              </div>
              {isOwnProfile && (
                <Button
                  variant="outline"
                  className="min-h-11 shrink-0 gap-2"
                  onClick={() => navigate(Screen.EDIT_PROFILE)}
                >
                  <Edit3 className="size-4" />
                  Edit profile
                </Button>
              )}
            </section>
            {!dashboard && (
              <p className="mt-4 text-sm text-muted-foreground">
                Contribution data is unavailable. Your account details will appear when connected.
              </p>
            )}
            {skills.length > 0 && (
              <div className="my-5 flex flex-wrap gap-2" aria-label="Your languages">
                {skills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="outline"
                    className="gap-2 bg-card px-3 py-2 text-xs"
                  >
                    <Languages className="size-3.5 text-primary" />
                    {skill.name}
                    <span className="text-muted-foreground">{skill.level}</span>
                  </Badge>
                ))}
              </div>
            )}
            <Tabs defaultValue="overview" className="mt-8">
              <TabsList
                className="mb-6 h-auto max-w-full flex-wrap justify-start gap-1 bg-secondary/40 p-1"
                aria-label="Profile sections"
              >
                <TabsTrigger value="overview" className="min-h-11 px-4">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="languages" className="min-h-11 px-4">
                  Languages
                </TabsTrigger>
                <TabsTrigger value="changa" className="min-h-11 px-4">
                  Changa
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-6">
                {isOwnProfile && (
                  <>
                    <section
                      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                      aria-label="Your activity"
                    >
                      <Metric
                        icon={MessageCircle}
                        label="Chats on this browser"
                        value={conversationCount}
                      />
                      <Metric
                        icon={PenLine}
                        label="Messages on this browser"
                        value={messageCount}
                      />
                      <Metric
                        icon={FileCheck2}
                        label="Accepted contributions"
                        value={contribution ? accepted : '—'}
                      />
                    </section>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button asChild variant="outline" className="min-h-12 justify-between">
                        <Link href="/dashboard/saved-conversations">
                          Saved conversations
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="min-h-12 justify-between">
                        <Link href="/dashboard/discover?view=saved">
                          <span className="inline-flex items-center gap-2">
                            <Bookmark className="size-4" />
                            Saved stories
                          </span>
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
                {level && (
                  <Card className="space-y-4 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Your contribution journey</p>
                        <h3 className="mt-1 text-xl font-semibold">
                          {level.title} · Level {level.level}
                        </h3>
                      </div>
                      <Award className="size-7 text-ai" />
                    </div>
                    <Button
                      variant="ghost"
                      className="-ml-3 min-h-11 w-fit text-sm"
                      onClick={() => navigate(Screen.ALL_ACHIEVEMENTS)}
                    >
                      View contribution milestones
                      <ArrowUpRight className="ml-2 size-4" />
                    </Button>
                    <Progress
                      value={level.level >= 10 ? 100 : levelProgress}
                      aria-label="Progress within current contributor level"
                    />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Recognition reflects accepted contributions and review quality. Every
                      thoughtful contribution counts, at your own pace.
                    </p>
                  </Card>
                )}
                {dashboard && <RecentActivityCalendar timeline={timeline} />}
                {contribution && contribution.total > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {Math.round(contribution.acceptRate * 100)}% accepted· {contribution.inReview}{' '}
                    in review · {contribution.drafts} drafts. Acceptance reflects reviewed
                    contributions; pending reviews can change these figures.
                  </p>
                )}
                {contribution && (
                  <section
                    className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                    aria-label="Contribution summary"
                  >
                    <Metric
                      icon={PenLine}
                      label="Contributions, including drafts"
                      value={contribution.total}
                    />
                    <Metric icon={CheckCircle2} label="Accepted" value={contribution.accepted} />
                    <Metric
                      icon={Mic}
                      label="Voice recordings"
                      value={contribution.voiceRecordings}
                    />
                    <Metric
                      icon={ShieldCheck}
                      label="Reviews"
                      value={contribution.validationCount}
                    />
                  </section>
                )}
                {isOwnProfile && process.env.NEXT_PUBLIC_CONVEX_URL && <MyCorrections />}
              </TabsContent>
              <TabsContent value="languages" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your self-reported language experience. This is not a language assessment or a
                  measure of Samiati&apos;s accuracy.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {skills.map((skill) => (
                    <Card key={skill.id} className="space-y-4 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold">{skill.name}</h3>
                        <Badge variant="secondary">{skill.level}</Badge>
                      </div>
                      <Progress
                        value={skill.percent}
                        aria-label={`${skill.name}: ${skill.level}, self-reported`}
                      />
                      <p className="text-xs text-muted-foreground">Self-reported proficiency</p>
                    </Card>
                  ))}
                </div>
                {skills.length === 0 && (
                  <p className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
                    Add the languages you speak, learn, or want to help improve.
                  </p>
                )}
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    className="min-h-11 gap-2"
                    onClick={() => navigate(Screen.MANAGE_LANGUAGES)}
                  >
                    <Languages className="size-4" />
                    Manage languages
                  </Button>
                )}
              </TabsContent>
              <TabsContent value="changa" className="space-y-4">
                {contribution && Object.keys(contribution.byType).length > 0 && (
                  <Card className="overflow-hidden p-5 sm:p-6">
                    <h3 className="mb-4 text-base font-semibold">Your contributions by task</h3>
                    <dl className="divide-y divide-border">
                      {Object.entries(contribution.byType).map(([type, counts]) => (
                        <div
                          key={type}
                          className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                        >
                          <dt className="capitalize">{type.replace(/_/g, ' ')}</dt>
                          <dd className="text-xs text-muted-foreground">
                            {counts.accepted} accepted / {counts.total} total
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </Card>
                )}

                {isOwnProfile && (
                  <div className="flex flex-wrap gap-3">
                    <Button className="min-h-11" onClick={() => navigate(Screen.CHANGA)}>
                      Find a contribution task
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-11"
                      onClick={() => navigate(Screen.CHANGA_ACTIVITY)}
                    >
                      All activity
                    </Button>
                  </div>
                )}
                {timeline.length > 0 ? (
                  <Card className="divide-y divide-border overflow-hidden">
                    {timeline.map((event) => {
                      const meta = event.status ? STATUS_META[event.status] : null;
                      return (
                        <div
                          key={`${event.kind}-${event.id}`}
                          className="flex flex-wrap items-start gap-3 p-5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-medium">
                              {event.label}
                              {event.languageCode ? ` · ${event.languageCode}` : ''}
                            </p>
                            {event.snippet && (
                              <p className="mt-1 break-words text-sm text-muted-foreground">
                                {event.snippet}
                              </p>
                            )}
                            <time
                              className="mt-2 block text-xs text-muted-foreground"
                              dateTime={new Date(event.timestamp).toISOString()}
                            >
                              {new Date(event.timestamp).toLocaleDateString()}
                            </time>
                          </div>
                          {meta && (
                            <span className={`rounded-lg px-2.5 py-1 text-xs ${meta.className}`}>
                              {meta.label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </Card>
                ) : (
                  <Card className="p-8 text-center">
                    <PenLine className="mx-auto mb-3 size-7 text-ai" />
                    <h3 className="text-lg font-semibold">
                      Every contribution starts with a voice.
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your words, recordings, and reviews will appear here with their real status.
                    </p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
            {isOwnProfile && (
              <section className="mt-10 space-y-4 border-t border-border pt-8">
                <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
                  <Lock className="size-5 text-primary" />
                  Privacy &amp; account
                </h2>
                <Card className="divide-y divide-border">
                  <div className="flex items-center justify-between gap-4 p-5">
                    <div>
                      <Label htmlFor="profile-visibility" className="text-sm font-medium">
                        Public profile
                      </Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Choose whether others can see your profile.
                      </p>
                    </div>
                    <Switch
                      id="profile-visibility"
                      checked={privacy.profileVisible}
                      onCheckedChange={(checked) => setPrivacyPreference('profileVisible', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 p-5">
                    <div>
                      <Label htmlFor="show-changa" className="text-sm font-medium">
                        Show Changa activity
                      </Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Choose whether your contributions appear publicly.
                      </p>
                    </div>
                    <Switch
                      id="show-changa"
                      checked={privacy.showChanga}
                      onCheckedChange={(checked) => setPrivacyPreference('showChanga', checked)}
                    />
                  </div>
                </Card>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline" className="min-h-11">
                    <Link href="/dashboard/settings/privacy">All privacy controls</Link>
                  </Button>
                  <Button asChild variant="outline" className="min-h-11">
                    <Link href="/settings/billing">Subscription details</Link>
                  </Button>
                  <Button asChild variant="outline" className="min-h-11">
                    <Link href="/dashboard/settings/data">Data &amp; export</Link>
                  </Button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MessageCircle;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="min-w-0 p-4 sm:p-5">
      <Icon className="mb-4 size-5 text-primary" aria-hidden="true" />
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{label}</p>
    </Card>
  );
}
