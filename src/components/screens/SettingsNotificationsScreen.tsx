"use client";

import React from 'react';
import { Bell, Mail, MessageCircle, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import SettingsRow from '@/components/settings/SettingsRow';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsShell from '@/components/settings/SettingsShell';
import { NotificationPreferences } from '@/lib/accountSettings';

interface Props {
  notificationPreferences: NotificationPreferences;
  onChange: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void;
}

/**
 * Notification preferences.
 *
 * These were previously local `useState` and were thrown away on refresh.
 * They are now stored on the user's account, so they follow the user between
 * devices — the same "account scope" behaviour T3Chat uses.
 */
const SettingsNotificationsScreen: React.FC<Props> = ({
  notificationPreferences,
  onChange,
}) => {
  const { pauseAll, changa, moderation, sessions, emailDigest } = notificationPreferences;

  return (
    <SettingsShell title="Notifications" activeSection="notifications">
      <div className="space-y-8">
        <SettingsSection title="All notifications">
          <SettingsRow
            id="notifications.pauseAll"
            title="Pause all notifications"
            description="Mute every notification temporarily"
            icon={<Bell className="w-5 h-5" />}
            control={
              <Switch
                checked={pauseAll}
                onCheckedChange={(checked) => onChange('pauseAll', checked)}
                aria-label="Pause all notifications"
                className="data-[state=checked]:bg-primary"
              />
            }
          />
        </SettingsSection>

        <div
          className={`transition-opacity duration-300 ${
            pauseAll ? 'opacity-50 pointer-events-none' : 'opacity-100'
          }`}
        >
          <SettingsSection title="Notification categories">
            <SettingsRow
              id="notifications.changa"
              title="Changa"
              description="Contribution, validation and campaign updates"
              icon={<MessageCircle className="w-5 h-5" />}
              control={
                <Switch
                  checked={changa}
                  onCheckedChange={(checked) => onChange('changa', checked)}
                  aria-label="Changa notifications"
                  className="data-[state=checked]:bg-primary"
                />
              }
            />
            <SettingsRow
              id="notifications.moderation"
              title="Moderation"
              description="Review requests and moderation alerts"
              icon={<Shield className="w-5 h-5" />}
              control={
                <Switch
                  checked={moderation}
                  onCheckedChange={(checked) => onChange('moderation', checked)}
                  aria-label="Moderation notifications"
                  className="data-[state=checked]:bg-primary"
                />
              }
            />
            <SettingsRow
              id="notifications.sessions"
              title="Sessions"
              description="Saved conversation and translation updates"
              icon={<Bell className="w-5 h-5" />}
              control={
                <Switch
                  checked={sessions}
                  onCheckedChange={(checked) => onChange('sessions', checked)}
                  aria-label="Session notifications"
                  className="data-[state=checked]:bg-primary"
                />
              }
            />
          </SettingsSection>

          <SettingsSection title="Email">
            <SettingsRow
              id="notifications.emailDigest"
              title="Weekly digest"
              description="A summary of your week by email"
              icon={<Mail className="w-5 h-5" />}
              control={
                <Switch
                  checked={emailDigest}
                  onCheckedChange={(checked) => onChange('emailDigest', checked)}
                  aria-label="Weekly digest"
                  className="data-[state=checked]:bg-primary"
                />
              }
            />
          </SettingsSection>
        </div>
      </div>
    </SettingsShell>
  );
};

export default SettingsNotificationsScreen;
