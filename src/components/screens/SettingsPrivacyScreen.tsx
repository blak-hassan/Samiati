"use client";

import React from 'react';
import { Screen, NavigateFn } from '@/types';
import { Switch } from "@/components/ui/switch";
import { ChevronRight, Eye, EyeOff, Ban, VolumeX, Database } from "lucide-react";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/useToast";

interface Props {
  navigate: NavigateFn;
  goBack: () => void;
}

const SettingsPrivacyScreen: React.FC<Props> = ({ navigate, goBack }) => {
  const { toast } = useToast();
  const { settings, saving, updateSetting } = useSettings({
    privateAccount: false,
    onlineStatus: true,
    readReceipts: true,
  });

  const setPrivateAccount = async (val: boolean) => { await updateSetting("privateAccount", val); toast(val ? "Private account enabled" : "Private account disabled", "success"); };
  const setOnlineStatus = async (val: boolean) => { await updateSetting("onlineStatus", val); toast("Online status updated", "success"); };
  const setReadReceipts = async (val: boolean) => { await updateSetting("readReceipts", val); toast("Read receipts updated", "success"); };

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <SettingsPageHeader title="Privacy" onBack={goBack} />

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Account Privacy */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-2">Account Privacy</h3>
          <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Private Account</p>
                  <p className="text-xs text-muted-foreground">Only approved followers can see your posts</p>
                </div>
              </div>
              <Switch checked={settings.privateAccount ?? false} onCheckedChange={setPrivateAccount} className="data-[state=checked]:bg-primary" aria-label="Private account" />
            </div>
          </div>
        </div>

        {/* Activity Status */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-2">Activity Status</h3>
          <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Show Online Status</p>
                  <p className="text-xs text-muted-foreground">Let others see when you&apos;re active</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {saving && <span className="text-[10px] text-muted-foreground">Saving...</span>}
                <Switch checked={settings.onlineStatus ?? true} onCheckedChange={setOnlineStatus} className="data-[state=checked]:bg-primary" aria-label="Show online status" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <EyeOff className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Read Receipts</p>
                  <p className="text-xs text-muted-foreground">Show when you&apos;ve read messages</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {saving && <span className="text-[10px] text-muted-foreground">Saving...</span>}
                <Switch checked={settings.readReceipts ?? true} onCheckedChange={setReadReceipts} className="data-[state=checked]:bg-primary" aria-label="Read receipts" />
              </div>
            </div>
          </div>
        </div>

        {/* Safety */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-2">Safety</h3>
          <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
            <button onClick={() => navigate(Screen.SETTINGS_BLOCKED)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 group">
              <div className="flex items-center gap-3">
                <Ban className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Blocked Accounts</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </button>
            <button onClick={() => navigate(Screen.SETTINGS_MUTED)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 group">
              <div className="flex items-center gap-3">
                <VolumeX className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Muted Words</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </button>
            <button onClick={() => navigate(Screen.SETTINGS_DATA)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors last:border-0 group">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Data Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPrivacyScreen;
