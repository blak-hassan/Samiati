"use client";
import React, { useState, useMemo } from 'react';
import { Screen, User, LanguageSkill } from '@/types';
import {
  ArrowLeft,
  Globe,
  MapPin,
  Share2,
  Edit3,
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
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Props {
  user: User;
  navigate: (screen: Screen, params?: any) => void;
  goBack: () => void;
  isOwnProfile?: boolean;
  languages: LanguageSkill[];
}

interface DayData {
  day: number;
  level: number; // 0-3
  count: number;
  date: string;
  isEmpty: boolean;
}

const ProfileScreen: React.FC<Props> = ({ user, navigate, goBack, isOwnProfile = true, languages }) => {
  const [profileVisible, setProfileVisible] = useState(true);
  const [showContributions, setShowContributions] = useState(true);
  const [allowMentions, setAllowMentions] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedDayStats, setSelectedDayStats] = useState<{ date: string, count: number } | null>(null);

  const handleShare = () => {
    alert(`Profile link for ${user.name} copied to clipboard!`);
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

      if (i === now.getDate()) {
        level = 2;
        count = 3;
      }

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

  return (
    <div className="flex flex-col h-full bg-background transition-colors duration-300">
      <header className="flex items-center px-4 h-16 bg-background sticky top-0 z-10 shrink-0 border-b">
        <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="flex-1 text-center text-lg font-bold text-foreground pr-8 tracking-tight">Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-8 pb-24">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-xl ring-1 ring-border">
            <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
            <AvatarFallback className="text-4xl">{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left flex flex-col gap-1.5">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">{user.name}</h2>
            {user.culturalBackground && (
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm font-bold text-primary uppercase tracking-wider">
                <Globe className="w-4 h-4" />
                <span>{user.culturalBackground}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1">
              <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-none font-bold">Language Guardian</Badge>
              {user.location && (
                <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  {user.location}
                </div>
              )}
            </div>
          </div>
        </div>

        {user.bio && (
          <Card className="p-4 bg-muted/30 border-none italic relative">
            <div className="absolute top-2 left-2 text-primary opacity-20">
              <StickyNote className="w-8 h-8 rotate-12" />
            </div>
            <p className="text-foreground/90 leading-relaxed text-sm relative z-10 px-4 py-2">
              "{user.bio}"
            </p>
          </Card>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex-1 h-12 rounded-xl gap-2 font-bold"
          >
            <Share2 className="w-4 h-4" />
            Share Profile
          </Button>

          {isOwnProfile ? (
            <Button
              onClick={() => navigate(Screen.EDIT_PROFILE)}
              className="flex-1 h-12 rounded-xl gap-2 font-bold"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </Button>
          ) : (
            <Button
              onClick={() => setIsFollowing(!isFollowing)}
              variant={isFollowing ? "outline" : "default"}
              className={cn(
                "flex-1 h-12 rounded-xl gap-2 font-bold transition-all",
                isFollowing ? "border-primary text-primary" : ""
              )}
            >
              {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>

        {/* Level Progress */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Progression</h3>
              <p className="text-lg font-bold">Level 5: Word Weaver</p>
            </div>
            <Badge variant="outline" className="font-bold">350 / 500 XP</Badge>
          </div>
          <Progress value={70} className="h-3" />
        </section>

        {/* Language Skills */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Languages className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold tracking-tight">Language Journey</h3>
          </div>
          <div className="grid gap-3">
            {languages.map(skill => (
              <Card key={skill.id} className="p-4 transition-all hover:bg-muted/30 border-border/50 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                    {getSkillIcon(skill.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <h4 className="font-bold text-foreground truncate">{skill.name}</h4>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter bg-primary/5 text-primary border-primary/20">
                        {skill.level}
                      </Badge>
                    </div>
                    <Progress value={skill.percent} className="h-2" />
                    <p className="text-[10px] text-muted-foreground mt-2 font-bold text-right">
                      {Math.round(skill.percent)}% MASTERY
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {isOwnProfile && (
            <Button
              variant="secondary"
              onClick={() => navigate(Screen.MANAGE_LANGUAGES)}
              className="w-full mt-4 h-12 rounded-xl gap-2 font-bold"
            >
              <Edit3 className="w-4 h-4" />
              Update Skills
            </Button>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="text-xl font-bold tracking-tight">Recent Activity</h3>
            </div>
            <Button variant="link" size="sm" onClick={() => navigate(Screen.CONTRIBUTIONS, { initialTab: 'My Changa' })} className="text-primary font-bold">
              View All
            </Button>
          </div>
          <Card className="divide-y overflow-hidden border-border/50 shadow-sm">
            {RECENT_ACTIVITY.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {activity.action} <span className="font-bold text-primary">{activity.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">{activity.time}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
              </div>
            ))}
          </Card>
        </section>

        {/* Streak & Heatmap */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-600 animate-pulse" />
            <h3 className="text-xl font-bold tracking-tight">Changa Streak</h3>
          </div>
          <Card className="p-4 border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 dark:bg-orange-950 p-2.5 rounded-2xl">
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">21 Days</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-foreground">{calendarData.monthName} {calendarData.year}</p>
                {selectedDayStats ? (
                  <p className="text-[10px] font-bold text-primary uppercase animate-in slide-in-from-right-2">{selectedDayStats.count} Changa • {selectedDayStats.date}</p>
                ) : (
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Tap a day to view</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-black text-muted-foreground/50">{d}</div>
              ))}

              {calendarData.days.map((day, i) => (
                <button
                  key={i}
                  disabled={day.isEmpty}
                  onClick={() => setSelectedDayStats({ date: day.date, count: day.count })}
                  className={cn(
                    "h-8 rounded-md transition-all flex items-center justify-center text-[10px] font-bold outline-none",
                    day.isEmpty ? "invisible" : getLevelColor(day.level),
                    !day.isEmpty && "hover:scale-110 hover:ring-2 ring-primary/20 active:scale-95 focus:ring-2 focus:ring-primary/40",
                    day.level === 0 && "text-muted-foreground/40"
                  )}
                  title={!day.isEmpty ? `${day.count} Changa on ${day.date}` : ''}
                >
                  {!day.isEmpty && day.day}
                </button>
              ))}
            </div>

            <div className="flex justify-end items-center gap-1.5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">
              <span>Less</span>
              {[0, 1, 2, 3].map(lvl => (
                <div key={lvl} className={cn("w-3 h-3 rounded-sm", getLevelColor(lvl))}></div>
              ))}
              <span>More</span>
            </div>
          </Card>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: <Languages className="w-5 h-5" />,
              value: '1,204',
              label: 'Words',
              target: Screen.CONTRIBUTIONS,
              params: { initialTab: 'My Changa', typeFilter: 'Word' }
            },
            {
              icon: <BookOpen className="w-5 h-5" />,
              value: '88',
              label: 'Stories',
              target: Screen.CONTRIBUTIONS,
              params: { initialTab: 'My Changa', typeFilter: 'Story' }
            },
            {
              icon: <Users className="w-5 h-5" />,
              value: '156',
              label: 'Watu Helped',
              target: Screen.PEOPLE_TO_FOLLOW,
              params: { filter: 'Helped' }
            },
            {
              icon: <Award className="w-5 h-5" />,
              value: '12',
              label: 'Badges',
              target: Screen.ALL_ACHIEVEMENTS
            },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => navigate(stat.target, stat.params)}
              className="group relative overflow-hidden"
            >
              <Card className="p-4 flex flex-col gap-3 text-left border-border/50 transition-all group-hover:bg-muted/50 group-active:scale-95">
                <div className="flex justify-between items-center">
                  <div className="text-primary group-hover:scale-110 transition-transform">{stat.icon}</div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-foreground">{stat.value}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                </div>
              </Card>
            </button>
          ))}
        </div>

        {/* Achievements */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-xl font-bold tracking-tight">Achievements</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {[
              { icon: <Languages className="w-8 h-8" />, label: 'First 10 Words', active: true },
              { icon: <Flame className="w-8 h-8" />, label: '7-Day Streak', active: true },
              { icon: <Users className="w-8 h-8" />, label: 'Community Helper', active: true },
              { icon: <BookOpen className="w-8 h-8" />, label: 'Story Teller', active: false },
              { icon: <ShieldCheck className="w-8 h-8" />, label: 'Top Verifier', active: false },
            ].map((ach, i) => (
              <div key={i} className="flex flex-col items-center gap-3 min-w-[100px] group">
                <div className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center transition-all group-hover:rotate-12",
                  ach.active
                    ? "bg-secondary text-foreground shadow-md ring-1 ring-border"
                    : "bg-muted/30 text-muted-foreground/30 grayscale"
                )}>
                  {ach.icon}
                </div>
                <p className={cn(
                  "text-[10px] font-bold text-center uppercase tracking-tighter leading-tight",
                  ach.active ? "text-foreground" : "text-muted-foreground/50"
                )}>{ach.label}</p>
              </div>
            ))}
          </div>
          <Button
            onClick={() => navigate(Screen.ALL_ACHIEVEMENTS)}
            className="w-full mt-2 h-14 rounded-2xl gap-2 font-bold bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <span>View All Achievements</span>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </section>

        {/* Privacy Controls */}
        {isOwnProfile && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold tracking-tight">Privacy Controls</h3>
            </div>
            <Card className="divide-y border-border/50">
              <div className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="profile-visibility" className="text-base font-bold">Profile Visibility</Label>
                  <p className="text-xs text-muted-foreground">Control who can see your profile details.</p>
                </div>
                <Switch
                  id="profile-visibility"
                  checked={profileVisible}
                  onCheckedChange={setProfileVisible}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="show-changa" className="text-base font-bold">Show Changa</Label>
                  <p className="text-xs text-muted-foreground">Display your words and stories publicly.</p>
                </div>
                <Switch
                  id="show-changa"
                  checked={showContributions}
                  onCheckedChange={setShowContributions}
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-mentions" className="text-base font-bold">Allow Mentions</Label>
                  <p className="text-xs text-muted-foreground">Let others mention you in community posts.</p>
                </div>
                <Switch
                  id="allow-mentions"
                  checked={allowMentions}
                  onCheckedChange={setAllowMentions}
                />
              </div>
            </Card>
          </section>
        )}

      </main>
    </div>
  );
};

export default ProfileScreen;

