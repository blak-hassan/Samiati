'use client';

import React from 'react';
import { ProductNav } from '@/components/product/ProductNav';
import { PageIntro } from '@/components/product/PageIntro';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  Database,
  HelpCircle,
  Languages,
  Palette,
  Scale,
  Shield,
  User,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SETTINGS_SECTIONS, SettingsSectionId } from '@/lib/settings';
import { cn } from '@/lib/utils';

const SECTION_ICONS: Record<SettingsSectionId, React.ElementType> = {
  appearance: Palette,
  profile: UserCog,
  account: User,
  notifications: Bell,
  privacy: Shield,
  data: Database,
  moderation: Shield,
  languages: Languages,
  support: HelpCircle,
  legal: Scale,
};

export interface SettingsShellProps {
  title: string;
  /** Rendered on the right of the header — e.g. a "Restore defaults" button. */
  headerAction?: React.ReactNode;
  /** The current settings area, used to highlight the rail. */
  activeSection?: SettingsSectionId;
  children: React.ReactNode;
  /** Hide the section rail (used by the settings index page). */
  hideRail?: boolean;
  /** Where the back arrow points. Defaults to the settings index. */
  backHref?: string;
}

/**
 * Shared chrome for every settings screen: a sticky header plus the section
 * rail. T3Chat uses the same rail across all of its settings pages so the
 * user always knows where they are and can jump sideways without going back.
 */
const SettingsShell: React.FC<SettingsShellProps> = ({
  title,
  headerAction,
  activeSection,
  children,
  hideRail = false,
  backHref = '/dashboard/settings',
}) => {
  const pathname = usePathname();

  const resolvedActive =
    activeSection ??
    SETTINGS_SECTIONS.find((section) => pathname.startsWith(section.path))?.id ??
    SETTINGS_SECTIONS.find((section) => section.path === pathname)?.id;

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-24 transition-colors duration-200 md:pb-8">
      <ProductNav active="settings" />
      <header className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
        <Button variant="ghost" size="icon" asChild className="size-11 rounded-full">
          <Link href={backHref} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <p className="text-sm font-medium text-muted-foreground">Settings</p>
        <div className="ml-auto flex items-center gap-2">{headerAction}</div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col lg:flex-row">
        {!hideRail ? (
          <nav
            aria-label="Settings sections"
            className="lg:w-64 shrink-0 lg:border-r border-border/40 px-4 py-4 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto"
          >
            <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1">
              {SETTINGS_SECTIONS.map((section) => {
                const Icon = SECTION_ICONS[section.id];
                const isActive = resolvedActive === section.id;
                return (
                  <li key={section.id} className="shrink-0">
                    <Link
                      href={section.path}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {section.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        <main
          className="min-w-0 max-w-3xl flex-1 px-4 pb-8 sm:px-6"
          id="main-content"
          tabIndex={-1}
        >
          <PageIntro eyebrow="Make yourself at home" title={title} />
          {children}
        </main>
      </div>
    </div>
  );
};

export default SettingsShell;
