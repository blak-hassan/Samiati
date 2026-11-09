"use client";

import React, { useState } from 'react';
import { Database, Download, Image as ImageIcon, Trash2, Wifi } from 'lucide-react';
import { useConvex } from 'convex/react';
import { Switch } from '@/components/ui/switch';
import SettingsRow from '@/components/settings/SettingsRow';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsShell from '@/components/settings/SettingsShell';
import RestoreDefaultsButton, {
  useChangedLabels,
} from '@/components/settings/RestoreDefaultsButton';
import { useSettings } from '@/hooks/useSettings';
import { DeviceSettingKey } from '@/lib/settings';
import { api } from '../../../convex/_generated/api';

interface Props {
  /**
   * Hands account deletion to the identity provider, which owns the sign-in
   * identity as well as the Samiati data.
   */
  onDeleteAccount?: () => void;
}

/**
 * Data and storage settings.
 *
 * Previously local `useState` — these toggles were lost on every refresh.
 * They are now part of the persisted device settings.
 *
 * The "export my data" action uses the `exportUserData` query that already
 * existed on the server but had no way to be reached.
 */
const SettingsDataScreen: React.FC<Props> = ({ onDeleteAccount }) => {
  const { settings, updateSetting, resetSetting, resetAll, isChanged } = useSettings();
  const changedLabels = useChangedLabels();
  const convex = useConvex();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const resetKeys = (keys: DeviceSettingKey[]) => {
    keys.forEach((key) => resetSetting(key));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const data = await convex.query(api.users.mutations.exportUserData, {});
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `samiati-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'Could not export your data. Please try again.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SettingsShell
      title="Data & Storage"
      activeSection="data"
      headerAction={
        <RestoreDefaultsButton changedLabels={changedLabels} onRestore={() => resetAll()} />
      }
    >
      <div className="space-y-8">
        <SettingsSection title="Usage">
          <SettingsRow
            id="data.dataSaver"
            title="Data saver"
            description="Reduce image quality and stop autoplay on mobile data"
            icon={<Wifi className="w-5 h-5" />}
            changed={isChanged('dataSaver')}
            onReset={() => resetKeys(['dataSaver'])}
            control={
              <Switch
                checked={settings.dataSaver}
                onCheckedChange={(checked) => updateSetting('dataSaver', checked)}
                aria-label="Data saver"
                className="data-[state=checked]:bg-primary"
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="Media quality">
          <SettingsRow
            id="data.highQualityUploads"
            title="High quality uploads"
            description="Upload photos and videos in higher resolution"
            icon={<ImageIcon className="w-5 h-5" />}
            changed={isChanged('highQualityUploads')}
            onReset={() => resetKeys(['highQualityUploads'])}
            control={
              <Switch
                checked={settings.highQualityUploads}
                onCheckedChange={(checked) => updateSetting('highQualityUploads', checked)}
                aria-label="High quality uploads"
                className="data-[state=checked]:bg-primary"
              />
            }
          />
          <SettingsRow
            id="data.autoDownloadMedia"
            title="Auto-download media"
            description="Automatically download photos on mobile data"
            icon={<Download className="w-5 h-5" />}
            changed={isChanged('autoDownloadMedia')}
            onReset={() => resetKeys(['autoDownloadMedia'])}
            control={
              <Switch
                checked={settings.autoDownloadMedia}
                onCheckedChange={(checked) => updateSetting('autoDownloadMedia', checked)}
                aria-label="Auto-download media"
                className="data-[state=checked]:bg-primary"
              />
            }
          />
        </SettingsSection>

        <SettingsSection
          title="Your data"
          description="Take a copy of everything Samiati holds about you, or close your account."
        >
          <SettingsRow
            id="data.export"
            title="Export my data"
            description={
              exportError ??
              'Download a JSON copy of your profile, posts, comments and saved content.'
            }
            icon={<Database className="w-5 h-5" />}
            onClick={handleExport}
            control={
              <span className="text-xs font-bold text-primary">
                {isExporting ? 'Preparing…' : 'Export'}
              </span>
            }
          />
          {onDeleteAccount ? (
            <SettingsRow
              id="data.delete"
              title="Delete account"
              description="Permanently remove your account and all of its data"
              icon={<Trash2 className="w-5 h-5" />}
              tone="danger"
              onClick={onDeleteAccount}
            />
          ) : null}
        </SettingsSection>
      </div>
    </SettingsShell>
  );
};

export default SettingsDataScreen;
