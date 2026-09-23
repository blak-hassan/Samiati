"use client";
import React, { useState, useEffect } from 'react';
import { PLACEHOLDER_AVATAR_URL } from "@/lib/defaults";
import { Screen, LanguageSkill } from '@/types';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/hooks/useToast';
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  Minus,
  Plus,
  ArrowRight,
  Shield,
  Save,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SettingsExitButton } from '@/components/settings/SettingsPageHeader';

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  unreadCount?: number;
}

const AVATAR_FALLBACK_URL = PLACEHOLDER_AVATAR_URL;

const KENYAN_LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'Swahili', code: 'sw' },
  { name: 'Kikuyu', code: 'ki' },
  { name: 'Luo', code: 'lu' },
];

const PROFICIENCY_LEVELS = ['Learning', 'Conversational', 'Fluent', 'Native'] as const;

const EditProfileScreen: React.FC<Props> = ({ navigate, goBack, unreadCount = 0 }) => {
  const { toast } = useToast();
  const updateProfileMutation = useMutation(api.users.mutations.updateProfile);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [culturalBackground, setCulturalBackground] = useState('');
  const [primaryLangName, setPrimaryLangName] = useState('English');
  const [primaryLangLevel, setPrimaryLangLevel] = useState<(typeof PROFICIENCY_LEVELS)[number]>('Fluent');
  const [secondaryLangName, setSecondaryLangName] = useState('');
  const [secondaryLangLevel, setSecondaryLangLevel] = useState<(typeof PROFICIENCY_LEVELS)[number]>('Learning');
  const [isAddingLang, setIsAddingLang] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addedLangName, setAddedLangName] = useState('');
  const [addedLangLevel, setAddedLangLevel] = useState<(typeof PROFICIENCY_LEVELS)[number]>('Learning');

  const profile = useQuery(api.users.queries.getProfile, {});

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setCulturalBackground(profile.culturalBackground || '');
      const langs = (profile.languages || []) as LanguageSkill[];
      if (langs.length > 0) {
        setPrimaryLangName(langs[0].name);
        setPrimaryLangLevel(langs[0].level);
      }
      if (langs.length > 1) {
        setSecondaryLangName(langs[1].name);
        setSecondaryLangLevel(langs[1].level);
      }
    }
  }, [profile]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast('Name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const languages: LanguageSkill[] = [];
      if (primaryLangName) {
        languages.push({
          id: primaryLangName.toLowerCase(),
          name: primaryLangName,
          level: primaryLangLevel,
          percent: PROFICIENCY_LEVELS.indexOf(primaryLangLevel as typeof PROFICIENCY_LEVELS[number]) * 25,
        });
      }
      if (secondaryLangName) {
        languages.push({
          id: secondaryLangName.toLowerCase(),
          name: secondaryLangName,
          level: secondaryLangLevel,
          percent: PROFICIENCY_LEVELS.indexOf(secondaryLangLevel as typeof PROFICIENCY_LEVELS[number]) * 25,
        });
      }

      await updateProfileMutation({
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
        culturalBackground: culturalBackground.trim(),
        languages: languages.length > 0 ? languages : undefined,
      });
      setSaved(true);
      toast('Profile updated', 'success');
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <header className="flex items-center p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-md z-30">
        <Button variant="ghost" size="icon" onClick={goBack} className="-ml-2 rounded-full text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <SettingsExitButton onClick={() => navigate(Screen.HOME_CHAT)} />
        <h2 className="flex-1 text-center text-lg font-bold text-foreground tracking-tight ml-8">Edit Profile</h2>
      </header>

      <main className="flex-1 p-6 pb-24 max-w-2xl mx-auto w-full">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-6 mb-10">
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-background ring-2 ring-primary/20 shadow-xl group-hover:scale-105 transition-transform duration-500">
              <AvatarImage src={profile?.avatar || AVATAR_FALLBACK_URL} className="object-cover" />
              <AvatarFallback className="text-4xl text-muted-foreground bg-muted">{name[0] || 'U'}</AvatarFallback>
            </Avatar>
            <Button size="icon" className="absolute bottom-0 right-0 h-10 w-10 border-4 border-background rounded-full shadow-lg">
              <Camera className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" className="h-9 px-4 rounded-full font-bold text-xs uppercase tracking-widest gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10">
            Change Photo
          </Button>
        </div>

        <div className="space-y-8">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 bg-muted/30 border-border/50 rounded-xl px-4 font-bold text-foreground focus-visible:ring-primary/20"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bio</Label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-muted/30 border border-border/50 rounded-xl h-24 px-4 text-foreground font-medium focus:border-primary outline-none transition-colors resize-none text-sm"
              placeholder="Tell us about yourself..."
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground font-medium">{bio.length}/500</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-12 bg-muted/30 border-border/50 rounded-xl px-4 text-foreground focus-visible:ring-primary/20"
                placeholder="City, Country"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cultural Background</Label>
              <Input
                value={culturalBackground}
                onChange={(e) => setCulturalBackground(e.target.value)}
                className="h-12 bg-muted/30 border-border/50 rounded-xl px-4 text-foreground focus-visible:ring-primary/20"
                placeholder="e.g., Kikuyu, Luo, Kalenjin..."
              />
            </div>
          </div>

            {/* Primary Language */}
            <div className="bg-muted/30 rounded-2xl p-5 border border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Primary Language</Label>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] font-bold tracking-widest h-5">{primaryLangLevel.toUpperCase()}</Badge>
              </div>
              <div className="relative">
                <select
                  value={primaryLangName}
                  onChange={(e) => setPrimaryLangName(e.target.value)}
                  className="w-full bg-background border border-border/50 rounded-xl h-11 px-4 text-foreground font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {KENYAN_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.name}>{l.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-3.5 text-muted-foreground pointer-events-none w-4 h-4" />
              </div>
              <div className="flex bg-muted p-1 rounded-xl">
                {PROFICIENCY_LEVELS.map((level) => (
                  <Button
                    key={level}
                    variant={primaryLangLevel === level ? "secondary" : "ghost"}
                    onClick={() => setPrimaryLangLevel(level)}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold ${primaryLangLevel === level ? "bg-background shadow-sm hover:bg-background" : "text-muted-foreground hover:bg-background"}`}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Secondary Language */}
            <div className="bg-muted/30 rounded-2xl p-5 border border-border/50 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-1 bg-orange-500/20" />
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Secondary Language</Label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setSecondaryLangName(''); setSecondaryLangLevel('Learning'); }}
                  className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive"
                >
                  <Minus className="w-3 h-3" />
                </Button>
              </div>
              <div className="relative">
                <select
                  value={secondaryLangName}
                  onChange={(e) => setSecondaryLangName(e.target.value)}
                  className="w-full bg-background border border-border/50 rounded-xl h-11 px-4 text-foreground font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select language...</option>
                  {KENYAN_LANGUAGES.filter(l => l.name !== primaryLangName).map((l) => (
                    <option key={l.code} value={l.name}>{l.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-3.5 text-muted-foreground pointer-events-none w-4 h-4" />
              </div>
              <div className="flex bg-muted p-1 rounded-xl">
                {PROFICIENCY_LEVELS.map((level) => (
                  <Button
                    key={level}
                    variant={secondaryLangLevel === level ? "secondary" : "ghost"}
                    onClick={() => setSecondaryLangLevel(level)}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold ${secondaryLangLevel === level ? "bg-background shadow-sm hover:bg-background" : "text-muted-foreground hover:bg-background"}`}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl border-dashed border-2 gap-2 font-black text-xs uppercase tracking-widest transition-all hover:bg-muted/50"
              onClick={() => setIsAddingLang(true)}
            >
              <Plus className="w-4 h-4" />
              Add Another Language
            </Button>

          <Button
            variant="ghost"
            onClick={() => navigate(Screen.CHANGE_PASSWORD)}
            className="w-full justify-between h-14 rounded-2xl text-orange-600 dark:text-orange-400 font-bold hover:bg-orange-500/5 group"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <span>Change Password</span>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </main>

      <div className="sticky bottom-0 bg-background/90 backdrop-blur-md p-6 border-t border-border z-40 space-y-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Save className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={goBack}
          className="w-full h-12 rounded-xl text-muted-foreground font-bold"
        >
          Cancel
        </Button>
      </div>

      {/* Add Another Language Modal */}
      {isAddingLang && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#332619] w-full sm:max-w-md rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-white/10 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-stone-900 dark:text-white">Add New Language</h3>
              <button
                type="button"
                onClick={() => setIsAddingLang(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-1 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Language</Label>
                <select
                  value={addedLangName}
                  onChange={(e) => setAddedLangName(e.target.value)}
                  className="w-full bg-background border border-border/50 rounded-xl h-12 px-4 text-foreground font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select language...</option>
                  {KENYAN_LANGUAGES
                    .filter((l) => l.name !== primaryLangName && l.name !== secondaryLangName)
                    .map((l) => (
                      <option key={l.code} value={l.name}>{l.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proficiency</Label>
                <div className="flex bg-muted p-1 rounded-xl">
                  {PROFICIENCY_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setAddedLangLevel(level)}
                      className={`flex-1 h-10 rounded-lg text-xs font-bold transition-all ${addedLangLevel === level
                        ? 'bg-white dark:bg-warm-dark-brown text-stone-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                        : 'text-stone-500 dark:text-text-muted hover:text-stone-800 dark:hover:text-white'
                        }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  variant="default"
                  disabled={!addedLangName.trim()}
                  onClick={() => {
                    setSecondaryLangName(addedLangName);
                    setSecondaryLangLevel(addedLangLevel);
                    setAddedLangName('');
                    setAddedLangLevel('Learning');
                    setIsAddingLang(false);
                  }}
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 active:scale-[0.98] text-lg disabled:opacity-50"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfileScreen;
