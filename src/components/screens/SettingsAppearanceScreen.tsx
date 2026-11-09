"use client";

import React from 'react';
import {
  AlignLeft,
  CaseSensitive,
  Clock,
  Contrast,
  Languages,
  MessageSquare,
  Palette,
  Send,
  Sparkles,
  Type,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import SettingsRow from '@/components/settings/SettingsRow';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsSelect from '@/components/settings/SettingsSelect';
import SettingsShell from '@/components/settings/SettingsShell';
import RestoreDefaultsButton, {
  useChangedLabels,
} from '@/components/settings/RestoreDefaultsButton';
import { useSettings } from '@/hooks/useSettings';
import {
  ACCENT_LABELS,
  CHAT_WIDTH_LABELS,
  DeviceSettingKey,
  TEXT_SIZE_LABELS,
  THEME_LABELS,
  TIME_FORMAT_LABELS,
} from '@/lib/settings';

const THEME_OPTIONS = (Object.keys(THEME_LABELS) as (keyof typeof THEME_LABELS)[]).map((value) => ({
  value,
  label: THEME_LABELS[value],
}));

const ACCENT_OPTIONS = (Object.keys(ACCENT_LABELS) as (keyof typeof ACCENT_LABELS)[]).map(
  (value) => ({ value, label: ACCENT_LABELS[value] })
);

const TEXT_SIZE_OPTIONS = (
  Object.keys(TEXT_SIZE_LABELS) as (keyof typeof TEXT_SIZE_LABELS)[]
).map((value) => ({ value, label: TEXT_SIZE_LABELS[value] }));

const CHAT_WIDTH_OPTIONS = (
  Object.keys(CHAT_WIDTH_LABELS) as (keyof typeof CHAT_WIDTH_LABELS)[]
).map((value) => ({ value, label: CHAT_WIDTH_LABELS[value] }));

const TIME_FORMAT_OPTIONS = (
  Object.keys(TIME_FORMAT_LABELS) as (keyof typeof TIME_FORMAT_LABELS)[]
).map((value) => ({ value, label: TIME_FORMAT_LABELS[value] }));

/**
 * Appearance settings.
 *
 * Samiati previously had a single "Dark Mode" switch on the settings index
 * that was lost on refresh. T3Chat treats appearance as a first-class section
 * (theme, accent, contrast, type scale, layout) — this mirrors that.
 */
const SettingsAppearanceScreen: React.FC = () => {
  const { settings, updateSetting, resetSetting, resetAll, isChanged, changedKeys } = useSettings();
  const changedLabels = useChangedLabels();

  const resetKeys = (keys: DeviceSettingKey[]) => {
    keys.forEach((key) => resetSetting(key));
  };

  return (
    <SettingsShell
      title="Appearance"
      activeSection="appearance"
      headerAction={
        <RestoreDefaultsButton changedLabels={changedLabels} onRestore={() => resetAll()} />
      }
    >
      <div className="space-y-8">
        <SettingsSection title="Theme" description="How Samiati looks on this device">
          <SettingsRow
            id="appearance.theme"
            title="Theme"
            description="Light, dark, or follow your system setting"
            icon={<Palette className="w-5 h-5" />}
            changed={isChanged('theme')}
            onReset={() => resetKeys(['theme'])}
            control={
              <SettingsSelect
                label="Theme"
                value={settings.theme}
                onValueChange={(value) => updateSetting('theme', value)}
                options={THEME_OPTIONS}
              />
            }
          />
          <SettingsRow
            id="appearance.accent"
            title="Accent colour"
            description="Highlight colour used across buttons, links and highlights"
            icon={<Sparkles className="w-5 h-5" />}
            changed={isChanged('accent')}
            onReset={() => resetKeys(['accent'])}
            control={
              <SettingsSelect
                label="Accent colour"
                value={settings.accent}
                onValueChange={(value) => updateSetting('accent', value)}
                options={ACCENT_OPTIONS}
              />
            }
          />
          <SettingsRow
            id="appearance.textSize"
            title="Text size"
            description="Scale type across the whole app"
            icon={<Type className="w-5 h-5" />}
            changed={isChanged('textSize')}
            onReset={() => resetKeys(['textSize'])}
            control={
              <SettingsSelect
                label="Text size"
                value={settings.textSize}
                onValueChange={(value) => updateSetting('textSize', value)}
                options={TEXT_SIZE_OPTIONS}
              />
            }
          />
          <SettingsRow
            id="appearance.chatWidth"
            title="Chat width"
            description="How wide conversation bubbles are allowed to grow"
            icon={<AlignLeft className="w-5 h-5" />}
            changed={isChanged('chatWidth')}
            onReset={() => resetKeys(['chatWidth'])}
            control={
              <SettingsSelect
                label="Chat width"
                value={settings.chatWidth}
                onValueChange={(value) => updateSetting('chatWidth', value)}
                options={CHAT_WIDTH_OPTIONS}
              />
            }
          />
        </SettingsSection>

<SettingsSection title="Accessibility">
          <SettingsRow
            id="appearance.highContrast"
            title="High contrast"
            description="Stronger borders and text contrast"
            icon={<Contrast className="w-5 h-5" />}
            changed={isChanged('highContrast')}
            onReset={() => resetKeys(['highContrast'])}
            control={
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                aria-label="High contrast"
                className="data-[state=checked]:bg-primary"
              />
            }
          />
          <SettingsRow
            id="appearance.reduceMotion"
            title="Reduce motion"
            description="Minimise animations and transitions across the app"
            icon={<CaseSensitive className="w-5 h-5" />}
            changed={isChanged('reduceMotion')}
            onReset={() => resetKeys(['reduceMotion'])}
            control={
              <Switch
                checked={settings.reduceMotion}
                onCheckedChange={(checked) => updateSetting('reduceMotion', checked)}
                aria-label="Reduce motion"
                className="data-[state=checked]:bg-primary"
              />
            }
          />
        </SettingsSection>

        <SettingsSection
          title="Chat & translation"
          description="How messages behave while you chat"
          advanced
        >
          <SettingsRow
            id="appearance.showTimestamps"
            title="Show timestamps"
            description="Display the time next to each message"
            icon={<MessageSquare className="w-5 h-5" />}
            changed={isChanged('showTimestamps')}
            onReset={() => resetKeys(['showTimestamps'])}
            control={
              <Switch
                checked={settings.showTimestamps}
                onCheckedChange={(checked) => updateSetting('showTimestamps', checked)}
                aria-label="Show timestamps"
                className="data-[state=checked]:bg-primary"
              />
            }
          />
          <SettingsRow
            id="appearance.timeFormat"
            title="Time format"
            description="Show times as 12-hour or 24-hour clock"
            icon={<Clock className="w-5 h-5" />}
            changed={isChanged('timeFormat')}
            onReset={() => resetKeys(['timeFormat'])}
            control={
              <SettingsSelect
                label="Time format"
                value={settings.timeFormat}
                onValueChange={(value) => updateSetting('timeFormat', value)}
                options={TIME_FORMAT_OPTIONS}
              />
            }
          />
          <SettingsRow
            id="appearance.autoTranslate"
            title="Auto-translate replies"
            description="Translate incoming messages without tapping translate"
            icon={<Languages className="w-5 h-5" />}
            changed={isChanged('autoTranslate')}
            onReset={() => resetKeys(['autoTranslate'])}
            control={
              <Switch
                checked={settings.autoTranslate}
                onCheckedChange={(checked) => updateSetting('autoTranslate', checked)}
                aria-label="Auto-translate replies"
                className="data-[state=checked]:bg-primary"
              />
            }
          />
          <SettingsRow
            id="appearance.sendOnEnter"
            title="Send with Enter"
            description="Press Enter to send, Shift + Enter for a new line"
            icon={<Send className="w-5 h-5" />}
            changed={isChanged('sendOnEnter')}
            onReset={() => resetKeys(['sendOnEnter'])}
            control={
              <Switch
                checked={settings.sendOnEnter}
                onCheckedChange={(checked) => updateSetting('sendOnEnter', checked)}
                aria-label="Send with Enter"
                className="data-[state=checked]:bg-primary"
              />
            }
          />
        </SettingsSection>

        {changedKeys.length > 0 ? (
          <p className="text-xs text-muted-foreground px-2">
            {changedKeys.length} setting{changedKeys.length === 1 ? '' : 's'} changed from the
            default on this device.
          </p>
        ) : null}
      </div>
    </SettingsShell>
  );
};

export default SettingsAppearanceScreen;
