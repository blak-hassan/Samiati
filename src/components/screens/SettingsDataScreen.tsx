"use client";

import React, { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Wifi, Image as ImageIcon, Download, Info, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/hooks/useToast";
import { useSettings } from "@/hooks/useSettings";
import SettingsRow from "@/components/settings/SettingsRow";
import SettingsGroup from "@/components/settings/SettingsGroup";
import { Screen, NavigateFn } from "@/types";

interface Props {
  navigate: NavigateFn;
}

const SettingsDataScreen: React.FC<Props> = ({ navigate }) => {
  const { toast } = useToast();
  const updatePrivacyMutation = useMutation(api.users.mutations.updatePrivacy);
  const exportDataQuery = useQuery(api.users.mutations.exportUserData, {});

  const { settings: persistedSettings, updateSetting: updatePersistedSetting } = useSettings();

  const [dataSaver, setDataSaver] = useState(false);
  const [highQuality, setHighQuality] = useState(true);
  const [autoDownload, setAutoDownload] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  React.useEffect(() => {
    if (persistedSettings.autoDownload !== undefined) {
      setAutoDownload(persistedSettings.autoDownload);
    }
  }, [persistedSettings.autoDownload]);

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
    await updatePersistedSetting("dataSaver", val);
  };

  const handleHighQuality = async (val: boolean) => {
    setHighQuality(val);
    await updatePersistedSetting("highQuality", val);
  };

  const handleAutoDownload = async (val: boolean) => {
    setAutoDownload(val);
    await updatePersistedSetting("autoDownload", val);
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
    <div className="space-y-6">
      <SettingsGroup title="Usage">
        <div className="flex items-center justify-between px-4 min-h-14">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Data Saver</p>
              <p className="text-xs text-muted-foreground font-medium">Reduce image quality and stop autoplay</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saving && <span className="text-[10px] text-muted-foreground">Saving…</span>}
            <Switch checked={dataSaver} onCheckedChange={handleDataSaver} className="data-[state=checked]:bg-primary" aria-label="Data Saver" />
          </div>
        </div>
      </SettingsGroup>

      {dataSaver && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center gap-3">
          <Info className="w-4 h-4 text-primary" />
          <p className="text-xs text-foreground">Data Saver is active — images are compressed and autoplay is disabled.</p>
        </div>
      )}

      <SettingsGroup title="Media quality">
        <div className="flex items-center justify-between px-4 min-h-14 border-b border-border/60">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">High quality uploads</p>
              <p className="text-xs text-muted-foreground font-medium">Upload photos and videos in higher resolution</p>
            </div>
          </div>
          <Switch checked={highQuality} onCheckedChange={handleHighQuality} className="data-[state=checked]:bg-primary shrink-0" aria-label="High quality uploads" />
        </div>
        <div className="flex items-center justify-between px-4 min-h-14">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Auto-download media</p>
              <p className="text-xs text-muted-foreground font-medium">Automatically download photos on mobile data</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saving && <span className="text-[10px] text-muted-foreground">Saving…</span>}
            <Switch checked={autoDownload} onCheckedChange={handleAutoDownload} className="data-[state=checked]:bg-primary shrink-0" aria-label="Auto-download media" />
          </div>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Your data">
        <SettingsRow
          icon={<Download className="w-4 h-4" />}
          iconClassName="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
          label="Download my data"
          description="Export all your data (GDPR)"
          trailing={isExporting ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : undefined}
          onClick={handleExportData}
          requiresPrivacy
        />
        <SettingsRow
          icon={<Trash2 className="w-4 h-4" />}
          label="Delete account"
          description="Permanently remove all your data"
          destructive
          onClick={() => navigate(Screen.SETTINGS_ACCOUNT)}
          requiresPrivacy
        />
      </SettingsGroup>
    </div>
  );
};

export default SettingsDataScreen;

