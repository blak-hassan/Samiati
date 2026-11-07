"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SamiatiAuthProvider } from "@/lib/auth/provider";
import { SamiatiDataProvider } from "@/lib/data/provider";
import { LanguagePreferencesProvider } from "@/lib/language-preferences/provider";
import { PreferencesProvider } from "@/lib/preferences/provider";

/**
 * The single client boundary for the whole application.
 *
 * Everything below it can rely on three things being available: a theme, an
 * identity, a persistence backend and the user's preferences.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SamiatiAuthProvider>
        <SamiatiDataProvider>
          <LanguagePreferencesProvider>
            <PreferencesProvider>
              {children}
              <Toaster position="bottom-right" richColors closeButton />
            </PreferencesProvider>
          </LanguagePreferencesProvider>
        </SamiatiDataProvider>
      </SamiatiAuthProvider>
    </ThemeProvider>
  );
}
