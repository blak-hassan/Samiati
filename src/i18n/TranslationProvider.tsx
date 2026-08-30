"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

type TranslationKey = 
  | "title"
  | "subtitle"
  | "recommended"
  | "startTask"
  | "moreTasks"
  | "otherTasks"
  | "noTasks"
  | "loadingTasks"
  | "findingTasks"
  | "campaigns"
  | "viewAll"
  | "yourImpact"
  | "acceptedContributions"
  | "inReview"
  | "noContributions"
  | "trust"
  | "invite"
  | "myActivity"
  | "inviteSuccess"
  | "allDialects"
  | "openTasks"
  | "submitted"
  | "curated"
  | "campaignsLabel"
  | "quickTask"
  | "aboutTime"
  | "saveDraft"
  | "skipTask"
  | "submitContribution"
  | "uploading"
  | "draftSaved"
  | "consentLabel"
  | "answerLabel"
  | "recordingLabel"
  | "loadingAudio"
  | "audioUnavailable"
  | "reviewNote"
  | "rejectReason"
  | "accept"
  | "minorFix"
  | "reject"
  | "escalate"
  | "recordingReview"
  | "queueCleared"
  | "back"
  | "loadingQueue"
  | "fetchingQueue"
  | "nothingToReview"
  | "communityReview"
  | "reviewsSoFar"
  | "needsModerator"
  | "submittedAnswer"
  | "emptyStateTitle"
  | "emptyStateDesc"
  | "startFirstTask"
  | "browseCampaigns"
  | "findTask"
  | "collectingSheng"
  | "loadingSubmission"
  | "context"
  | "promptLabel"
  | "answerTooltip"
  | "consentTooltip"
  | "recordingTooltip"
  | "codeSwitchingLabel"
  | "reviewNotePlaceholder"
  | "nothingToReviewDesc"
  | "queueClearedDesc"
  | "keepReviewing";

interface Translations {
  [key: string]: string;
}

const en: Translations = {
  title: "Changa",
  subtitle: "Help your language in seconds.",
  recommended: "Recommended for you",
  startTask: "Start task",
  moreTasks: "More tasks",
  otherTasks: "Other tasks",
  noTasks: "No tasks are open right now",
  loadingTasks: "Loading tasks...",
  findingTasks: "Finding the best tasks for you.",
  campaigns: "Active campaigns",
  viewAll: "View all",
  yourImpact: "Your impact",
  acceptedContributions: "{count} accepted contribution{plural} helping train Samiati.",
  inReview: "{count} contribution{plural} being checked by reviewers.",
  noContributions: "No contributions yet — start with the task below.",
  trust: "Trust",
  invite: "Invite",
  myActivity: "My activity",
  inviteSuccess: "Link copied! Share it with friends to collect Sheng together.",
  allDialects: "All dialects",
  openTasks: "Open tasks",
  submitted: "Submitted",
  curated: "Curated",
  campaignsLabel: "Campaigns",
  quickTask: "A quick Changa task",
  aboutTime: "about 15 seconds",
  saveDraft: "Save draft",
  skipTask: "Skip this task",
  submitContribution: "Submit contribution",
  uploading: "Uploading contribution…",
  draftSaved: "Draft saved. You can close this page and come back later.",
  consentLabel: "I allow Samiati to use this contribution to improve its language models and research. My name will not be publicly attached to it.",
  answerLabel: "Your answer",
  recordingLabel: "Recording",
  loadingAudio: "Loading audio…",
  audioUnavailable: "Audio is temporarily unavailable.",
  reviewNote: "Note to the contributor (optional)",
  rejectReason: "Why should this be rejected?",
  accept: "Accept",
  minorFix: "Needs a small fix",
  reject: "Reject",
  escalate: "Escalate",
  recordingReview: "Recording your review…",
  queueCleared: "Queue cleared",
  back: "Back",
  loadingQueue: "Loading the queue…",
  fetchingQueue: "Fetching submissions awaiting review.",
  nothingToReview: "Nothing to review right now",
  communityReview: "Community review",
  reviewsSoFar: "{count} review{plural} so far",
  needsModerator: "Needs moderator attention",
  submittedAnswer: "Submitted answer",
  emptyStateTitle: "Claim your first task",
  emptyStateDesc: "Every word you add helps train AI that understands your language. It only takes about 15 seconds.",
  startFirstTask: "Start your first task",
  browseCampaigns: "Browse campaigns",
  findTask: "Find a task",
  collectingSheng: "collecting Sheng data is better with friends",
  loadingSubmission: "Checking your contribution…",
  context: "Context: {note}",
  promptLabel: "Prompt",
  answerTooltip: "Type the natural word or phrase as you would actually say it. Authenticity matters most.",
  consentTooltip: "Your contribution helps train better language models. You can skip this if you prefer not to allow training use.",
  recordingTooltip: "Record in a quiet space for best results. You can re-record as many times as you need.",
  codeSwitchingLabel: "What type of Sheng did you use?",
  reviewNotePlaceholder: "One clear sentence — what should change, if anything?",
  nothingToReviewDesc: "Submissions land here once they pass their quality checks. Check back soon.",
  queueClearedDesc: "Thanks for reviewing. New submissions appear here as they pass quality checks.",
  keepReviewing: "Keep reviewing",
};

