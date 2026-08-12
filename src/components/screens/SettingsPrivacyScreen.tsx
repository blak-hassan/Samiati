"use client";

import React, { useState } from 'react';
import { Screen } from '@/types';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronRight, Eye, EyeOff, Ban, VolumeX, Database } from "lucide-react";

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
}

const SettingsPrivacyScreen: React.FC<Props> = ({ navigate, goBack }) => {
  const [privateAccount, setPrivateAccount] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <header className="flex items-center px-4 h-14 sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground ml-2 tracking-tight">Privacy</h1>
      </header>

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
              <Switch checked={privateAccount} onCheckedChange={setPrivateAccount} className="data-[state=checked]:bg-primary" />
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
              <Switch checked={onlineStatus} onCheckedChange={setOnlineStatus} className="data-[state=checked]:bg-primary" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <EyeOff className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Read Receipts</p>
                  <p className="text-xs text-muted-foreground">Show when you&apos;ve read messages</p>
                </div>
              </div>
              <Switch checked={readReceipts} onCheckedChange={setReadReceipts} className="data-[state=checked]:bg-primary" />
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
