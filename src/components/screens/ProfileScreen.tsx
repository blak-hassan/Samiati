"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { NavigateFn, Screen, User, LanguageSkill } from '@/types';
import { NotificationBell } from '@/components/shared/NotificationBell';
import {
  ArrowLeft,
  Globe,
  MapPin,
  Share2,
  Edit3,
  Lock,
  Check,
  UserPlus,
  Flame,
  ChevronRight,
  Languages,
  Trophy,
  BookOpen,
  Users,
  MoreVertical,
  Plus,
  StickyNote,
  Award,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
  Loader2
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
}

interface DayData {
  day: number;
  level: number;
  count: number;
  date: string;
  isEmpty: boolean;
}

const ProfileScreen: React.FC<Props> = ({ user, navigate, goBack, unreadCount = 0, isOwnProfile = true, languages }) => {
  const [profileVisible, setProfileVisible] = useState(true);
  const [showContributions, setShowContributions] = useState(true);
  const [allowMentions, setAllowMentions] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedDayStats, setSelectedDayStats] = useState<{ date: string, count: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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

  const calendarData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const monthName = now.toLocaleString('default', { month: 'long' });
    const days: DayData[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: 0, level: 0, count: 0, date: '', isEmpty: true });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const seed = (i * 7 + user.name.length * 3) % 100;
      let level = 0;
      let count = 0;

      if (seed > 30) {
        if (seed > 85) { level = 3; count = Math.floor(seed / 10); }
        else if (seed > 60) { level = 2; count = Math.floor(seed / 15); }
        else { level = 1; count = 1; }
      }

      if (i === now.getDate()) { level = 2; count = 3; }

      days.push({
        day: i,
        level,
        count,
        date: new Date(year, month, i).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        isEmpty: false
      });
    }

    return { monthName, year, days };
  }, [user.name]);

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-muted dark:bg-stone-800';
      case 1: return 'bg-primary/20 text-primary';
      case 2: return 'bg-primary/50 text-white';
      case 3: return 'bg-primary text-white';
      default: return 'bg-muted';
    }
  };

  const getSkillIcon = (level: string) => {
    switch (level) {
      case 'Beginner': return '🌱';
      case 'Intermediate': return '🌿';
      case 'Fluent': return '🌳';
      case 'Native': return '🌲';
      default: return '🌱';
    }
  };

  const RECENT_ACTIVITY = [
    { type: 'word', action: 'Added word', target: 'Umoja', time: '5 days ago', icon: <Languages className="w-4 h-4" /> },
    { type: 'story', action: 'Shared story', target: 'The Spider\'s Web', time: '1 week ago', icon: <StickyNote className="w-4 h-4" /> },
    { type: 'badge', action: 'Earned badge', target: 'Storyteller', time: '2 weeks ago', icon: <Trophy className="w-4 h-4" /> },
  ];

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
        {/* Profile Header */}
        <div className="p-4 space-y-6">
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
              {user.culturalBackground && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm font-bold text-primary uppercase tracking-wider">
                  <Globe className="w-4 h-4" />
                  <span>{user.culturalBackground}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1">
                <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-none font-bold text-xs">Language Guardian</Badge>
                {user.location && (
                  <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {user.location}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex justify-center gap-8">
            <button onClick={() => navigate(Screen.CONTRIBUTIONS)} className="text-center group">
              <p className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{user.followerCount || 124}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Followers</p>
            </button>
            <button onClick={() => navigate(Screen.CONTRIBUTIONS)} className="text-center group">
              <p className="text-xl font-black text-foreground group-hover:text-primary transition-colors">{user.followingCount || 89}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Following</p>
            </button>
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
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="w-full bg-transparent border-b h-12 px-4 justify-start gap-6">
            <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">Activity</TabsTrigger>
            <TabsTrigger value="languages" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">Languages</TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none font-black text-xs uppercase tracking-widest">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="p-4 space-y-6 mt-0">
            {/* Level Progress */}
            <section className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Progression</h3>
                  <p className="text-lg font-bold">Level 5: Word Weaver</p>
                </div>
                <Badge variant="outline" className="font-bold">350 / 500 XP</Badge>
              </div>
              <Progress value={70} className="h-3" />
            </section>

            {/* Streak */}
            <Card className="p-4 border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 dark:bg-orange-950 p-2 rounded-xl">
                    <Flame className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-foreground">21 Days</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Streak</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-muted-foreground">{calendarData.monthName}</p>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-black text-muted-foreground/50">{d}</div>
                ))}
                {calendarData.days.map((day, i) => (
                  <button key={i} disabled={day.isEmpty} onClick={() => setSelectedDayStats({ date: day.date, count: day.count })} className={cn("h-7 rounded-md transition-all flex items-center justify-center text-[10px] font-bold", day.isEmpty ? "invisible" : getLevelColor(day.level), !day.isEmpty && "hover:scale-110")} title={!day.isEmpty ? `${day.count} on ${day.date}` : ''}>
                    {!day.isEmpty && day.day}
                  </button>
                ))}
              </div>
            </Card>

            {/* Recent Activity List */}
            <section>
              <h3 className="text-lg font-black tracking-tight mb-4">Recent Activity</h3>
              <Card className="divide-y overflow-hidden border-border/50 shadow-sm">
                {RECENT_ACTIVITY.map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(Screen.CONTRIBUTIONS)}>
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activity.action} <span className="font-bold text-primary">{activity.target}</span></p>
                      <p className="text-xs text-muted-foreground font-medium">{activity.time}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                ))}
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="languages" className="p-4 space-y-4 mt-0">
            <div className="grid gap-3">
              {languages.map(skill => (
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
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {isOwnProfile && (
              <Button variant="secondary" onClick={() => navigate(Screen.MANAGE_LANGUAGES)} className="w-full h-12 rounded-xl gap-2 font-bold">
                <Edit3 className="w-4 h-4" />
                Update Skills
              </Button>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="p-4 mt-0">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Languages className="w-6 h-6" />, value: user.xp || 1204, label: 'Words', color: 'bg-primary/10 text-primary' },
                { icon: <BookOpen className="w-6 h-6" />, value: 88, label: 'Stories', color: 'bg-orange-100 text-orange-600' },
                { icon: <Users className="w-6 h-6" />, value: 156, label: 'Watu Helped', color: 'bg-green-100 text-green-600' },
                { icon: <Award className="w-6 h-6" />, value: user.badges?.length || 12, label: 'Badges', color: 'bg-yellow-100 text-yellow-600' },
              ].map((stat) => (
                <button key={stat.label} onClick={() => navigate(stat.label === 'Badges' ? Screen.ALL_ACHIEVEMENTS : Screen.CONTRIBUTIONS)} className="group">
                  <Card className="p-4 text-center border-border/50 transition-all group-hover:bg-muted/50">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2", stat.color)}>
                      {stat.icon}
                    </div>
                    <h4 className="text-2xl font-black text-foreground">{stat.value}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  </Card>
                </button>
              ))}
            </div>
            <Button onClick={() => navigate(Screen.ALL_ACHIEVEMENTS)} className="w-full mt-4 h-12 rounded-xl gap-2 font-bold bg-yellow-600 hover:bg-yellow-700 text-white">
              View All Badges <ChevronRight className="w-4 h-4" />
            </Button>
          </TabsContent>
        </Tabs>

        {/* Privacy Controls - Only for own profile */}
        {isOwnProfile && (
          <div className="p-4 space-y-4">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-black tracking-tight">Privacy</h3>
              </div>
              <Card className="divide-y border-border/50">
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="profile-visibility" className="text-base font-bold">Profile Visibility</Label>
                    <p className="text-xs text-muted-foreground">Control who can see your profile.</p>
                  </div>
                  <Switch id="profile-visibility" checked={profileVisible} onCheckedChange={setProfileVisible} />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-changa" className="text-base font-bold">Show Changa</Label>
                    <p className="text-xs text-muted-foreground">Display your contributions publicly.</p>
                  </div>
                  <Switch id="show-changa" checked={showContributions} onCheckedChange={setShowContributions} />
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