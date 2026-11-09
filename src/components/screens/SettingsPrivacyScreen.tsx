"use client";

import React from 'react';
import { Ban, Database, Eye, EyeOff, Mic, ScrollText, VolumeX } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import SettingsRow from '@/components/settings/SettingsRow';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsShell from '@/components/settings/SettingsShell';
import { PrivacyPreferences } from '@/lib/accountSettings';

interface Props {
  privacy: PrivacyPreferences;
  onChange: <K extends keyof PrivacyPreferences>(key: K, value: PrivacyPreferences[K]) => void;
  onNavigate: (path: '/dashboard/settings/blocked' | '/dashboard/settings/muted' | '/dashboard/settings/data') => void;
  mutedCount: number;
  blockedCount: number;
}

/**
 * Privacy and safety settings.
 *
 * The four consent flags here are the same flags the profile screen writes,
 * so the two screens now share one source of truth on the account rather
 * than drifting apart. Muted words, blocked accounts and data settings are
 * device-scoped and live in the settings store.
 */
const SettingsPrivacyScreen: React.FC<Props> = ({
  privacy,
  onChange,
  onNavigate,
  mutedCount,
  blockedCount,
}) => {
  return (
    <SettingsShell title="Privacy & Safety" activeSection="privacy">
      <div className="space-y-8">
        <SettingsSection title="Visibility" description="Who can see your profile">
          <SettingsRow
            id="privacy.profileVisible"
            title="Public profile"
            description="Let other people find and view your profile"
            icon={<Eye className="w-5 h-5" />}
            control={
              <Switch
                checked={privacy.profileVisible}
                onCheckedChange={(checked) => onChange('profileVisible', checked)}
                aria-label="Public profile"
                className="data-[state=checked]:bg-primary"
              />
            }
          />
          <SettingsRow
            id="privacy.showChanga"
            title="Show Changa activity"
            description="Show your contributions on your public profile"
            icon={<EyeOff className="w-5 h-5" />}
            control={
              <Switch
                checked={privacy.showChanga}
                onCheckedChange={(checked) => onChange('showChanga', checked)}
                aria-label="Show Changa activity"
                className="data-[state=checked]:bg-primary"
              />
            }
          />
        </SettingsSection>

        <SettingsSection
          title="Data consent"
          description="Control how your contributions may be used"
        >
          <SettingsRow
            id="privacy.voiceDataAllowed"
            title="Voice data"
            description="Allow your voice recordings to be used for model training"
            icon={<Mic className="w-5 h-5" />}
            control={
              <Switch
                checked={privacy.voiceDataAllowed}
                onCheckedChange={(checked) => onChange('voiceDataAllowed', checked)}
                aria-label="Voice data consent"
                className="data-[state=checked]:bg-primary"
              />
            }
          />
          <SettingsRow
            id="privacy.culturalDataAllowed"
            title="Cultural data"
            description="Allow your cultural contributions to improve the models"
            icon={<ScrollText className="w-5 h-5" />}
            control={
              <Switch
                checked={privacy.culturalDataAllowed}
                onCheckedChange={(checked) => onChange('culturalDataAllowed', checked)}
                aria-label="Cultural data consent"
                className="data-[state=checked]:bg-primary"
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="Safety">
          <SettingsRow
            id="moderation.blockedUsers"
            title="Blocked accounts"
            description={
              blockedCount > 0
                ? `${blockedCount} account${blockedCount === 1 ? '' : 's'} blocked`
                : 'People who can no longer see or contact you'
            }
            icon={<Ban className="w-5 h-5" />}
            onClick={() => onNavigate('/dashboard/settings/blocked')}
          />
          <SettingsRow
            id="moderation.mutedWords"
            title="Muted words"
            description={
              mutedCount > 0
                ? `${mutedCount} word${mutedCount === 1 ? '' : 's'} muted`
                : 'Hide posts that contain words you mute'
            }
            icon={<VolumeX className="w-5 h-5" />}
            onClick={() => onNavigate('/dashboard/settings/muted')}
          />
          <SettingsRow
            id="section.data"
            title="Data settings"
            description="Data saver, media quality and exports"
            icon={<Database className="w-5 h-5" />}
            onClick={() => onNavigate('/dashboard/settings/data')}
          />
        </SettingsSection>
      </div>
    </SettingsShell>
  );
};

export default SettingsPrivacyScreen;
