"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Wifi, Image, Download } from "lucide-react";

interface Props {
  goBack: () => void;
}

const SettingsDataScreen: React.FC<Props> = ({ goBack }) => {
  const [dataSaver, setDataSaver] = useState(false);
  const [highQuality, setHighQuality] = useState(true);
  const [autoDownload, setAutoDownload] = useState(true);

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <header className="flex items-center px-4 h-14 sticky top-0 bg-background/95 backdrop-blur-md z-30 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full" aria-label="Go back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground ml-2 tracking-tight">Data Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Usage */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-2">Usage</h3>
          <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Data Saver</p>
                  <p className="text-xs text-muted-foreground">Reduce image quality and stop autoplay</p>
                </div>
              </div>
              <Switch checked={dataSaver} onCheckedChange={setDataSaver} className="data-[state=checked]:bg-primary" />
            </div>
          </div>
        </div>

        {/* Media Quality */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-2">Media Quality</h3>
          <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <Image className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">High Quality Uploads</p>
                  <p className="text-xs text-muted-foreground">Upload photos and videos in higher resolution</p>
                </div>
              </div>
              <Switch checked={highQuality} onCheckedChange={setHighQuality} className="data-[state=checked]:bg-primary" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Auto-download Media</p>
                  <p className="text-xs text-muted-foreground">Automatically download photos on mobile data</p>
                </div>
              </div>
              <Switch checked={autoDownload} onCheckedChange={setAutoDownload} className="data-[state=checked]:bg-primary" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsDataScreen;
