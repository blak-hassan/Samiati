'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen, User as UserType } from '@/types';
import {
  Ban,
  Bell,
  ChevronRight,
  Database,
  HelpCircle,
  Languages,
  LogOut,
  Palette,
  Scale,
  Shield,
  Sparkles,
  User,
  UserCog,
  VolumeX,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SettingsRow from '@/components/settings/SettingsRow';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsShell from '@/components/settings/SettingsShell';
import SettingsSearch from '@/components/settings/SettingsSearch';
import RestoreDefaultsButton, {
  useChangedLabels,
} from '@/components/settings/RestoreDefaultsButton';
import { useSettings } from '@/hooks/useSettings';

interface Props {
  navigate: (screen: Screen) => void;
  onSignOut: () => void;
  user: UserType;
}

/**
 * The settings index.
 *
 * Borrowed from T3Chat: instead of a flat card list, the index is a searchable
 * directory of every settings area, and each individual setting can be
 * restored to its default in one action.
 */
const SettingsScreen: React.FC<Props> = ({ navigate, onSignOut, user }) => {
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const { resetAll } = useSettings();
  const changedLabels = useChangedLabels();
  const router = useRouter();

  return (
    <SettingsShell
      title="Settings"
      hideRail
      backHref="/dashboard"
      headerAction={
        <RestoreDefaultsButton changedLabels={changedLabels} onRestore={() => resetAll()} />
      }
    >
      <div className="space-y-8">
        {/* Profile Card */}
        <button
          type="button"
          className="w-full text-left flex items-center gap-4 bg-card p-5 rounded-2xl border border-border cursor-pointer hover:bg-secondary/40 transition-colors duration-200 group shadow-none"
          onClick={() => navigate(Screen.PROFILE)}
        >
          <Avatar className="w-14 h-14 rounded-full border-2 border-background shadow-lg">
            <AvatarImage src={user.avatar} alt="" className="object-cover" />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground tracking-tight truncate">
              {user.name}
            </h2>
            <p className="text-xs text-muted-foreground font-medium truncate">{user.handle}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </button>

        <Card className="space-y-3 rounded-2xl border border-ai/30 bg-ai/5 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-ai">
            <Zap className="size-5" />
            <h3 className="text-lg font-semibold">Find your possibilities.</h3>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Explore the proposed Samiati plans. Pricing and included features are being finalized;
            your existing subscription can be managed in Billing.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="min-h-11" onClick={() => router.push('/pricing')}>
              Explore proposed plans
            </Button>
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => router.push('/settings/billing')}
            >
              Billing &amp; subscription
            </Button>
          </div>
        </Card>

        {/* Search — jumps to any individual setting, like T3Chat */}
        <SettingsSearch />

        {/* Account */}
        <SettingsSection title="Account">
          <SettingsRow
            id="section.profile"
            title="Profile"
            description="Your name, bio, picture and languages"
            icon={<UserCog className="w-5 h-5" />}
            onClick={() => router.push('/dashboard/edit-profile')}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
          <SettingsRow
            id="section.account"
            title="Account"
            description="Email, password and two-factor authentication"
            icon={<User className="w-5 h-5" />}
            onClick={() => navigate(Screen.SETTINGS_ACCOUNT)}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
          <SettingsRow
            id="section.notifications"
            title="Notifications"
            description="Push, email and in-app alerts"
            icon={<Bell className="w-5 h-5" />}
            onClick={() => navigate(Screen.SETTINGS_NOTIFICATIONS)}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
          <SettingsRow
            id="section.privacy"
            title="Privacy & Safety"
            description="Visibility, consent, blocked and muted accounts"
            icon={<Shield className="w-5 h-5" />}
            onClick={() => navigate(Screen.SETTINGS_PRIVACY)}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title="Preferences">
          <SettingsRow
            id="section.appearance"
            title="Appearance"
            description="Theme, accent colour, text size and layout"
            icon={<Palette className="w-5 h-5" />}
            onClick={() => navigate(Screen.SETTINGS_APPEARANCE)}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
          <SettingsRow
            id="section.data"
            title="Data & Storage"
            description="Data saver, media quality and exports"
            icon={<Database className="w-5 h-5" />}
            onClick={() => navigate(Screen.SETTINGS_DATA)}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
          <SettingsRow
            id="section.languages"
            title="Languages"
            description="The languages you are learning and contributing in"
            icon={<Languages className="w-5 h-5" />}
            onClick={() => navigate(Screen.MANAGE_LANGUAGES)}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
          <SettingsRow
            id="section.muted"
            title="Muted words"
            description="Hide posts that contain words you mute"
            icon={<VolumeX className="w-5 h-5" />}
            onClick={() => navigate(Screen.SETTINGS_MUTED)}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
          <SettingsRow
            id="section.blocked"
            title="Blocked accounts"
            description="People who can no longer see or contact you"
            icon={<Ban className="w-5 h-5" />}
            onClick={() => navigate(Screen.SETTINGS_BLOCKED)}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
        </SettingsSection>

        {/* Support & legal */}
        <SettingsSection title="Support">
          <SettingsRow
            id="section.help"
            title="Help & Support"
            description="FAQ, contact and feedback"
            icon={<HelpCircle className="w-5 h-5" />}
            onClick={() => navigate(Screen.SETTINGS_HELP)}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
          <SettingsRow
            id="section.privacy-policy"
            title="Privacy Policy"
            description="How your data is collected and used"
            icon={<Scale className="w-5 h-5" />}
            onClick={() => router.push('/dashboard/privacy-policy')}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
          <SettingsRow
            id="section.terms"
            title="Terms of Service"
            description="The agreement that governs your use of Samiati"
            icon={<Sparkles className="w-5 h-5" />}
            onClick={() => router.push('/dashboard/terms-of-service')}
            control={
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            }
          />
        </SettingsSection>

        {/* Sign Out */}
        <div className="pt-2">
          <Button
            variant="ghost"
            onClick={() => setShowSignOutDialog(true)}
            className="w-full h-12 rounded-2xl bg-destructive/5 text-destructive font-bold text-sm hover:bg-destructive/10 transition-all border border-destructive/10 active:scale-95 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of Samiati?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your account and saved content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onSignOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsShell>
  );
};

export default SettingsScreen;
