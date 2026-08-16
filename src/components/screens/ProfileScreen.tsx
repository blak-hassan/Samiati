"use client";
import React, { useState, useCallback } from 'react';
import { NavigateFn, Screen, User, LanguageSkill, ProfileDashboard } from '@/types';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { NotificationBell } from '@/components/shared/NotificationBell';
import {
  ArrowLeft,
  Globe,
  MapPin,
  Share2,
  Edit3,
  Lock,
  UserPlus,
  Plus,
  Flame,
  ChevronRight,
  Languages,
  StickyNote,
  Award,
  ShieldCheck,
  UserCheck,
  MessageCircle,
  MessagesSquare,
  FileCheck2,
  PenLine,
  Clock3,
  CheckCircle2,
  Target,
  Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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

// Changa pipeline status → human copy (mirrors MyChangaActivity)
const STATUS_META: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft saved', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
  submitted: { label: 'Quality checks', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200' },
  in_validation: { label: 'Community review', className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200' },
  validated: { label: 'Accepted', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' },
  curated: { label: 'Accepted', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' },
  needs_fix: { label: 'Needs a fix', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200' },
  rejected: { label: 'Not accepted', className: 'bg-destructive/10 text-destructive' },
  withdrawn: { label: 'Withdrawn', className: 'bg-muted text-muted-foreground' },
};

function relativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatJoined(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function qualityLabel(acceptRate: number): string {
  if (acceptRate >= 0.8) return 'Excellent';
  if (acceptRate >= 0.6) return 'Good';
  if (acceptRate >= 0.4) return 'Fair';
  return 'Needs improvement';
}

const getSkillIcon = (level: string) => {
  switch (level) {
    case 'Beginner': return '🌱';
    case 'Intermediate': return '🌿';
    case 'Fluent': return '🌳';
    case 'Native': return '🌲';
    default: return '🌱';
  }
};

// Language code ↔ display name matching is intentionally tolerant, because
// profile languages carry names ("Kikuyu") while Changa uses codes ("kikuyu").
function contributionCountForLanguage(
  byLanguage: ProfileDashboard['contribution']['byLanguage'],
  name: string,
): { total: number; accepted: number } | null {
  const key = name.trim().toLowerCase();
  const entry = Object.entries(byLanguage).find(([code]) =>
    key === code.toLowerCase() || key.startsWith(code.toLowerCase()) || code.toLowerCase().startsWith(key),
  );
  return entry ? entry[1] : null;
}

const ProfileScreen: React.FC<Props> = ({
  user, navigate, goBack, unreadCount = 0, isOwnProfile = true, languages,
  dashboard, loading = false, conversationCount = 0, messageCount = 0,
}) => {
  // Privacy state — initialised from server; mutations persist immediately.
  const privacy = dashboard?.privacy;
  const updatePrivacy = useMutation(api.users.mutations.updatePrivacy);
  const [profileVisible, setProfileVisible] = useState(privacy?.profileVisible ?? true);
  const [showContributions, setShowContributions] = useState(privacy?.showChanga ?? true);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleProfileVisibleChange = useCallback((checked: boolean) => {
    setProfileVisible(checked);
    updatePrivacy({ profileVisible: checked }).catch(() => setProfileVisible(!checked));
  }, [updatePrivacy]);

  const handleShowChangaChange = useCallback((checked: boolean) => {
    setShowContributions(checked);
    updatePrivacy({ showChanga: checked }).catch(() => setShowContributions(!checked));
  }, [updatePrivacy]);

  const contribution = dashboard?.contribution;
  const level = dashboard?.contributorLevel ?? { level: 1, title: 'Explorer' };
  const isLoading = loading && dashboard === undefined;
  const hasReviewed = (contribution?.acceptRate ?? 0) > 0 && (contribution?.total ?? 0) > 0;
  const languagesForDisplay = user.languages && user.languages.length > 0 ? user.languages : languages;

  // Progress toward the next contributor title — volume ladder is 5 verified
  // contributions per level, gated by acceptance quality (spec §17).
  const accepted = contribution?.accepted ?? 0;
  const intoLevel = Math.max(0, accepted - (level.level - 1) * 5);
  const levelProgress = level.level >= 10 ? 100 : Math.min(100, (intoLevel / 5) * 100);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${user.name}'s Profile`,
        text: `Check out ${user.name}'s Samiati profile!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="flex items-center px-4 h-16 bg-background sticky top-0 z-10 shrink-0 border-b">
          <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="flex-1 text-center text-lg font-bold text-foreground tracking-tight ml-8">Profile</h1>
          <NotificationBell unreadCount={0} onNavigate={navigate} />
        </header>
        <main className="flex-1 p-4 space-y-6">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-24 h-24 rounded-full bg-muted" />
            <div className="h-8 w-48 bg-muted rounded-lg" />
            <div className="h-4 w-32 bg-muted rounded-lg" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const recentContributions = (dashboard?.timeline ?? []).filter((event) => event.kind === 'contribution').slice(0, 5);
  const recentValidation = (dashboard?.timeline ?? []).filter((event) => event.kind === 'validation').slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-background transition-colors duration-300">
      <header className="flex items-center px-4 h-16 bg-background sticky top-0 z-30 shrink-0 border-b">
        <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="flex-1 text-center text-lg font-black text-foreground tracking-tight ml-8">Profile</h1>
        <div className="flex items-center gap-2">
          {isOwnProfile ? (
            <Button variant="ghost" size="icon" onClick={() => navigate(Screen.EDIT_PROFILE)} className="rounded-full">
              <Edit3 className="w-5 h-5" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full">
              <Share2 className="w-5 h-5" />
            </Button>
          )}
          <NotificationBell unreadCount={unreadCount} onNavigate={navigate} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="p-4 space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-xl ring-1 ring-border">
                <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                <AvatarFallback className="text-4xl">{user.name[0]}</AvatarFallback>
              </Avatar>
              {user.role === 'moderator' && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left flex flex-col gap-1.5 flex-1">
              <h2 className="text-2xl font-black text-foreground tracking-tight">{user.name}</h2>
              <p className="text-sm font-bold text-muted-foreground">{user.handle}</p>
              {user.culturalBackground && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm font-bold text-primary uppercase tracking-wider">
                  <Globe className="w-4 h-4" />
                  <span>{user.culturalBackground}</span>
                </div>
              )}
              {dashboard && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                  <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-none font-bold text-xs">
                    <Award className="w-3.5 h-3.5 mr-1" />
                    {level.title} · Level {level.level}
                  </Badge>
                  {user.location && (
                    <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      {user.location}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Language identity chips (spec §5) */}
          {languagesForDisplay.length > 0 && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {languagesForDisplay.map((skill) => (
                <Badge key={skill.id} variant="outline" className="gap-1 px-2.5 py-1 text-xs font-bold text-foreground border-border/60 bg-card">
                  {getSkillIcon(skill.level)} {skill.name}
                  <span className="text-muted-foreground font-semibold">· {skill.level}</span>
                </Badge>
              ))}
            </div>
          )}

          {/* Stats Row — real counts from the followers table */}
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-xl font-black text-foreground">{dashboard?.followerCount ?? 0}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-foreground">{dashboard?.followingCount ?? 0}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Following</p>
            </div>
            {dashboard && (
              <div className="text-center">
                <p className="text-xl font-black text-foreground">{formatJoined(dashboard.joinedAt)}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Joined</p>
              </div>
            )}
          </div>

          {user.bio && (
            <Card className="p-4 bg-muted/30 border-none italic relative">
              <div className="absolute top-2 left-2 text-primary opacity-20">
                <StickyNote className="w-8 h-8 rotate-12" />
              </div>
              <p className="text-foreground/90 leading-relaxed text-sm relative z-10 px-4 py-2">
                &quot;{user.bio}&quot;
              </p>
            </Card>
          )}

          <div className="flex gap-3">
            {isOwnProfile ? (
              <Button onClick={() => navigate(Screen.EDIT_PROFILE)} className="flex-1 h-12 rounded-xl gap-2 font-bold">
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <Button onClick={() => setIsFollowing(!isFollowing)} variant={isFollowing ? "outline" : "default"} className={cn("flex-1 h-12 rounded-xl gap-2 font-bold", isFollowing ? "border-primary text-primary" : "")}>
                {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full bg-transparent border-b h-12 px-4 justify-start gap-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">Overview</TabsTrigger>
            <TabsTrigger value="languages" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">Languages</TabsTrigger>
            <TabsTrigger value="changa" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">Changa</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-4 space-y-6 mt-0">
            {/* Contributor level (spec §17) */}
            {dashboard && (
              <section className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Contributor Level</h3>
                    <p className="text-lg font-bold text-foreground">{level.title} · Level {level.level}</p>
                  </div>
                  {accepted > 0 ? (
                    <Badge variant="outline" className="font-bold">
                      {accepted} verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="font-bold text-muted-foreground">
                      Start contributing
                    </Badge>
                  )}
                </div>
                <Progress value={levelProgress} className="h-3" />
                <p className="text-xs font-medium text-muted-foreground">
                  {level.level >= 10
                    ? 'Highest level reached — every verified contribution strengthens your standing.'
                    : accepted === 0
                      ? 'Verified contributions unlock your first title.'
                      : `${Math.min(5, 5 - intoLevel)} more verified contribution${5 - intoLevel === 1 ? '' : 's'} to the next title`}
                </p>
              </section>
            )}

            {/* Samiati activity (spec §9) */}
            <section className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Your Samiati</h3>
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-4 text-center border-border/50 shadow-sm">
                  <MessageCircle className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  <p className="text-2xl font-black text-foreground">{conversationCount}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Chats</p>
                </Card>
                <Card className="p-4 text-center border-border/50 shadow-sm">
                  <MessagesSquare className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  <p className="text-2xl font-black text-foreground">{messageCount}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Messages</p>
                </Card>
                <Card className="p-4 text-center border-border/50 shadow-sm">
                  <Flame className={cn("w-5 h-5 mx-auto mb-1.5", (contribution?.streakDays ?? 0) > 0 ? "text-orange-500" : "text-muted-foreground")} />
                  <p className="text-2xl font-black text-foreground">{contribution?.streakDays ?? 0}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Day Streak</p>
                </Card>
              </div>
              {dashboard && dashboard.legacyContributionCount > 0 && (
                <p className="text-xs font-medium text-muted-foreground">
                  Plus {dashboard.legacyContributionCount} legacy contribution{dashboard.legacyContributionCount === 1 ? '' : 's'} from the community archive.
                </p>
              )}
            </section>

            {/* Contribution status (spec §13) */}
            <section className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Your Contribution</h3>
              {contribution && contribution.total > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-4 text-center border-border/50 shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
                      <p className="text-2xl font-black text-foreground">{contribution.accepted}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Accepted</p>
                    </Card>
                    <Card className="p-4 text-center border-border/50 shadow-sm">
                      <Clock3 className="w-5 h-5 text-violet-500 dark:text-violet-400 mx-auto mb-1.5" />
                      <p className="text-2xl font-black text-foreground">{contribution.inReview}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">In Review</p>
                    </Card>
                    <Card className="p-4 text-center border-border/50 shadow-sm">
                      <PenLine className="w-5 h-5 text-amber-500 dark:text-amber-400 mx-auto mb-1.5" />
                      <p className="text-2xl font-black text-foreground">{contribution.drafts}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Drafts</p>
                    </Card>
                    <Card className="p-4 text-center border-border/50 shadow-sm">
                      <Mic className="w-5 h-5 text-rose-500 dark:text-rose-400 mx-auto mb-1.5" />
                      <p className="text-2xl font-black text-foreground">{contribution.voiceRecordings}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Voice {contribution.voiceAccepted > 0 && <span className="text-emerald-500">({contribution.voiceAccepted} verified)</span>}
                      </p>
                    </Card>
                  </div>

                  {hasReviewed && (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="px-3 py-1 font-bold text-xs">
                        Quality: {qualityLabel(contribution.acceptRate)}
                      </Badge>
                      <Badge variant="outline" className="px-3 py-1 font-bold text-xs">
                        {Math.round(contribution.acceptRate * 100)}% acceptance
                      </Badge>
                      {contribution.reviewAgreementRate > 0 && (
                        <Badge variant="outline" className="px-3 py-1 font-bold text-xs">
                          {Math.round(contribution.reviewAgreementRate * 100)}% reviewer agreement
                        </Badge>
                      )}
                    </div>
                  )}

                  {Object.keys(contribution.byType).length > 0 && (
                    <Card className="divide-y divide-border/60 border-border/50 shadow-sm">
                      {Object.entries(contribution.byType)
                        .sort((a, b) => b[1].total - a[1].total)
                        .map(([type, counts]) => (
                          <div key={type} className="flex items-center justify-between p-3">
                            <span className="text-sm font-bold text-foreground capitalize">{type.replace(/_/g, ' ')}</span>
                            <span className="text-xs font-bold text-muted-foreground">
                              {counts.accepted} accepted / {counts.total} total
                            </span>
                          </div>
                        ))}
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="p-6 text-center border-border/50 shadow-sm">
                  <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-bold text-foreground">No contributions yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Quick tasks take about 15 seconds. Every accepted one helps preserve your language.</p>
                  {isOwnProfile && (
                    <Button onClick={() => navigate(Screen.CHANGA)} className="mt-4 h-11 rounded-xl gap-2 font-bold">
                      <Plus className="w-4 h-4" />
                      Start contributing
                    </Button>
                  )}
                </Card>
              )}
            </section>

            {/* Impact (spec §18) */}
            {dashboard && (
              <section className="space-y-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Your Impact</h3>
                <Card className="p-4 border-border/50 shadow-sm">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-black text-foreground">{contribution?.topLanguages.length ?? 0}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Languages</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-foreground">{contribution?.accepted ?? 0}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verified</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-foreground">{contribution?.validationCount ?? 0}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reviews</p>
                    </div>
                  </div>
                  {contribution && contribution.topLanguages.length > 0 && (
                    <p className="text-xs font-medium text-muted-foreground mt-3 text-center">
                      Your contributions are helping improve Samiati&apos;s{' '}
                      <span className="font-bold text-foreground">
                        {contribution.topLanguages.map((code) => code.charAt(0).toUpperCase() + code.slice(1)).join(' and ')}
                      </span>{' '}
                      capabilities.
                    </p>
                  )}
                </Card>
              </section>
            )}

            {/* Achievements (spec §21) — derived only from real milestones */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Achievements</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate(Screen.ALL_ACHIEVEMENTS)} className="text-xs font-bold text-primary gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { earned: conversationCount > 0, icon: <MessageCircle className="w-5 h-5" />, label: 'First Chat', color: 'bg-primary/10 text-primary' },
                  { earned: messageCount >= 50, icon: <MessagesSquare className="w-5 h-5" />, label: 'Conversationalist', color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300' },
                  { earned: (contribution?.accepted ?? 0) >= 1, icon: <FileCheck2 className="w-5 h-5" />, label: 'First Verified', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300' },
                  { earned: (contribution?.accepted ?? 0) >= 100, icon: <Languages className="w-5 h-5" />, label: '100 Verified', color: 'bg-primary/10 text-primary' },
                  { earned: (contribution?.streakDays ?? 0) >= 7, icon: <Flame className="w-5 h-5" />, label: '7-Day Streak', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300' },
                  { earned: (contribution?.streakDays ?? 0) >= 30, icon: <Flame className="w-5 h-5" />, label: '30-Day Streak', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300' },
                  { earned: languagesForDisplay.length >= 2, icon: <Globe className="w-5 h-5" />, label: 'Multi-Language', color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300' },
                  { earned: (contribution?.validationCount ?? 0) >= 10, icon: <ShieldCheck className="w-5 h-5" />, label: 'Validator', color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300' },
                ].map((achievement) => (
                  <div key={achievement.label} className={cn("rounded-xl p-3 text-center border transition-all", achievement.earned ? "border-border/50 shadow-sm" : "border-dashed border-border/60 opacity-50")}>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-1.5", achievement.earned ? achievement.color : "bg-muted text-muted-foreground")}>
                      {achievement.icon}
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">{achievement.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent activity timeline (spec §10) */}
            {(recentContributions.length > 0 || recentValidation.length > 0) && (
              <section className="space-y-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Recent Activity</h3>
                <Card className="divide-y divide-border/60 overflow-hidden border-border/50 shadow-sm">
                  {recentContributions.map((event) => {
                    const meta = event.status ? (STATUS_META[event.status] ?? STATUS_META.submitted) : null;
                    return (
                      <div key={`c-${event.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(Screen.CHANGA_ACTIVITY)}>
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                          <PenLine className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">
                            {event.label}
                            {event.languageCode && <span className="font-bold text-primary capitalize"> · {event.languageCode}</span>}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium">{relativeTime(event.timestamp)}</p>
                        </div>
                        {meta && (
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0", meta.className)}>
                            {meta.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {recentValidation.map((event) => (
                    <div key={`v-${event.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(Screen.CHANGA_ACTIVITY)}>
                      <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-300 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {event.label}
                          {event.languageCode && <span className="font-bold text-primary capitalize"> · {event.languageCode}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">{relativeTime(event.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </Card>
              </section>
            )}
          </TabsContent>

          <TabsContent value="languages" className="p-4 space-y-4 mt-0">
            {languagesForDisplay.length > 0 ? (
              <div className="grid gap-3">
                {languagesForDisplay.map(skill => {
                  const counts = contribution ? contributionCountForLanguage(contribution.byLanguage, skill.name) : null;
                  return (
                    <Card key={skill.id} className="p-4 transition-all hover:bg-muted/30 border-border/50 group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                          {getSkillIcon(skill.level)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1.5">
                            <h4 className="font-black text-foreground truncate">{skill.name}</h4>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter bg-primary/5 text-primary border-primary/20">{skill.level}</Badge>
                          </div>
                          <Progress value={skill.percent} className="h-2" />
                          <p className="text-[10px] text-muted-foreground mt-2 font-bold text-right">{Math.round(skill.percent)}% MASTERY</p>
                          {counts && (
                            <p className="text-[10px] text-muted-foreground mt-1 font-bold text-right">
                              {counts.accepted} verified · {counts.total} total contributions
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-6 text-center border-border/50 shadow-sm">
                <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground">No languages yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add the languages you speak, learn, or want to help preserve.</p>
              </Card>
            )}
            {isOwnProfile && (
              <Button variant="secondary" onClick={() => navigate(Screen.MANAGE_LANGUAGES)} className="w-full h-12 rounded-xl gap-2 font-bold">
                <Edit3 className="w-4 h-4" />
                Update Skills
              </Button>
            )}
          </TabsContent>

          <TabsContent value="changa" className="p-4 space-y-4 mt-0">
            <div className="flex gap-3">
              <Button onClick={() => navigate(Screen.CHANGA)} className="flex-1 h-11 rounded-xl gap-2 font-bold">
                <Plus className="w-4 h-4" />
                Start a task
              </Button>
              <Button variant="outline" onClick={() => navigate(Screen.CHANGA_ACTIVITY)} className="flex-1 h-11 rounded-xl gap-2 font-bold">
                All activity
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            {recentContributions.length > 0 ? (
              <Card className="divide-y divide-border/60 overflow-hidden border-border/50 shadow-sm">
                {recentContributions.map((event) => {
                  const meta = event.status ? (STATUS_META[event.status] ?? STATUS_META.submitted) : null;
                  return (
                    <div key={event.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-foreground truncate">
                          {event.label}
                          {event.languageCode && <span className="text-muted-foreground font-semibold capitalize"> · {event.languageCode}</span>}
                        </p>
                        {meta && (
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0", meta.className)}>
                            {meta.label}
                          </span>
                        )}
                      </div>
                      {event.snippet && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{event.snippet}</p>
                      )}
                      <p className="text-xs text-muted-foreground font-medium">{relativeTime(event.timestamp)}</p>
                    </div>
                  );
                })}
              </Card>
            ) : (
              <Card className="p-6 text-center border-border/50 shadow-sm">
                <PenLine className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground">Your Changa history will appear here</p>
                <p className="text-xs text-muted-foreground mt-1">Words, translations, recordings and cultural notes — each with its review status.</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Privacy Controls - Only for own profile */}
        {isOwnProfile && (
          <div className="p-4 space-y-4">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-black tracking-tight">Privacy</h3>
              </div>
              <Card className="divide-y border-border/50">
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="profile-visibility" className="text-base font-bold">Profile Visibility</Label>
                    <p className="text-xs text-muted-foreground">Control who can see your profile.</p>
                  </div>
                  <Switch id="profile-visibility" checked={profileVisible} onCheckedChange={handleProfileVisibleChange} />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-changa" className="text-base font-bold">Show Changa</Label>
                    <p className="text-xs text-muted-foreground">Display your contributions publicly.</p>
                  </div>
                  <Switch id="show-changa" checked={showContributions} onCheckedChange={handleShowChangaChange} />
                </div>
              </Card>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfileScreen;