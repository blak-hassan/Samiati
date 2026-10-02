'use client';

import React from 'react';
import { Screen } from '@/types';
import { cn } from '@/lib/utils';
import { Compass, Flame, Home, MessagesSquare, Settings } from 'lucide-react';

export interface BottomTab {
  screen: Screen;
  label: string;
  icon: React.ReactNode;
  /** Unread badge count. 0 / undefined renders no badge. */
  count?: number;
}

export interface BottomTabBarProps {
  /** The screen currently displayed — drives the active tab treatment. */
  activeScreen?: Screen;
  onNavigate: (screen: Screen) => void;
  /** Unread counters keyed by destination. */
  counts?: {
    contributions?: number;
    moderation?: number;
    notifications?: number;
  };
  /** Replace the default destinations (e.g. to add a moderator-only tab). */
  items?: BottomTab[];
  className?: string;
}

/**
 * Mobile-only bottom tab bar.
 *
 * On small screens the app previously had a single navigation affordance — a
 * hamburger that opened a Sheet — so reaching any top-level destination cost
 * two taps and the current section was never visible. This mirrors the desktop
 * sidebar's primary destinations as a persistent, thumb-reachable bar.
 *
 * Layout notes:
 *  - `lg:hidden`: the persistent desktop sidebar owns navigation at >=1024px.
 *  - Rendered in normal flow (not `fixed`) so a parent flex column reserves its
 *    height automatically instead of content sliding underneath it.
 *  - `pb-[env(safe-area-inset-bottom)]` keeps the tabs clear of the iOS home
 *    indicator / Android gesture bar.
 *  - Each tab is `h-14` (56px) tall and `flex-1` wide, clearing the 44x44 CSS
 *    pixel minimum tap target in WCAG 2.5.8 / Apple HIG.
 */
export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeScreen,
  onNavigate,
  counts,
  items,
  className,
}) => {
  const tabs: BottomTab[] = items ?? [
    { screen: Screen.HOME_CHAT, label: 'Home', icon: <Home className="w-5 h-5" /> },
    {
      screen: Screen.CHANGA,
      label: 'Changa',
      icon: <Flame className="w-5 h-5" />,
      count: counts?.contributions,
    },
    { screen: Screen.MESSAGES, label: 'Mushenee', icon: <MessagesSquare className="w-5 h-5" /> },
    { screen: Screen.DISCOVER, label: 'Discover', icon: <Compass className="w-5 h-5" /> },
    {
      screen: Screen.SETTINGS,
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      count: counts?.notifications,
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'lg:hidden shrink-0 border-t border-border bg-background/95 backdrop-blur-md',
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      <ul className="flex items-stretch">
        {tabs.map((tab) => {
          const isActive = activeScreen === tab.screen;
          const hasCount = typeof tab.count === 'number' && tab.count > 0;

          return (
            <li key={tab.screen} className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onNavigate(tab.screen)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative w-full h-14 min-h-14 flex flex-col items-center justify-center gap-0.5 px-1',
                  'text-[10px] font-bold tracking-tight transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="relative flex items-center justify-center">
                  <span aria-hidden="true">{tab.icon}</span>
                  {hasCount && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none"
                    >
                      {tab.count! > 99 ? '99+' : tab.count}
                    </span>
                  )}
                </span>
                <span className="truncate max-w-full">{tab.label}</span>
                {/* Badge digits are decorative; announce the count once, here. */}
                {hasCount && <span className="sr-only">{tab.count} unread</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomTabBar;
