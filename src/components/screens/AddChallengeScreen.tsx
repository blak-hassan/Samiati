
import { useState } from 'react';
import { NavigateFn, ChallengeType } from '@/types';
import { useChangaMutation as useMutation } from '@/hooks/useChangaData';
import { api } from '../../../convex/_generated/api';
import { changaTaskTypeValues } from '../../../convex/changa/validators';

type ChangaTaskType = typeof changaTaskTypeValues[number];

const TYPE_MAP: Record<string, ChangaTaskType[]> = {
    VOICE: ['audio_reading'],
    WORDS: ['lexicon_entry'],
    TRANSLATE: ['sentence_translation'],
    CUSTOM: ['lexicon_entry'],
    LEGACY_ACCENT: ['audio_reading'],
    LEGACY_DIALECT: ['dialect_mapping'],
    LEGACY_ALPHABET: ['lexicon_entry'],
    LEGACY_TOTEM: ['cultural_context'],
};

const DEMO_REGIONS = [
    'Kiambu',
    "Murang'a",
    'Nyeri',
    'Kirinyaga',
    'Nairobi',
    'Nakuru',
    'Kisumu',
    'Mombasa',
    'Eldoret',
] as const;

interface Props {
  navigate: NavigateFn;
  goBack: () => void;
  onLaunch?: (challenge: { title: string; description: string; type: ChallengeType; goalCount: number }) => Promise<void>;
  isSubmitting?: boolean;
}

// ---------------------------------------------------------------------------
// Prototype-aligned challenge kinds ("What kind of challenge?"). The four
// legacy studio types (accent / dialect / alphabet / totem) are kept in the
// submit path via TYPE_MAP so saved templates still resolve, but the picker
// itself speaks the prototype language: voice, words, translation.
// ---------------------------------------------------------------------------
const CHALLENGE_KINDS = [
    { kind: 'VOICE', label: 'Voice recordings', desc: 'Collect audio from speakers in different regions.', icon: 'mic' },
    { kind: 'WORDS', label: 'Words & vocabulary', desc: 'Grow the word list for your language.', icon: 'spellcheck' },
    { kind: 'TRANSLATE', label: 'Translations', desc: 'Translate sentences so everyone can use them.', icon: 'translate' },
] as const;

type ChallengeKind = typeof CHALLENGE_KINDS[number]['kind'];

const TEMPLATE_PRESETS: Record<string, { goalCount: number; description: string }> = {
    VOICE: {
        goalCount: 50,
        description: 'Collect audio recordings of local accents from different regions. Each contributor records a set of standard phrases to capture phonetic variations.',
    },
    WORDS: {
        goalCount: 40,
        description: 'Add new words with a short meaning and an example sentence so reviewers can check them.',
    },
    TRANSLATE: {
        goalCount: 30,
        description: 'Translate everyday sentences so the language works in technology, school and daily life.',
    },
    ACCENT: {
        goalCount: 50,
        description: 'Collect audio recordings of local accents from different regions. Each contributor records a set of standard phrases to capture phonetic variations.',
    },
    DIALECT: {
        goalCount: 30,
        description: 'Pin specific dialect variations on a map. Contributors identify where certain words or pronunciations are used.',
    },
    ALPHABET: {
        goalCount: 40,
        description: 'Document characters and symbols from traditional or emerging writing systems. Include Unicode values and names where possible.',
    },
    TOTEM: {
        goalCount: 20,
        description: 'Archive photos and histories of cultural totems. Each entry includes an image and the story behind it.',
    },
};

