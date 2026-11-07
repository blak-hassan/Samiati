"use client";

import { ArrowRight, Check, Handshake } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { SamiatiLogo } from "@/components/layout/samiati-logo";
import { LanguageSelector } from "@/components/language/language-selector";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguagePreferences } from "@/lib/language-preferences/provider";
import { getLanguageOrDefault } from "@/lib/languages";

/**
 * Onboarding.
 *
 * The only question that really matters is which language the user wants to
 * think in. Everything else is optional and can be changed later.
 */
export function OnboardingView() {
  const router = useRouter();
  const { languageId, setLanguage, favorites, toggleFavorite } =
    useLanguagePreferences();

  const [step, setStep] = React.useState(0);
  const [contribute, setContribute] = React.useState(true);
  const language = getLanguageOrDefault(languageId);

  const finish = React.useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <div className="samiati-grain flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <SamiatiLogo />
        </div>

        <div className="samiati-surface rounded-2xl p-6 sm:p-8">
          {step === 0 ? (
            <div className="space-y-4">
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                Welcome to Samiati
              </h1>
              <p className="text-pretty text-muted-foreground">
                Samiati is an AI assistant for the languages of Africa. You will
                not pick a model — you pick a language, and Samiati speaks it.
              </p>
              <Button className="w-full gap-2" onClick={() => setStep(1)}>
                Choose my language
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  Which language do you think in?
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  This becomes your default. You can switch any time.
                </p>
              </div>

              <LanguageSelector
                value={languageId}
                onChange={setLanguage}
                className="w-full justify-between"
                favorites={favorites}
              />

              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">{language.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  “{language.sample}” — {language.sampleTranslation}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {language.region} · {language.description}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div className="min-w-0">
                  <Label htmlFor="onboarding-favourite" className="text-sm">
                    Add {language.name} to my favourites
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    It will be pinned at the top of the language selector.
                  </p>
                </div>
                <Switch
                  id="onboarding-favourite"
                  checked={favorites.includes(language.id)}
                  onCheckedChange={() => toggleFavorite(language.id)}
                />
              </div>

              <Button className="w-full gap-2" onClick={() => setStep(2)}>
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  One last thing
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Samiati gets better when people contribute the translations
                  that models cannot learn on their own.
                </p>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div className="min-w-0">
                  <Label htmlFor="onboarding-contribute" className="text-sm">
                    I want to help improve {language.name}
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You will find translation and validation tasks in Changa.
                    Your contributions are reviewed before they enter a dataset.
                  </p>
                </div>
                <Switch
                  id="onboarding-contribute"
                  checked={contribute}
                  onCheckedChange={setContribute}
                />
              </div>

              <div className="rounded-lg border border-dashed p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Handshake className="h-4 w-4 text-primary" aria-hidden />
                  What happens next
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    You can talk to Samiati in {language.name} straight away.
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    Discover brings you news and knowledge in your language.
                  </li>
                  {contribute ? (
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      Changa has translation tasks waiting for you.
                    </li>
                  ) : null}
                </ul>
              </div>

              <Button className="w-full gap-2" onClick={finish}>
                Start talking
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          You can change all of this later in Settings.
        </p>
      </div>
    </div>
  );
}
