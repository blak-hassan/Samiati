'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSettings } from '@/hooks/useSettings';
import type { ThemeMode } from '@/lib/settings';

export function ThemeToggle() {
  const { settings, updateSetting } = useSettings();
  const Icon = settings.theme === 'system' ? Monitor : settings.theme === 'dark' ? Moon : Sun;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-full"
          aria-label={`Appearance: ${settings.theme}. Choose theme`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44 rounded-xl">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={settings.theme}
          onValueChange={(value) => updateSetting('theme', value as ThemeMode)}
        >
          <DropdownMenuRadioItem value="light" className="min-h-11 gap-2">
            <Sun aria-hidden="true" className="size-4" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="min-h-11 gap-2">
            <Moon aria-hidden="true" className="size-4" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="min-h-11 gap-2">
            <Monitor aria-hidden="true" className="size-4" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
