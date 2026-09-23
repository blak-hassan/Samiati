"use client";

import React, { useEffect, useState } from 'react';
import { Screen, NavigateFn } from '@/types';
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Database, Mic, Globe } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/useToast";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import SettingsRow from "@/components/settings/SettingsRow";
import SettingsGroup from "@/components/settings/SettingsGroup";

interface Props {
  navigate: NavigateFn;
}

const SettingsPrivacyScreen: React.FC<Props> = ({ navigate }) => {
  const { toast } = useToast();
  const { settings, saving, updateSetting } = useSettings({
    onlineStatus: true,
    readReceipts: true,
  });

  const profile = useQuery(api.users.queries.getProfile, {});
  const updatePrivacyMutation = useMutation(api.users.mutations.updatePrivacy);
  const [privateAccount, setPrivateAccountState] = useState(false);
  const [voiceDataAllowed, setVoiceDataAllowed] = useState(true);
  const [culturalDataAllowed, setCulturalDataAllowed] = useState(true);

  useEffect(() => {
    if (profile?.profileVisible !== undefined) {
      setPrivateAccountState(profile.profileVisible === false);
    }
    if (profile?.voiceDataAllowed !== undefined) setVoiceDataAllowed(!!profile.voiceDataAllowed);
    if (profile?.culturalDataAllowed !== undefined) setCulturalDataAllowed(!!profile.culturalDataAllowed);
  }, [profile?.profileVisible, profile?.voiceDataAllowed, profile?.culturalDataAllowed]);

  const setPrivateAccount = async (val: boolean) => {
    setPrivateAccountState(val);
    try {
      await updatePrivacyMutation({ profileVisible: !val });
      toast(val ? "Private account enabled" : "Private account disabled", "success");
    } catch {
      setPrivateAccountState(!val);
      toast("Couldn't update privacy", "error");
    }
  };
  const setVoice = async (val: boolean) => {
    const prev = voiceDataAllowed;
    setVoiceDataAllowed(val);
    try {
      await updatePrivacyMutation({ voiceDataAllowed: val });
      toast("Voice data setting updated", "success");
    } catch {
      setVoiceDataAllowed(prev);
      toast("Couldn't update privacy", "error");
    }
  };
  const setCultural = async (val: boolean) => {
    const prev = culturalDataAllowed;
    setCulturalDataAllowed(val);
    try {
      await updatePrivacyMutation({ culturalDataAllowed: val });
      toast("Cultural data setting updated", "success");
    } catch {
      setCulturalDataAllowed(prev);
      toast("Couldn't update privacy", "error");
    }
  };
  const setOnlineStatus = async (val: boolean) => { await updateSetting("onlineStatus", val); toast("Online status updated", "success"); };
  const setReadReceipts = async (val: boolean) => { await updateSetting("readReceipts", val); toast("Read receipts updated", "success"); };

  return (
    <div className="space-y-6">
      <SettingsGroup
        title="Account privacy"
        description="Control who can see your profile and contributions."
      >
        <div className="flex items-center justify-between px-4 min-h-14">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Private account</p>
              <p className="text-xs text-muted-foreground font-medium">Only approved followers can see your posts</p>
            </div>
          </div>
          <Switch checked={privateAccount} onCheckedChange={setPrivateAccount} className="data-[state=checked]:bg-primary shrink-0" aria-label="Private account" />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Activity status">
        <div className="flex items-center justify-between px-4 min-h-14 border-b border-border/60">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Show online status</p>
              <p className="text-xs text-muted-foreground font-medium">Let others see when you&apos;re active</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saving && <span className="text-[10px] text-muted-foreground">Saving…</span>}
            <Switch checked={settings.onlineStatus ?? true} onCheckedChange={setOnlineStatus} className="data-[state=checked]:bg-primary" aria-label="Show online status" />
          </div>
        </div>
        <div className="flex items-center justify-between px-4 min-h-14">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <EyeOff className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Read receipts</p>
              <p className="text-xs text-muted-foreground font-medium">Show when you&apos;ve read messages</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saving && <span className="text-[10px] text-muted-foreground">Saving…</span>}
            <Switch checked={settings.readReceipts ?? true} onCheckedChange={setReadReceipts} className="data-[state=checked]:bg-primary" aria-label="Read receipts" />
          </div>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Data you share" description="Samiati only uses your data to improve your experience.">
        <div className="flex items-center justify-between px-4 min-h-14 border-b border-border/60">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Voice data</p>
              <p className="text-xs text-muted-foreground font-medium">Allow voice recordings to help train Samiati</p>
            </div>
          </div>
          <Switch checked={voiceDataAllowed} onCheckedChange={setVoice} className="data-[state=checked]:bg-primary shrink-0" aria-label="Allow voice data" />
        </div>
        <div className="flex items-center justify-between px-4 min-h-14">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Cultural context</p>
              <p className="text-xs text-muted-foreground font-medium">Allow cultural notes to inform recommendations</p>
            </div>
          </div>
          <Switch checked={culturalDataAllowed} onCheckedChange={setCultural} className="data-[state=checked]:bg-primary shrink-0" aria-label="Allow cultural data" />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Safety">
        <SettingsRow
          icon={<Database className="w-4 h-4" />}
          label="Data settings"
          onClick={() => navigate(Screen.SETTINGS_DATA)}
          requiresPrivacy
        />
      </SettingsGroup>
    </div>
  );
};

export default SettingsPrivacyScreen;
