"use client";

import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Bell, MessageCircle, Shield, Mail } from "lucide-react";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/hooks/useToast";

interface Props {
  goBack: () => void;
}

const SettingsNotificationsScreen: React.FC<Props> = ({ goBack }) => {
  const { toast } = useToast();
  const updatePrefsMutation = useMutation(api.users.mutations.updateNotificationPreferences);
  const user = useQuery(api.users.queries.getProfile, {});

  const prefs = user?.notificationPreferences ?? {};
  const saving = false;

  const updatePref = async (key: string, value: boolean) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updatePrefsMutation({ [key]: value } as any);
      toast("Notification preferences updated", "success");
    } catch {
      toast("Failed to update preferences", "error");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <SettingsPageHeader title="Notifications" onBack={goBack} />

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Pause All */}
        <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Pause All</p>
                <p className="text-xs text-muted-foreground">Mute all notifications temporarily</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {saving && <span className="text-[10px] text-muted-foreground">Saving...</span>}
              <Switch checked={prefs.pauseAll ?? false} onCheckedChange={(val) => updatePref("pauseAll", val)} className="data-[state=checked]:bg-primary" aria-label="Pause all notifications" />
            </div>
          </div>
        </div>

        {/* Notification Categories */}
        <div className={`transition-opacity duration-300 ${prefs.pauseAll ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-2">Notification Categories</h3>
          <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Changa</p>
                  <p className="text-xs text-muted-foreground">Contributions and updates</p>
                </div>
              </div>
              <Switch checked={prefs.changa ?? true} onCheckedChange={(val) => updatePref("changa", val)} className="data-[state=checked]:bg-primary" aria-label="Changa notifications" />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Moderation</p>
                  <p className="text-xs text-muted-foreground">Review requests and alerts</p>
                </div>
              </div>
              <Switch checked={prefs.moderation ?? true} onCheckedChange={(val) => updatePref("moderation", val)} className="data-[state=checked]:bg-primary" aria-label="Moderation notifications" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Sessions</p>
                  <p className="text-xs text-muted-foreground">Saved content updates</p>
                </div>
              </div>
              <Switch checked={prefs.sessions ?? true} onCheckedChange={(val) => updatePref("sessions", val)} className="data-[state-checked]:bg-primary" aria-label="Session notifications" />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className={`transition-opacity duration-300 ${prefs.pauseAll ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-2">Email</h3>
          <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Weekly Digest</p>
                  <p className="text-xs text-muted-foreground">Summary of top stories and highlights</p>
                </div>
              </div>
              <Switch checked={prefs.emailDigest ?? false} onCheckedChange={(val) => updatePref("emailDigest", val)} className="data-[state=checked]:bg-primary" aria-label="Weekly email digest" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsNotificationsScreen;
