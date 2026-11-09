"use client";

import React from 'react';
import { Ban } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsShell from '@/components/settings/SettingsShell';
import { useSettings } from '@/hooks/useSettings';

/**
 * Blocked accounts.
 *
 * The list used to be hard-coded mock data in component state. It is now part
 * of the persisted device settings, so blocks actually stick.
 */
const SettingsBlockedScreen: React.FC = () => {
  const { settings, updateSetting } = useSettings();
  const blockedUsers = settings.blockedUsers;

  const handleUnblock = (id: string) => {
    updateSetting(
      'blockedUsers',
      blockedUsers.filter((user) => user.id !== id)
    );
  };

  return (
    <SettingsShell title="Blocked accounts" activeSection="privacy">
      <div className="space-y-6">
        <SettingsSection title={`Blocked (${blockedUsers.length})`}>
          {blockedUsers.length > 0 ? (
            blockedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.handle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnblock(user.id)}
                  className="shrink-0 px-3 py-1.5 bg-muted/60 hover:bg-muted text-foreground text-xs font-bold rounded-lg transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
              <Ban className="w-9 h-9 mb-2 opacity-50" />
              <p className="text-sm">You haven&apos;t blocked anyone yet.</p>
            </div>
          )}
        </SettingsSection>

        <p className="text-xs text-muted-foreground px-2 leading-relaxed">
          Blocked accounts will not be able to see your profile, posts, or message you. They will
          not be notified that you blocked them.
        </p>
      </div>
    </SettingsShell>
  );
};

export default SettingsBlockedScreen;
