"use client";

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Key,
  Save,
  Undo2,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/shared/NotificationBell';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsField from '@/components/settings/SettingsField';
import SettingsRow from '@/components/settings/SettingsRow';
import LanguageEditor from '@/components/profile/LanguageEditor';
import { Screen, User, LanguageSkill } from '@/types';
import { ProfilePatch, PROFILE_FIELD_LIMITS } from '@/lib/profile';
import { CULTURAL_BACKGROUNDS } from '@/lib/languages';

/** The fields the profile can be updated with. */
export type { ProfilePatch };

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  unreadCount?: number;
  user: User;
  languages: LanguageSkill[];
  /** Persists the profile. Rejects with a message when the save fails. */
  onSave: (patch: ProfilePatch) => Promise<void>;
}

const MAX_NAME_LENGTH = PROFILE_FIELD_LIMITS.name;
const MAX_BIO_LENGTH = PROFILE_FIELD_LIMITS.bio;
const MAX_LOCATION_LENGTH = PROFILE_FIELD_LIMITS.location;

interface Draft {
  name: string;
  bio: string;
  location: string;
  culturalBackground: string;
  avatar: string;
  languages: LanguageSkill[];
}

/**
 * Edit profile.
 *
 * This screen used to be a mock-up: the name was hard-coded to
 * "Amina Diallo", the avatar was a hard-coded Google URL, the proficiency
 * buttons offered "Beginner / Intermediate / Fluent" — levels the data model
 * does not store — and the "Save Changes" button had no handler at all.
 *
 * It is now a real editor: it loads the current values, tracks unsaved
 * changes, validates them, and saves through the `updateProfile` mutation
 * (which enforces the same limits server-side).
 */