const sw: Translations = {
  title: "Changa",
  subtitle: "Saidia lugha yako ndani ya sekunde.",
  recommended: "Inapendekezwa kwako",
  startTask: "Anza kazi",
  moreTasks: "Kazi za ziada",
  otherTasks: "Kazi nyingine",
  noTasks: "Hakuna kazi wazi kwa sasa",
  loadingTasks: "Inapakia kazi...",
  findingTasks: "Inatafuta kazi bora kwako.",
  campaigns: "Mikakati inayojishughulisha",
  viewAll: "Tazama zote",
  yourImpact: "Athari yako",
  acceptedContributions: "{count} michango iliyokubaliwa ikisasaidia kufundisha Samiati.",
  inReview: "{count} michango inakaguliwa na wakaguzi.",
  noContributions: "Hakuni michango bado — anza na kazi hapo chini.",
  trust: "Uaminifu",
  invite: "Alika",
  myActivity: "Shughuli zangu",
  inviteSuccess: "Kiungo kimekopiwa! Shiriki na marafiki kukusanya data ya Sheng pamoja.",
  allDialects: "Lahaja zote",
  openTasks: "Kazi wazi",
  submitted: "Imewasilishwa",
  curated: "Imehindiliwa",
  campaignsLabel: "Mikakati",
  quickTask: "Kazi fupi ya Changa",
  aboutTime: "takriban sekunde 15",
  saveDraft: "Hifadhi muundo",
  skipTask: "Ruka kazi hii",
  submitContribution: "Wasilisha michango",
  uploading: "Inapakia michango…",
  draftSaved: "Muundo umehifadhiwa. Unaweza kufunga ukurasa huu na kurudi baadaye.",
  consentLabel: "Ninakubali Samiati kutumia michango yangu kuboresha Mifumo ya lugha na utafiti. Jina langu haliitaji kama kiungo hadharani.",
  answerLabel: "Jibu lako",
  recordingLabel: "Sare",
  loadingAudio: "Inapakia sauti…",
  audioUnavailable: "Sauti haipatikani kwa sasa.",
  reviewNote: "Kumbukumbu kwa mchangiaji (hiari)",
  rejectReason: "Kwa nini hii inapaswa kukataliwa?",
  accept: "Kubali",
  minorFix: "Inahitaji kuboresha kidogo",
  reject: "Kataa",
  escalate: "Pandisha",
  recordingReview: "Inarekodi tathmini yako…",
  queueCleared: "Foleni imefutwa",
  back: "Rudi",
  loadingQueue: "Inapakia foleni…",
  fetchingQueue: "Inatafuta michango inayosubiri ukaguzi.",
  nothingToReview: "Hakuna kitu cha kuthamini kwa sasa",
  communityReview: "Ukaguzi wa jamii",
  reviewsSoFar: "{count} ukaguzi{plural} mpaka sasa",
  needsModerator: "Inahitaji uangalizi wa msimamizi",
  submittedAnswer: "Jibu lililowasilishwa",
  emptyStateTitle: "Dai kazi yako ya kwanza",
  emptyStateDesc: "Kila neno unaloweka husaidia kufundisha AI ambayo inaelewa lugha yako. Inachukua sekunde 15 tu.",
  startFirstTask: "Anza kazi yako ya kwanza",
  browseCampaigns: "Tafuta mikakati",
  findTask: "Pata kazi",
  collectingSheng: "kukusanya data ya Sheng ni bora kwa marafiki",
  loadingSubmission: "Inakagua michango yako…",
  context: "Muktadha: {note}",
  promptLabel: "Ombi",
  answerTooltip: "Andika neno au msemo wa asili kama unavyosema kwa kweli. Uwazi ni muhimu zaidi.",
  consentTooltip: "Michango yako husaidia kufundisha Mifumo bora ya lugha. Unaweza kuiruka hii kama hutaki kuruhusu matumizi ya mafunzo.",
  recordingTooltip: "Srekodi katika nafasi iliyo na utulivu kwa matokeo bora. Unaweza kurekodia tena kadiri unavyohitaji.",
  codeSwitchingLabel: "Je, unatumia aina gani ya Sheng?",
  reviewNotePlaceholder: "Sentensi moja wazi — nini kinapaswa kubadilika, kama kuna kitu?",
  nothingToReviewDesc: "Michango itajitokeza hapa itakapopita ukaguzi wake wa ubora. Angalia tena hivi karibuni.",
  queueClearedDesc: "Asante kwa kuthamini. Michango mpya itajitokeza hapa itakapopita ukaguzi wa ubora.",
  keepReviewing: "Endelea kuthamini",
};

const translations: Record<string, Translations> = { en, sw };

interface TranslationContextValue {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let text = translations[locale]?.[key] ?? en[key];
      if (vars && text) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text ?? key;
    },
    [locale]
  );

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return ctx;
}