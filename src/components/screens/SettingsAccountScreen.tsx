"use client";

import React from 'react';
import {
  ChevronRight,
  Fingerprint,
  Key,
  Laptop,
  Mail,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import SettingsRow from '@/components/settings/SettingsRow';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsShell from '@/components/settings/SettingsShell';
import { User } from '@/types';

interface Props {
  user: User;
  /** The signed-in account's email address. */
  email: string | null;
  /** Whether two-factor authentication is active on the account. */
  twoFactorEnabled: boolean;
  /** Opens the identity provider's account panel (email, password, 2FA, delete). */
  onManageAccount: () => void;
  /** Navigates to the change-password screen. */
  onChangePassword: () => void;
}

/**
 * Account settings.
 *
 * The old version showed a hard-coded `user@example.com` and a hard-coded
 * phone number, and its two-factor and delete-account controls did nothing.
 * This version reads the real values from the identity provider and routes
 * every security action to the provider's own account panel, so the actions
 * actually work.
 */
const SettingsAccountScreen: React.FC<Props> = ({
  user,
  email,
  twoFactorEnabled,
  onManageAccount,
  onChangePassword,
}) => {
  return (
    <SettingsShell title="Account" activeSection="account">
      <div className="space-y-8">
        {/* Profile */}
        <div className="bg-muted/20 rounded-2xl border border-border/50 p-4 flex flex-col items-center gap-3">
          <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
            <AvatarImage src={user.avatar} className="object-cover" />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="font-bold text-foreground text-lg">{user.name}</h2>
            <p className="text-muted-foreground text-sm">{user.handle}</p>
          </div>
        </div>

        <SettingsSection title="Account details">
          <SettingsRow
            id="account.username"
            title="Username"
            description={user.handle.replace('@', '')}
            icon={<UserIcon className="w-5 h-5" />}
            onClick={onManageAccount}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
          <SettingsRow
            id="account.email"
            title="Email"
            description={email ?? 'No email address on this account'}
            icon={<Mail className="w-5 h-5" />}
            onClick={onManageAccount}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
        </SettingsSection>

        <SettingsSection title="Security">
          <SettingsRow
            id="account.password"
            title="Change password"
            description="Update the password you sign in with"
            icon={<Key className="w-5 h-5" />}
            onClick={onChangePassword}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
          <SettingsRow
            id="account.twoFactor"
            title="Two-factor authentication"
            description={
              twoFactorEnabled
                ? 'On — a second step is required at sign in'
                : 'Off — add a second step to protect your account'
            }
            icon={<Fingerprint className="w-5 h-5" />}
            onClick={onManageAccount}
            control={
              <span
                className={`text-xs font-bold ${twoFactorEnabled ? 'text-rasta-green' : 'text-muted-foreground'}`}
              >
                {twoFactorEnabled ? 'On' : 'Off'}
              </span>
            }
          />
          <SettingsRow
            id="account.sessions"
            title="Active sessions"
            description="Review and sign out of devices"
            icon={<Laptop className="w-5 h-5" />}
            onClick={onManageAccount}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
        </SettingsSection>

        <SettingsSection title="Danger zone">
          <SettingsRow
            id="account.delete"
            title="Delete account"
            description="Permanently remove your account and all of its data"
            icon={<Trash2 className="w-5 h-5" />}
            tone="danger"
            onClick={onManageAccount}
            control={
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            }
          />
        </SettingsSection>

        <p className="text-xs text-muted-foreground px-2 leading-relaxed">
          Password, two-factor authentication, active sessions and account deletion are handled by
          your identity provider, where they can be verified properly.
        </p>
      </div>
    </SettingsShell>
  );
};

export default SettingsAccountScreen;
