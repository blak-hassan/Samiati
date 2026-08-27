"use client";

import React, { useState } from 'react';
import { Screen } from '@/types';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, MessageCircle, Shield, Mail } from "lucide-react";

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
}

const SettingsNotificationsScreen: React.FC<Props> = ({ goBack }) => {
  const [pauseAll, setPauseAll] = useState(false);
  const [changa, setChanga] = useState(true);
  const [moderation, setModeration] = useState(true);
  const [sessions, setSessions] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <header className="flex items-center px-4 h-14 sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground ml-2 tracking-tight">Notifications</h1>
      </header>

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
            <Switch checked={pauseAll} onCheckedChange={setPauseAll} className="data-[state=checked]:bg-primary" />
          </div>
        </div>

        {/* Notification Categories */}
        <div className={`transition-opacity duration-300 ${pauseAll ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
              <Switch checked={changa} onCheckedChange={setChanga} className="data-[state=checked]:bg-primary" />
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Moderation</p>
                  <p className="text-xs text-muted-foreground">Review requests and alerts</p>
                </div>
              </div>
              <Switch checked={moderation} onCheckedChange={setModeration} className="data-[state=checked]:bg-primary" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Sessions</p>
                  <p className="text-xs text-muted-foreground">Saved content updates</p>
                </div>
              </div>
              <Switch checked={sessions} onCheckedChange={setSessions} className="data-[state=checked]:bg-primary" />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className={`transition-opacity duration-300 ${pauseAll ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
              <Switch checked={emailDigest} onCheckedChange={setEmailDigest} className="data-[state=checked]:bg-primary" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsNotificationsScreen;