const AddChallengeScreen: React.FC<Props> = ({ goBack, onLaunch, isSubmitting: propSubmitting }) => {
  const submitProposal = useMutation(api.changa.campaigns.submitCampaignProposal);
  const [step, setStep] = useState(1);
  const [selectedKind, setSelectedKind] = useState<ChallengeKind | null>(null);
  const [selectedType, setSelectedType] = useState<ChallengeType | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    goalCount: 50,
    goalDescription: '',
    region: '',
    whyItMatters: '',
    inviteNote: '',
    languageCode: 'ki',
  });
  const [customMission, setCustomMission] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState([
    { name: 'Dr. Ali', avatar: 'DA', role: 'Linguist' },
    { name: 'Mama Z.', avatar: 'MZ', role: 'Elder' },
    { name: 'Kevo', avatar: 'K', role: 'Historian' },
    { name: 'Sarah', avatar: 'S', role: 'Teacher' },
  ]);

  const handleAddToSquad = (user: typeof suggestions[0]) => {
    setSuggestions(suggestions.filter(s => s.name !== user.name));
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => { setSubmitError(null); setStep(s => s - 1); };

  // Legacy studio labels (kept only as a fallback title source; the picker
  // itself now uses CHALLENGE_KINDS above).

  const LEGACY_LABELS: Record<string, string> = {
    ACCENT: 'Accent Preservation',
    DIALECT: 'Dialect Mapping',
    ALPHABET: 'Alphabet Creation',
    TOTEM: 'Totem Registry',
  };

  const handleKindSelect = (kind: ChallengeKind) => {
    setSelectedKind(kind);
    // Keep the legacy `selectedType` in sync so the preview + completion
    // math keep working; kinds map 1:1 onto the studio template presets.
    setSelectedType(kind as unknown as ChallengeType);
    const preset = TEMPLATE_PRESETS[kind];
    if (preset) {
        setFormData(prev => ({
            ...prev,
            goalCount: preset.goalCount,
            goalDescription: preset.description,
        }));
    }
    handleNext();
  };

  const handleCustomTypeSelect = () => {
    if (!customMission.trim()) return;
    setSelectedKind(null);
    setSelectedType('CUSTOM');
    setFormData(prev => ({ ...prev, title: customMission }));
    handleNext();
  };

  const getChallengeTitle = () => {
    if (formData.title.trim()) return formData.title.trim();
    if (customMission.trim()) return customMission.trim();
    const kind = CHALLENGE_KINDS.find((entry) => entry.kind === selectedKind);
    if (kind) return kind.label;
    if (selectedType && LEGACY_LABELS[selectedType as string]) {
      return LEGACY_LABELS[selectedType as string];
    }
    return 'New Project';
  };

  const canSubmitStep2 =
    formData.title.trim().length > 0 &&
    formData.goalCount > 0 &&
    formData.region.trim().length > 0;

    const completionPercent = (() => {
    let filled = 0;
    const total = 4;
    if (selectedKind || selectedType) filled++;
    if (formData.title.trim() || customMission.trim()) filled++;
    if (formData.region.trim()) filled++;
    if (formData.goalDescription.trim()) filled++;
    return Math.round((filled / total) * 100);
  })();

  // Submits the prototype form as a campaign proposal so a moderator reviews
  // it before anything goes live ("A moderator checks it before it goes
  // live."). Falls back to the legacy direct-create path only when the
  // caller passed `onLaunch` (the /dashboard/add-challenge route) or when
  // offline demo mode returns a mock id.
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const submitting = propSubmitting ?? localSubmitting;

  const handleLaunchChallenge = async () => {
    if (!canSubmitStep2 || submitting) return;
    setSubmitError(null);
    const title = getChallengeTitle();
    const kindKey = selectedKind ?? (selectedType as string | null) ?? 'CUSTOM';
    const taskTypes = TYPE_MAP[kindKey] ?? ['lexicon_entry'];
    const inviteLine = formData.inviteNote.trim()
      ? `\n\nWho should we ask to join: ${formData.inviteNote.trim()}`
      : '';
    const regionLine = formData.region.trim()
      ? `\n\nRegion: ${formData.region.trim()}`
      : '';
    const description = `${formData.goalDescription.trim() || `A collaborative ${title.toLowerCase()} challenge.`}${regionLine}${inviteLine}`;

    if (onLaunch) {
      await onLaunch({
        title,
        description,
        type: (selectedType ?? 'CUSTOM') as ChallengeType,
        goalCount: formData.goalCount,
      });
      return;
    }

    setLocalSubmitting(true);
    try {
      const id = await submitProposal({
        title,
        description,
        languageCode: formData.languageCode,
        taskTypes,
        goalCount: formData.goalCount,
        rationale: formData.whyItMatters.trim() || undefined,
      });
      setProposalId(String(id ?? ''));
      setStep(3);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit your challenge. Please try again.');
    } finally {
      setLocalSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#2b1e19] text-stone-900 dark:text-white transition-colors duration-300 font-display">
      {/* Header */}
      <header className="flex items-center p-4 sticky top-0 bg-[#FAF9F6]/90 dark:bg-[#2b1e19]/90 backdrop-blur-md z-20">
        <button onClick={step === 1 ? goBack : handleBack} className="p-2 -ml-2 text-stone-500 hover:text-brand-accent transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold">Start a challenge</h1>
          <div className="flex justify-center gap-1 mt-1">
            {[1, 2].map(i => (
              <div key={i} className={`h-1 w-12 rounded-full transition-colors ${step >= i ? 'bg-brand-accent' : 'bg-stone-200 dark:bg-white/10'}`} />
            ))}
          </div>
          <p className="text-[10px] text-stone-400 mt-1 font-medium">{completionPercent}% complete</p>
        </div>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full">
        {/* Main Form */}
        <main className="flex-1 p-6 pb-32 overflow-y-auto">

          {/* STEP 1: WHAT KIND */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white">What kind of challenge?</h2>
                <p className="text-stone-500 dark:text-[#A8A29E]">Rally your community around something your language needs. A moderator checks it before it goes live.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {CHALLENGE_KINDS.map((entry) => (
                  <button
                    key={entry.kind}
                    onClick={() => handleKindSelect(entry.kind)}
                    className="relative group overflow-hidden bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/5 p-6 rounded-2xl flex items-center gap-5 hover:border-brand-accent hover:shadow-lg transition-all text-left"
                  >
                    <div className="w-14 h-14 rounded-full bg-brand-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl text-brand-accent">{entry.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-stone-900 dark:text-white group-hover:text-brand-accent transition-colors">{entry.label}</h3>
                      <p className="text-sm text-stone-500 dark:text-[#A8A29E] leading-relaxed">{entry.desc}</p>
                    </div>
                    <span className="material-symbols-outlined text-stone-300 group-hover:text-brand-accent transition-colors">chevron_right</span>
                  </button>
                ))}
              </div>

              {/* Custom Mission Input */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-[#FAF9F6] dark:bg-[#2b1e19] px-2 text-stone-500">Or create your own</span>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name your challenge (e.g. Nyeri accent week)"
                  className="flex-1 bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/10 rounded-xl p-4 text-stone-900 dark:text-white focus:border-brand-accent outline-none transition-colors"
                  value={customMission}
                  onChange={(e) => setCustomMission(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customMission.trim()) {
                      handleCustomTypeSelect();
                    }
                  }}
                />
                <button
                  onClick={handleCustomTypeSelect}
                  disabled={!customMission.trim()}
                  className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl px-4 aspect-square flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS (prototype spec) */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-2 mb-4">
                <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white">Tell us about it</h2>
                <p className="text-stone-500 dark:text-[#A8A29E]">A moderator checks it before it goes live.</p>
              </div>

              {/* Give it a name */}
              <div>
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Give it a name</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={getChallengeTitle()}
                  className="w-full bg-white dark:bg-[#42342b] border-2 border-stone-200 dark:border-white/10 rounded-xl p-4 text-stone-900 dark:text-white placeholder-stone-300 focus:border-brand-accent outline-none transition-colors font-bold"
                />
              </div>

              <div className="space-y-6">
                {/* Which region? */}
                <div>
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Which region?</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full bg-white dark:bg-[#42342b] border-2 border-stone-200 dark:border-white/10 rounded-xl p-4 font-bold text-stone-900 dark:text-white focus:border-brand-accent outline-none transition-colors"
                  >
                    <option value="">Choose a region</option>
                    {DEMO_REGIONS.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                {/* Goal */}
                <div>
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Goal</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="10"
                      max="500"
                      step="10"
                      value={formData.goalCount}
                      onChange={(e) => setFormData({ ...formData, goalCount: parseInt(e.target.value) })}
                      className="flex-1 accent-brand-accent"
                    />
                    <span className="text-2xl font-extrabold text-brand-accent w-16 text-center">{formData.goalCount}</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">Estimated time: ~{Math.ceil(formData.goalCount / 5)} days at 5 contributions/day</p>
                </div>

                {/* Why does it matter? (optional) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-stone-700 dark:text-stone-300">Why does it matter?</label>
                    <span className="text-xs text-stone-400">Optional</span>
                  </div>
                  <textarea
                    value={formData.whyItMatters}
                    onChange={(e) => setFormData({ ...formData, whyItMatters: e.target.value })}
                    placeholder="Tell the moderators why this challenge matters for your language..."
                    className="w-full bg-white dark:bg-[#42342b] border-2 border-stone-200 dark:border-white/10 rounded-xl p-4 font-medium text-stone-900 dark:text-white placeholder-stone-300 focus:border-brand-accent outline-none transition-colors min-h-[100px] resize-y"
                  />
                </div>

                {/* Who should we ask to join? */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-stone-700 dark:text-stone-300">Who should we ask to join?</label>
                    <span className="text-xs text-stone-400">Optional</span>
                  </div>

                  <textarea
                    value={formData.inviteNote}
                    onChange={(e) => setFormData({ ...formData, inviteNote: e.target.value })}
                    placeholder="Name friends, elders, or groups to invite (e.g. Nyeri youth group, Mama Wanjiru...)"
                    className="w-full bg-white dark:bg-[#42342b] border-2 border-stone-200 dark:border-white/10 rounded-xl p-4 font-medium text-stone-900 dark:text-white placeholder-stone-300 focus:border-brand-accent outline-none transition-colors min-h-[90px] resize-y"
                  />

                  <button
                    type="button"
                    onClick={async () => {
                      const link = typeof window !== 'undefined' ? window.location.href : '';
                      try {
                        if (navigator.clipboard && link) await navigator.clipboard.writeText(link);
                      } catch {
                        // Clipboard is best-effort; the link is still visible in the bar.
                      }
                    }}
                    className="w-full mt-3 py-3 rounded-xl border-2 border-dashed border-stone-300 dark:border-white/20 text-stone-500 dark:text-stone-400 font-bold text-sm hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
                  >
                    + Copy Invite Link
                  </button>

                  {/* Suggested contributors */}
                  {suggestions.length > 0 && (
                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-bold text-sm text-stone-700 dark:text-stone-300">Suggested contributors</h3>
                        <span className="text-xs text-stone-400">Tap to add their name</span>
                      </div>

                      <div className="flex gap-3 overflow-x-auto pb-2 snap-x no-scrollbar">
                        {suggestions.map((user, idx) => (
                          <div
                            key={idx}
                            className="snap-center shrink-0 w-28 bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/5 rounded-xl p-3 flex flex-col items-center gap-2 text-center shadow-sm"
                          >
                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center font-bold text-brand-accent text-sm">
                              {user.avatar}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-stone-900 dark:text-white truncate w-full">{user.name}</div>
                              <div className="text-[10px] text-stone-400">{user.role}</div>
                            </div>
                            <button
                              onClick={() => {
                                handleAddToSquad(user);
                                setFormData((prev) => ({
                                  ...prev,
                                  inviteNote: prev.inviteNote
                                    ? `${prev.inviteNote}, ${user.name}`
                                    : user.name,
                                }));
                              }}
                              className="w-full py-1 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[10px] font-bold rounded-lg hover:opacity-90 transition-opacity"
                            >
                              Add +
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUBMITTED — moderator review queue */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-10">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white">Challenge sent for review</h2>
              <p className="text-stone-500 dark:text-[#A8A29E] max-w-md mx-auto">
                A moderator checks it before it goes live. We will notify you once
                &ldquo;{formData.title || getChallengeTitle()}&rdquo; is approved.
              </p>
              {proposalId ? (
                <p className="text-xs text-stone-400">Reference: {proposalId}</p>
              ) : null}
              <button
                onClick={goBack}
                className="px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Back to community
              </button>
            </div>
          )}
        </main>

        {/* Preview Panel */}
        {step === 2 && (
          <div className="hidden lg:block w-80 border-l border-stone-200 dark:border-white/5 p-6 bg-white/50 dark:bg-[#42342b]/30">
            <div className="sticky top-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Live Preview</h3>

              <div className="bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                {/* Preview Header */}
                <div className="bg-gradient-to-r from-brand-accent to-amber-500 p-4">
                  <span className="inline-block px-2 py-0.5 bg-white/20 text-white text-[8px] font-bold rounded-full uppercase mb-2">
                    {selectedKind ?? selectedType ?? 'Type'}
                  </span>
                  <h4 className="font-bold text-white text-sm line-clamp-2">
                    {formData.title || getChallengeTitle()}
                  </h4>
                </div>

                {/* Preview Body */}
                <div className="p-4 space-y-3">
                  <p className="text-xs text-stone-500 dark:text-[#A8A29E] line-clamp-3">
                    {formData.goalDescription || 'What this challenge is about will appear here...'}
                  </p>
                  {formData.region ? (
                    <p className="text-[11px] font-bold text-stone-500 dark:text-stone-300">
                      Region: {formData.region}
                    </p>
                  ) : null}

                  {/* Preview Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-stone-400">Progress</span>
                      <span className="text-brand-accent">0 / {formData.goalCount}</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-white/5 rounded-full h-1.5">
                      <div className="h-full bg-brand-accent rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-400">
                    A moderator checks it before it goes live.
                  </p>

                  {/* Preview CTA */}
                  <button className="w-full py-2 bg-brand-accent text-white text-xs font-bold rounded-lg mt-2">
                    Contribute (+50 XP)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <footer className="sticky bottom-0 z-20 bg-white/90 dark:bg-[#2b1e19]/90 backdrop-blur-md p-4 border-t border-stone-200 dark:border-white/5 transition-colors">
        {step === 1 ? (
          <div className="text-center text-xs text-stone-400 font-bold uppercase tracking-widest pb-2">Select a kind to proceed</div>
        ) : step === 3 ? null : (
          <div className="mx-auto max-w-lg space-y-2">
            {submitError ? (
              <p className="text-sm font-bold text-red-600 text-center">{submitError}</p>
            ) : null}
            {!canSubmitStep2 ? (
              <p className="text-xs text-stone-400 text-center font-medium">
                Give it a name, pick a region and set a goal to continue.
              </p>
            ) : null}
            <div className="flex gap-2">
            <button
              onClick={handleBack}
              className="px-6 py-4 border-2 border-stone-200 dark:border-white/10 rounded-xl font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleLaunchChallenge}
              disabled={!canSubmitStep2 || submitting}
              className="flex-1 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Sending for review...' : 'Send for review'}
              {!submitting && <span className="material-symbols-outlined">shield</span>}
            </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default AddChallengeScreen;
