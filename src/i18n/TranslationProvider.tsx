"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

export type TranslationKey = 
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
  | "activityCountLabel"
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
  | "keepReviewing"
  // --- Prototype revamp: Home / misc ---
  | "greetingMorning"
  | "greetingAfternoon"
  | "greetingEvening"
  | "helloName"
  | "valueLine"
  | "todaysGoal"
  | "streakLabel"
  | "xpLabel"
  | "sentencesGoal"
  | "welcomeBack"
  | "whatNeedsToday"
  | "todaysMissions"
  | "missionsHint"
  | "quickContribute"
  | "allWaysToHelp"
  | "doneToday"
  | "speakAndListen"
  | "writeLabel"
  | "checkLabel"
  | "communityLabel"
  | "achievementsLabel"
  | "communitiesLabel"
  | "notificationsLabel"
  | "communityChallenge"
  | "letUsChoose"
  | "pickOne"
  // --- Prototype revamp: Community page ---
  | "wordOfTheDay"
  | "recognition"
  | "topContributor"
  | "mostConsistent"
  | "helpfulReviewer"
  | "communityBuilder"
  | "goalSentences"
  | "translationCategory"
  | "voiceCategory"
  | "vocabularyCategory"
  | "validationCategory"
  | "whereWeNeedVoices"
  | "hoursOfSpeech"
  | "peopleLabel"
  | "contributionsLabel"
  | "soFar"
  | "contributionsTab"
  | "peopleTab"
  // --- Prototype revamp: Task + validation ---
  | "translateInto"
  | "sayThisIn"
  | "accentFrom"
  | "howWouldYouSay"
  | "swipeHint"
  | "niceHelper"
  | "xpEarned"
  // --- Prototype revamp: Keeper / moderator ---
  | "startChallenge"
  | "startChallengeHint"
  | "keeperOfLanguage"
  | "keeperSubtitle"
  | "whatYouWouldDo"
  | "keeperCheckWork"
  | "keeperCatchBad"
  | "keeperOneStandard"
  | "yourEligibility"
  | "eligibleAccurate"
  | "eligibleActive"
  | "moderatorsChosen"
  | "stepDownAnytime"
  | "trustedReviewer"
  | "thankYouClean"
  | "waitingLabel"
  | "checkedToday"
  | "agreement"
  | "moderationXp"
  // --- Prototype revamp: Onboarding ---
  | "whichLanguage"
  | "whichLanguageHint"
  | "createProfile"
  | "onlyNameNeeded"
  | "yourNameNickname"
  | "regionOptional"
  | "youAreHelping"
  | "days"
  // --- Prototype revamp: Home entry points (community + keeper) ---
  | "communityHomeTitle"
  | "communityHomeHint"
  | "openCommunity"
  | "applyKeeper"
  | "openValidationQueue";

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
  activityCountLabel: "{count} contribution{plural} so far",
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
  // --- Prototype revamp ---
  greetingMorning: "Good morning",
  greetingAfternoon: "Good afternoon",
  greetingEvening: "Good evening",
  helloName: "Hello, {name}",
  valueLine: "Your language. Your voice. Every task moves it forward.",
  todaysGoal: "Today's goal",
  streakLabel: "day streak",
  xpLabel: "XP",
  sentencesGoal: "Help reach 100,000 new sentences",
  welcomeBack: "Welcome back",
  whatNeedsToday: "Here is what needs today.",
  todaysMissions: "Today's missions",
  missionsHint: "Short and simple. Pick one, or let us choose.",
  quickContribute: "Quick contribute",
  allWaysToHelp: "All ways to help",
  doneToday: "of {count} done",
  speakAndListen: "Speak and listen",
  writeLabel: "Write",
  checkLabel: "Check",
  communityLabel: "Community",
  achievementsLabel: "Achievements",
  communitiesLabel: "Communities",
  notificationsLabel: "Notifications",
  communityChallenge: "Community challenge",
  letUsChoose: "Let us choose",
  pickOne: "Pick one",
  wordOfTheDay: "Word of the day",
  recognition: "Recognition",
  topContributor: "Top contributor",
  mostConsistent: "Most consistent",
  helpfulReviewer: "Helpful reviewer",
  communityBuilder: "Community builder",
  goalSentences: "{language} goal: 100,000 sentences",
  translationCategory: "Translation",
  voiceCategory: "Voice",
  vocabularyCategory: "Vocabulary",
  validationCategory: "Validation",
  whereWeNeedVoices: "Where we need more voices",
  hoursOfSpeech: "Hours of speech",
  peopleLabel: "People",
  contributionsLabel: "Contributions",
  soFar: "so far",
  contributionsTab: "Contributions",
  peopleTab: "People",
  translateInto: "Translate this into {language}",
  sayThisIn: "Say this sentence in {language}",
  accentFrom: "Where is your accent from? (optional)",
  howWouldYouSay: "How would you say it?",
  swipeHint: "Swipe right if correct, left if it needs fixing, or use the buttons.",
  niceHelper: "Nice! You just helped your language.",
  xpEarned: "+{xp} XP",
  startChallenge: "Start a challenge",
  startChallengeHint: "Rally your community around something your language needs. A moderator checks it before it goes live.",
  keeperOfLanguage: "Be a keeper of your language",
  keeperSubtitle: "Moderators check contributions so the data stays correct and respectful. It is optional.",
  whatYouWouldDo: "What you would do",
  keeperCheckWork: "Check translations and recordings",
  keeperCatchBad: "Catch private information and bad audio",
  keeperOneStandard: "Help your community keep one standard",
  yourEligibility: "Your eligibility",
  eligibleAccurate: "Accurate work ({percent}%)",
  eligibleActive: "Active for {days} days or more",
  moderatorsChosen: "Moderators are chosen for careful work, not for how much they do.",
  stepDownAnytime: "You can step down any time.",
  trustedReviewer: "Trusted Reviewer",
  thankYouClean: "Thank you for keeping the data clean",
  waitingLabel: "Waiting",
  checkedToday: "Checked today",
  agreement: "{percent}% Agreement",
  moderationXp: "Moderation XP",
  whichLanguage: "Which language do you want to help?",
  whichLanguageHint: "Pick the language you speak best. You can add more later.",
  createProfile: "Create your profile",
  onlyNameNeeded: "Only a name is needed. You choose what others see.",
  yourNameNickname: "Your name or nickname",
  regionOptional: "Region (optional)",
  youAreHelping: "You are helping",
  days: "days",
  communityHomeTitle: "Your language community",
  communityHomeHint: "Word of the day, recognition, and the regions still waiting for voices.",
  openCommunity: "Open community",
  applyKeeper: "Apply to be a keeper",
  openValidationQueue: "Open the review queue",
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
  activityCountLabel: "Mchango {count} hadi sasa",
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