"use client";

import React, { useState } from 'react';
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Screen } from "@/types";
import { useNavigation } from "@/hooks/useNavigation";
import { Language, LANGUAGES } from "@/components/chat/LanguageSelector";
import { Check, ArrowRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import SettingsPageHeader from "@/components/settings/SettingsPageHeader";
import { useToast } from "@/hooks/useToast";

const STEPS = ['languages', 'cultural', 'consent'] as const;
type Step = typeof STEPS[number];

const OnboardingScreen: React.FC<{ goBack: () => void }> = ({ goBack }) => {
  const { toast } = useToast();
  const { navigate } = useNavigation();
  const completeOnboardingMutation = useMutation(api.users.mutations.completeOnboarding);

  const [step, setStep] = useState<Step>('languages');
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
  const [culturalBackground, setCulturalBackground] = useState('');
  const [consent, setConsent] = useState({
    showChanga: true,
    voiceDataAllowed: false,
    culturalDataAllowed: false,
  });
  const [saving, setSaving] = useState(false);

  const toggleLanguage = (lang: Language) => {
    setSelectedLanguages(prev =>
      prev.find(l => l.code === lang.code)
        ? prev.filter(l => l.code !== lang.code)
        : [...prev, lang].slice(0, 10)
    );
  };

  const handleNext = () => {
    if (step === 'languages') {
      if (selectedLanguages.length === 0) {
        toast("Please select at least one language", "error");
        return;
      }
      setStep('cultural');
    } else if (step === 'cultural') {
      setStep('consent');
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await completeOnboardingMutation({
        languages: selectedLanguages.map(l => ({
          id: l.code,
          name: l.name,
          level: 'learning',
          percent: 50,
        })),
        culturalBackground: culturalBackground || undefined,
        showChanga: consent.showChanga,
        voiceDataAllowed: consent.voiceDataAllowed,
        culturalDataAllowed: consent.culturalDataAllowed,
      });
      toast("Welcome to Samiati!", "success");
      navigate(Screen.HOME_CHAT);
    } catch (error) {
      console.error("Onboarding failed:", error);
      toast("Failed to complete onboarding. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const currentStepIndex = STEPS.indexOf(step);

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      <SettingsPageHeader title="Welcome to Samiati" onBack={goBack} />

      <main className="flex-1 overflow-y-auto p-4">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex-1 h-1.5 rounded-full transition-colors ${i <= currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
              {i < STEPS.length - 1 && <div className="w-2" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Languages */}
        {step === 'languages' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Select Your Languages</h2>
              <p className="text-sm text-muted-foreground">Choose the languages you speak or want to learn. You can change this later.</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLanguages.some(l => l.code === lang.code);
                return (
                  <button
                    key={lang.code}
                    onClick={() => toggleLanguage(lang)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-muted/20 border-border/50 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary/60">{lang.code.toUpperCase()}</span>
                      <span className="font-medium text-foreground">{lang.name}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Cultural Background */}
        {step === 'cultural' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Your Cultural Background</h2>
              <p className="text-sm text-muted-foreground">Help us understand your background so we can personalize your experience. This is optional.</p>
            </div>
            <textarea
              value={culturalBackground}
              onChange={(e) => setCulturalBackground(e.target.value)}
              placeholder="e.g., Kenyan, Nigerian, South African..."
              rows={4}
              className="w-full bg-muted/20 border border-border/50 rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>
        )}

        {/* Step 3: Changa Consent */}
        {step === 'consent' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Help Preserve African Languages</h2>
              <p className="text-sm text-muted-foreground mb-4">Samiati relies on community contributions to improve. You can opt in or out at any time.</p>
            </div>

            <div className="bg-muted/20 rounded-2xl border border-border/50 overflow-hidden space-y-0">
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <div>
                  <p className="font-medium text-foreground">Changa Contributions</p>
                  <p className="text-xs text-muted-foreground">Allow your translations and audio to help train better models</p>
                </div>
                <Switch
                  checked={consent.showChanga}
                  onCheckedChange={(val) => setConsent({ ...consent, showChanga: val })}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <div className="flex items-center justify-between p-4 border-b border-border/30">
                <div>
                  <p className="font-medium text-foreground">Voice Data</p>
                  <p className="text-xs text-muted-foreground">Allow voice recordings to be used for speech recognition</p>
                </div>
                <Switch
                  checked={consent.voiceDataAllowed}
                  onCheckedChange={(val) => setConsent({ ...consent, voiceDataAllowed: val })}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-foreground">Cultural Data</p>
                  <p className="text-xs text-muted-foreground">Allow proverbs, stories, and words to be included in datasets</p>
                </div>
                <Switch
                  checked={consent.culturalDataAllowed}
                  onCheckedChange={(val) => setConsent({ ...consent, culturalDataAllowed: val })}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
              <p className="text-xs text-foreground">
                You can change these preferences anytime in Settings. All contributions are anonymous and you retain full control.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-8">
          {step !== 'languages' && (
            <button
              onClick={() => setStep(STEPS[STEPS.indexOf(step) - 1])}
              className="flex-1 py-3 rounded-2xl border border-border/50 font-bold text-foreground hover:bg-muted/20 transition-colors"
            >
              Back
            </button>
          )}
          {step !== 'consent' ? (
            <button
              onClick={handleNext}
              className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              Next
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Get Started"}
              <Check size={18} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default OnboardingScreen;