const EditProfileScreen: React.FC<Props> = ({
  navigate,
  goBack,
  unreadCount = 0,
  user,
  languages,
  onSave,
}) => {
  const [saved, setSaved] = useState<Draft>(() => ({
    name: user.name ?? '',
    bio: user.bio ?? '',
    location: user.location ?? '',
    culturalBackground: user.culturalBackground ?? '',
    avatar: user.avatar ?? '',
    languages,
  }));
  const [draft, setDraft] = useState<Draft>(saved);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  const nameError =
    draft.name.trim().length === 0
      ? 'Your name cannot be empty.'
      : draft.name.length > MAX_NAME_LENGTH
        ? `Your name can be at most ${MAX_NAME_LENGTH} characters.`
        : null;
  const bioError =
    draft.bio.length > MAX_BIO_LENGTH
      ? `Your bio can be at most ${MAX_BIO_LENGTH} characters.`
      : null;
  const locationError =
    draft.location.length > MAX_LOCATION_LENGTH
      ? `Your location can be at most ${MAX_LOCATION_LENGTH} characters.`
      : null;
  const avatarError =
    draft.avatar.trim() !== '' && !/^https?:\/\//i.test(draft.avatar.trim())
      ? 'The avatar must be a link starting with http:// or https://'
      : null;

  const hasValidationError = Boolean(nameError || bioError || locationError || avatarError);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const handleDiscard = () => {
    setDraft(saved);
    setError(null);
  };

  const handleSave = async () => {
    if (!isDirty || isSaving || hasValidationError) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        name: draft.name.trim(),
        bio: draft.bio.trim(),
        location: draft.location.trim(),
        culturalBackground: draft.culturalBackground,
        avatar: draft.avatar.trim(),
        languages: draft.languages,
      });
      setSaved(draft);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <header className="flex items-center px-4 h-14 sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground ml-2 tracking-tight">Edit Profile</h1>
        <div className="ml-auto flex items-center gap-2">
          {isDirty ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full">
              Unsaved
            </span>
          ) : null}
          <NotificationBell unreadCount={unreadCount} onNavigate={navigate} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 px-4 sm:px-6 py-6 max-w-3xl w-full mx-auto space-y-8">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <Avatar className="w-28 h-28 border-4 border-background shadow-xl">
            <AvatarImage src={draft.avatar} alt={draft.name} className="object-cover" />
            <AvatarFallback className="text-3xl">{draft.name[0] ?? '?'}</AvatarFallback>
          </Avatar>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            Paste a link to a profile picture below. It must start with http:// or https://.
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4"
          >
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-destructive">Could not save your profile</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        ) : null}

        {savedAt && !isDirty && !error ? (
          <div
            role="status"
            className="flex items-center gap-3 rounded-2xl border border-rasta-green/30 bg-rasta-green/5 p-4"
          >
            <Check className="w-5 h-5 text-rasta-green shrink-0" />
            <p className="text-sm font-bold text-foreground">Your profile has been updated.</p>
          </div>
        ) : null}

        <SettingsSection title="Profile">
          <SettingsField
            title="Full name"
            description="How your name appears across Samiati."
            htmlFor="profile-name"
            error={nameError ?? undefined}
          >
            <Input
              id="profile-name"
              value={draft.name}
              onChange={(event) => update('name', event.target.value)}
              maxLength={MAX_NAME_LENGTH + 20}
              className="h-11 bg-muted/30 border-border/50 rounded-xl px-4 font-bold text-foreground"
              placeholder="Enter your full name"
            />
          </SettingsField>

          <SettingsField
            title="Bio"
            description="A short introduction for other members."
            htmlFor="profile-bio"
            error={bioError ?? undefined}
            hint={`${draft.bio.length} / ${MAX_BIO_LENGTH}`}
          >
            <textarea
              id="profile-bio"
              value={draft.bio}
              onChange={(event) => update('bio', event.target.value)}
              rows={4}
              placeholder="Tell the community about yourself and the languages you care about…"
              className="w-full resize-y rounded-xl bg-muted/30 border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </SettingsField>

          <SettingsField
            title="Location"
            description="Where you are based. Optional."
            htmlFor="profile-location"
            error={locationError ?? undefined}
          >
            <Input
              id="profile-location"
              value={draft.location}
              onChange={(event) => update('location', event.target.value)}
              maxLength={MAX_LOCATION_LENGTH + 20}
              className="h-11 bg-muted/30 border-border/50 rounded-xl px-4 font-bold text-foreground"
              placeholder="Nairobi, Kenya"
            />
          </SettingsField>

          <SettingsField
            title="Cultural background"
            description="The culture you most identify with."
            htmlFor="profile-culture"
          >
            <select
              id="profile-culture"
              value={draft.culturalBackground}
              onChange={(event) => update('culturalBackground', event.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-muted/30 border border-border/50 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            >
              <option value="">Not set</option>
              {CULTURAL_BACKGROUNDS.map((background) => (
                <option key={background} value={background}>
                  {background}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField
            title="Profile picture"
            description="A direct link to your profile picture."
            htmlFor="profile-avatar"
            error={avatarError ?? undefined}
          >
            <Input
              id="profile-avatar"
              value={draft.avatar}
              onChange={(event) => update('avatar', event.target.value)}
              className="h-11 bg-muted/30 border-border/50 rounded-xl px-4 text-foreground"
              placeholder="https://example.com/photo.jpg"
            />
          </SettingsField>
        </SettingsSection>

        <SettingsSection
          title="Languages"
          description="The languages you speak and the level you are at in each."
        >
          <div className="p-4">
            <LanguageEditor
              languages={draft.languages}
              onChange={(next) => update('languages', next)}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingsRow
            title="Username"
            description={`${user.handle.replace('@', '')} — managed by your sign-in provider`}
            icon={<UserIcon className="w-5 h-5" />}
          />
          <SettingsRow
            title="Change password"
            description="Update the password you sign in with"
            icon={<Key className="w-5 h-5" />}
            onClick={() => navigate(Screen.CHANGE_PASSWORD)}
          />
        </SettingsSection>
      </main>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur-md border-t border-border z-40 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving || hasValidationError}
            className="flex-1 h-12 rounded-2xl font-bold gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleDiscard}
            disabled={!isDirty || isSaving}
            className="h-12 rounded-2xl px-5 font-bold gap-2 text-muted-foreground disabled:opacity-50"
          >
            <Undo2 className="w-4 h-4" />
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileScreen;
