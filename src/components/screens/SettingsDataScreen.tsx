"use client";

import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Wifi, Image as ImageIcon, Download, Info, Trash2 } from "lucide-react";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/hooks/useToast";

interface Props {
  goBack: () => void;
}

const SettingsDataScreen: React.FC<Props> = ({ goBack }) => {
  const { toast } = useToast();
  const updatePrivacyMutation = useMutation(api.users.mutations.updatePrivacy);
  const exportDataQuery = useQuery(api.users.mutations.exportUserData, {});

  const [dataSaver, setDataSaver] = useState(false);
  const [highQuality, setHighQuality] = useState(true);
  const [autoDownload, setAutoDownload] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const persistPrivacy = async (updates: Record<string, boolean>) => {
    setSaving(true);
    try {
      await updatePrivacyMutation(updates);
      toast("Settings saved", "success");
    } catch {
      toast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDataSaver = async (val: boolean) => {
    setDataSaver(val);
    await persistPrivacy({ voiceDataAllowed: val, culturalDataAllowed: val });
  };

  const handleHighQuality = async (val: boolean) => {
    setHighQuality(val);
    await persistPrivacy({ culturalDataAllowed: val });
  };

  const handleAutoDownload = async (val: boolean) => {
    setAutoDownload(val);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportDataQuery;
      if (!data) {
        toast("Failed to load data for export.", "error");
        setIsExporting(false);
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `samiati-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("Data exported successfully", "success");
    } catch {
      toast("Failed to export data. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <SettingsPageHeader title="Data & Privacy" onBack={goBack} />

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
              <div className="flex items-center gap-2">
                {saving && <span className="text-[10px] text-muted-foreground">Saving...</span>}
                <Switch checked={dataSaver} onCheckedChange={handleDataSaver} className="data-[state=checked]:bg-primary" aria-label="Data Saver" />
              </div>
            </div>
          </div>
        </div>

        {dataSaver && (
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center gap-3">
            <Info className="w-4 h-4 text-primary" />
            <p className="text-xs text-foreground">Data Saver is active — images are compressed and autoplay is disabled.</p>
          </div>
        )}

        {/* Media Quality */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-2">Media Quality</h3>
          <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">High Quality Uploads</p>
                  <p className="text-xs text-muted-foreground">Upload photos and videos in higher resolution</p>
                </div>
              </div>
              <Switch checked={highQuality} onCheckedChange={handleHighQuality} className="data-[state=checked]:bg-primary" aria-label="High quality uploads" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Auto-download Media</p>
                  <p className="text-xs text-muted-foreground">Automatically download photos on mobile data</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {saving && <span className="text-[10px] text-muted-foreground">Saving...</span>}
                <Switch checked={autoDownload} onCheckedChange={handleAutoDownload} className="data-[state=checked]:bg-primary" aria-label="Auto-download media" />
              </div>
            </div>
          </div>
        </div>

        {/* Data Rights */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 ml-2">Your Data</h3>
          <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden">
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 group"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Download My Data</p>
                  <p className="text-xs text-muted-foreground">Export all your data (GDPR)</p>
                </div>
              </div>
              {isExporting ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Export</span>
              )}
            </button>
            <button
              onClick={() => toast("Account deletion is managed in Account Settings", "info")}
              className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 transition-colors text-destructive group"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5" />
                <div>
                  <p className="font-medium text-foreground">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently remove all your data</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-destructive transition-colors">Account</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsDataScreen;
