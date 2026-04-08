
import React, { useMemo, useState } from 'react';
import { Challenge, ContributionItem, NavigateFn, Screen } from '@/types';
import { AccentRecorder } from '../changa/inputs/AccentRecorder';
import { DialectMapper } from '../changa/inputs/DialectMapper';
import { TotemUploader } from '../changa/inputs/TotemUploader';
import { useUser } from '@/app/MockProviders';

interface Props {
  navigate: NavigateFn;
  goBack: () => void;
  challenge?: Challenge;
}

const DEFAULT_CHALLENGE: Challenge = {
  id: 'c_default',
  title: 'Community Contribution',
  description: 'Share your knowledge with the community.',
  type: 'TRANSLATION',
  image: '',
  goalMetric: 'Entries',
  roles: [],
  goalCount: 10,
  currentCount: 0
};

const SubmitEntryScreen: React.FC<Props> = ({ navigate, goBack, challenge }) => {
  const { saveContribution } = useUser();
  const activeChallenge = challenge || DEFAULT_CHALLENGE;
  const [textEntry, setTextEntry] = useState('');

  const prompt = useMemo(() => {
    switch (activeChallenge.type) {
      case 'ACCENT': return 'Record the phrase "Good Morning" in your accent.';
      case 'DIALECT': return 'Pin the location where "Sheng" originated.';
      case 'TOTEM': return 'Upload a photo of a cultural artifact.';
      default: return activeChallenge.description;
    }
  }, [activeChallenge.description, activeChallenge.type]);

  const buildContribution = (): ContributionItem => {
    const entryTitle = textEntry.trim() || `${activeChallenge.title} submission`;

    return {
      id: `submission-${Date.now()}`,
      type: activeChallenge.type === 'TRANSLATION' ? 'Translate Paragraphs' : activeChallenge.type,
      title: entryTitle,
      subtitle: `${activeChallenge.title} • Submitted on ${new Date().toLocaleDateString()}`,
      status: 'Under Review',
      statusColor: 'text-warning',
      dotColor: 'bg-warning',
      icon:
        activeChallenge.type === 'ACCENT' ? 'mic' :
          activeChallenge.type === 'DIALECT' ? 'location_on' :
            activeChallenge.type === 'TOTEM' ? 'photo_camera' : 'history_edu',
      likes: 0,
      dislikes: 0,
      commentsCount: 0,
      userVote: null,
      comments: [],
      showComments: false,
      content: textEntry.trim() || prompt,
      context: `Submitted to ${activeChallenge.title}`,
      challengeId: activeChallenge.id,
      language: 'Swahili',
      languageCode: 'sw',
      reviewHistory: [],
      createdAt: Date.now(),
    };
  };

  const handleSubmit = () => {
    saveContribution(buildContribution());
    navigate(Screen.CONTRIBUTIONS, { initialTab: 'My Changa', statusFilter: 'Under Review' });
  };

  const renderInput = () => {
    switch (activeChallenge.type) {
      case 'ACCENT':
        return <AccentRecorder />;
      case 'DIALECT':
        return <DialectMapper />;
      case 'TOTEM':
        return <TotemUploader />;
      case 'TRANSLATION':
      default:
        return (
          <div className="flex-col flex gap-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-stone-900 dark:text-white font-bold">Your Entry</label>
            </div>
            <textarea
              value={textEntry}
              onChange={(event) => setTextEntry(event.target.value)}
              className="w-full flex-1 min-h-[150px] bg-stone-50 dark:bg-black/20 border-2 border-stone-200 dark:border-white/10 rounded-xl p-4 text-lg text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-text-muted focus:ring-0 focus:border-primary outline-none resize-none transition-colors"
              placeholder="Type your contribution here..."
            ></textarea>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#2b1e19] transition-colors duration-300 font-display">
      <header className="flex items-center p-4 border-b border-stone-200 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
        <button onClick={goBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors text-stone-900 dark:text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 text-center pr-10">
          <p className="text-[#cf6317] text-xs font-bold uppercase tracking-widest">Contributing to</p>
          <h2 className="text-lg font-bold text-stone-900 dark:text-white line-clamp-1">{activeChallenge.title}</h2>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-8 max-w-3xl mx-auto w-full">

        {/* Prompt Card */}
        <div className="bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <span className="material-symbols-outlined text-8xl">campaign</span>
          </div>

          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 text-xs font-bold rounded-full mb-4">
              Step 1 / 1
            </span>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-2 leading-tight">
              {prompt}
            </h1>
            <p className="text-stone-500 dark:text-[#A8A29E]">
              Ensure your submission is accurate and follows community guidelines.
            </p>
          </div>
        </div>

        {/* Dynamic Input Component */}
        <div className="flex-1">
          {renderInput()}
        </div>

      </main>

      <div className="p-6 border-t border-stone-200 dark:border-white/5 bg-white dark:bg-[#2b1e19] sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-stone-900 dark:text-white">Reward</p>
            <p className="text-xs text-[#cf6317] font-bold">+50 XP</p>
          </div>
          <button
            onClick={handleSubmit}
            className="flex-1 sm:flex-none sm:w-64 bg-[#cf6317] hover:bg-[#b05210] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#cf6317]/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
          >
            Submit Entry <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitEntryScreen;

