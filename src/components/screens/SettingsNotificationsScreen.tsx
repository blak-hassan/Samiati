"use client";

import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Bell, MessageCircle, Shield, Mail } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/hooks/useToast";
import { Screen } from "@/types";
import SettingsGroup from "@/components/settings/SettingsGroup";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
}

const SettingsNotificationsScreen: React.FC<Props> = ({ navigate, goBack }) => {
  const { toast } = useToast();
  const updatePrefsMutation = useMutation(api.users.mutations.updateNotificationPreferences);
  const user = useQuery(api.users.queries.getProfile, {});

  const prefs = user?.notificationPreferences ?? {};
  const [saving, setSaving] = useState(false);

  const updatePref = async (key: string, value: boolean) => {
    setSaving(true);
    try {
      await updatePrefsMutation({ [key]: value } as any);
      toast("Notification preferences updated", "success");
    } catch {
      toast("Failed to update preferences", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SettingsPageHeader title="Notifications" onBack={goBack} />
      <main>
        <div className="space-y-6">
      <SettingsGroup title="Mute" description="Pause everything, or pick what you want to hear about.">
        <div className="flex items-center justify-between px-4 min-h-14">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Pause all</p>
              <p className="text-xs text-muted-foreground font-medium">Mute all notifications temporarily</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saving && <span className="text-[10px] text-muted-foreground">Saving…</span>}
            <Switch checked={prefs.pauseAll ?? false} onCheckedChange={(val) => updatePref("pauseAll", val)} className="data-[state=checked]:bg-primary" aria-label="Pause all notifications" />
          </div>
        </div>
      </SettingsGroup>

      <div className={prefs.pauseAll ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
        <SettingsGroup title="Categories">
          <div className="flex items-center justify-between px-4 min-h-14 border-b border-border/60">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">Changa</p>
                <p className="text-xs text-muted-foreground font-medium">Contributions and updates</p>
              </div>
            </div>
            <Switch checked={prefs.changa ?? true} onCheckedChange={(val) => updatePref("changa", val)} className="data-[state=checked]:bg-primary shrink-0" aria-label="Changa notifications" />
          </div>
          <div className="flex items-center justify-between px-4 min-h-14 border-b border-border/60">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">Moderation</p>
                <p className="text-xs text-muted-foreground font-medium">Review requests and alerts</p>
              </div>
            </div>
            <Switch checked={prefs.moderation ?? true} onCheckedChange={(val) => updatePref("moderation", val)} className="data-[state=checked]:bg-primary shrink-0" aria-label="Moderation notifications" />
          </div>
          <div className="flex items-center justify-between px-4 min-h-14">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">Sessions</p>
                <p className="text-xs text-muted-foreground font-medium">Saved content updates</p>
              </div>
            </div>
            <Switch checked={prefs.sessions ?? true} onCheckedChange={(val) => updatePref("sessions", val)} className="data-[state=checked]:bg-primary shrink-0" aria-label="Session notifications" />
          </div>
        </SettingsGroup>

        <SettingsGroup title="Email">
          <div className="flex items-center justify-between px-4 min-h-14">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">Weekly digest</p>
                <p className="text-xs text-muted-foreground font-medium">Summary of top stories and highlights</p>
              </div>
            </div>
            <Switch checked={prefs.emailDigest ?? false} onCheckedChange={(val) => updatePref("emailDigest", val)} className="data-[state=checked]:bg-primary shrink-0" aria-label="Weekly email digest" />
          </div>
        </SettingsGroup>
      </div>
        </div>
        </main>
    </>
  );
};

export default SettingsNotificationsScreen;
