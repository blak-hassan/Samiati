
import React, { useState } from 'react';
import { Screen, User } from '@/types';

interface ChallengeParams {
  id: string;
  title: string;
  type: string;
  desc: string;
  img: string;
  goal?: string;
  progress?: number;
  inputMode?: string;
}

interface Props {
  navigate: (screen: Screen, params?: any) => void;
  goBack: () => void;
  onViewProfile: (user: User) => void;
  challenge?: ChallengeParams;
}

const DEFAULT_CHALLENGE: ChallengeParams = {
  id: 'c1',
  title: 'The Kikuyu 100',
  type: 'Translation Drive',
  desc: 'Help us translate the 100 most common words into Kikuyu.',
  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgGK4HiP_WY3pOD4a5vjGWGtQqUUhOEyj94mc4Il4W9cK7uPISoDqA2_rAz6yx1hMgSr8B5pR8Q6cUCf4E81l5Yo--0f2oCHKyYXaSMxJOQKq6tn9MI-Cjx-_4Er3rmI0A8aTcqHLHpt7l2rEFyWita0CSiwer0MhunOiGwr3xKNC0bD-0tv8nalLieXnnzrSwIA5w9S3Fmuvy2UtBjpw7MdkR-USmYOn1ZIjsdIHGV9bFOVr97G958mCv7m40Q8Pa3Wq6A3Td9dk',
  goal: 'Translate the Basics',
  progress: 64,
  inputMode: 'Translation'
};

const ChallengeDetailsScreen: React.FC<Props> = ({ navigate, goBack, onViewProfile, challenge }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'leaderboard' | 'prizes'>('details');
  const activeChallenge = challenge || DEFAULT_CHALLENGE;

  const handleShare = () => {
    alert("Challenge link copied to clipboard!");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#2b1e19] relative transition-colors duration-300 font-display">
      {/* Background Image Header */}
      <div className="h-72 w-full bg-cover bg-center relative shrink-0" style={{ backgroundImage: `url('${activeChallenge.img}')` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] dark:from-[#2b1e19] via-transparent to-black/40"></div>
        <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10">
          <button onClick={goBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/30 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="px-4 py-1.5 bg-[#cf6317]/90 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
            Teach Samiati
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white mb-2 leading-tight drop-shadow-md">{activeChallenge.title}</h1>
          <div className="flex items-center gap-2 text-stone-700 dark:text-[#A8A29E]">
            <span className="material-symbols-outlined text-lg">timer</span>
            <span className="text-sm font-bold tracking-wide">Ends in: 6 days 12 hours</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 dark:border-white/10 sticky top-0 bg-[#FAF9F6] dark:bg-[#2b1e19] z-20 transition-colors shadow-sm dark:shadow-none">
        {['Mission', 'Top Teachers', 'Rewards'].map((tab) => {
          const tabKey = tab === 'Mission' ? 'details' : tab === 'Top Teachers' ? 'leaderboard' : 'prizes';
          const isActive = activeTab === tabKey;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tabKey as any)}
              className={`flex-1 py-4 text-sm font-bold transition-all relative ${isActive
                  ? 'text-[#cf6317] dark:text-white'
                  : 'text-stone-500 dark:text-[#A8A29E] hover:text-stone-700 dark:hover:text-stone-300'
                }`}
            >
              {tab}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-[#cf6317] rounded-t-full"></div>
              )}
            </button>
          )
        })}
      </div>

      <main className="flex-1 p-5 pb-32 overflow-y-auto">

        {activeTab === 'details' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

            {/* Goal Card */}
            <div className="bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-lg flex gap-4 items-start relative overflow-hidden">
              {/* Decorative background circle */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#cf6317]/10 rounded-full blur-xl pointer-events-none"></div>

              <div className="w-12 h-12 rounded-xl bg-[#cf6317]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#cf6317] text-2xl">school</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-white mb-1">Goal: {activeChallenge.goal || 'Contribute'}</h3>
                <p className="text-sm text-stone-600 dark:text-[#A8A29E] leading-relaxed">
                  {activeChallenge.desc}
                </p>
              </div>
            </div>

            {/* Project Progress */}
            {activeChallenge.progress !== null && activeChallenge.progress !== undefined && (
              <div className="bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-lg">
                <div className="flex justify-between items-end mb-3">
                  <h3 className="font-bold text-lg text-stone-900 dark:text-white">Community Progress</h3>
                  <span className="text-[#cf6317] font-bold text-lg">{activeChallenge.progress}%<span className="text-sm text-stone-500 dark:text-[#A8A29E] font-medium"> Complete</span></span>
                </div>
                <div className="h-4 bg-stone-100 dark:bg-black/40 rounded-full overflow-hidden mb-3 border border-stone-200 dark:border-white/5">
                  <div className="h-full bg-[#cf6317] rounded-full shadow-[0_0_10px_rgba(207,99,23,0.5)]" style={{ width: `${activeChallenge.progress}%` }}></div>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-stone-400 dark:text-[#A8A29E]">
                  <span>{100 - (activeChallenge.progress || 0)}% Remaining</span>
                  <span>12 Contributors</span>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div>
              <h3 className="font-bold text-xl text-stone-900 dark:text-white mb-4">Instructions</h3>
              <ul className="space-y-4">
                {[
                  "Review the prompt provided in the challenge.",
                  `Provide your contribution in ${activeChallenge.inputMode === 'Voice' ? 'audio format' : 'text format'}.`,
                  "Ensure accuracy and cultural relevance.",
                  "Submit for community review."
                ].map((rule, idx) => (
                  <li key={idx} className="flex gap-4 items-start group">
                    <span className="flex-shrink-0 w-8 h-8 bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5 group-hover:bg-[#cf6317] group-hover:text-white transition-colors duration-300">
                      {idx + 1}
                    </span>
                    <span className="text-stone-700 dark:text-[#E7E5E4] text-base leading-relaxed pt-0.5">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="bg-white dark:bg-[#42342b] rounded-2xl p-6 border border-stone-200 dark:border-white/5 shadow-sm dark:shadow-lg">
              <h3 className="font-bold text-stone-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-500">trophy</span>
                Top Teachers
              </h3>
              <div className="space-y-6">
                {[
                  { rank: 1, name: 'Kamau Njoroge', count: '22 Contributions', verified: 20, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCf35EoI1LYG_Z-DVruXrhf48EMhNAfhAbaIoN6aNxIOA7VWp8i9i-bmGhJmE0dqxwKZOscNOyTdZhqM8oDoilkrWcTxcmgWw_9TKUo8f2ASQEfAbbjXAelehx2KYPAN8W1qBGBDnvXJmTlMbdPIdPtbLjIMEeo6jhXcD7OkpFeAa7ECkhmLX-DoyYLYn3mUQ7yRcrIkO3DdTcFC-tZ0hxx31yGdTsr7k-44mC1gpIEDYR6Jk63r6sc1JtxESZ_z8CzlfVQD_p38c', trophyColor: 'text-yellow-400' },
                  { rank: 2, name: 'Wanjiku Mwangi', count: '18 Contributions', verified: 15, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHGQCh7G1VnjuVj9331GPw-eizTILg3UcwDA4ENWzw4Y4k-YeCgWzwUxAmYXQWIcfUfbQwVHw6sT-X-LP9EspDfXqNOQnm6QUcAN3d9HAxoEJ5kesDAP6W6EUQ6odygBf2Q2-wGIcEgisM6jeCizwsbd9roCE4EDfeK74dHdCooeQh3_eioZBLFJNPfGi8Cp4ke9oJ11DKdl5pNseP-GKgaT-tyieX9Uimavj73AayhR3msq3f9Dcw-BdgSJNRK5-7MQYX9T0wH_8', trophyColor: 'text-gray-400' },
                  { rank: 3, name: 'Maina K', count: '10 Contributions', verified: 9, avatar: '...', trophyColor: 'text-rasta-gold' },
                ].map((user) => (
                  <div key={user.rank} className="flex items-center gap-4">
                    <span className={`w-6 text-center font-bold text-lg ${user.rank === 1 ? 'text-yellow-500 scale-125' : 'text-stone-400'}`}>{user.rank}</span>
                    <button
                      onClick={() => onViewProfile({
                        name: user.name,
                        handle: user.name.toLowerCase().replace(' ', '_'),
                        avatar: user.avatar,
                        isGuest: false
                      })}
                      className="flex items-center gap-3 flex-1 group"
                    >
                      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover group-hover:ring-2 ring-[#cf6317] transition-all" />
                      <div className="flex-1 text-left">
                        <p className="font-bold text-stone-900 dark:text-white group-hover:text-[#cf6317] transition-colors">{user.name}</p>
                        <p className="text-xs text-stone-500 dark:text-[#A8A29E] font-medium">{user.count} • <span className="text-green-600 dark:text-green-400">{user.verified} verified</span></p>
                      </div>
                    </button>
                    <span className={`material-symbols-outlined text-2xl ${user.trophyColor}`}>emoji_events</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prizes' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-5xl text-yellow-600 dark:text-yellow-500">school</span>
              </div>
              <h3 className="font-bold text-2xl text-stone-900 dark:text-white mb-2">Mwalimu Badge</h3>
              <p className="text-stone-700 dark:text-[#A8A29E] mb-6 max-w-xs mx-auto">Earn the official "Teacher" badge + 500 XP to showcase your expertise.</p>
              <div className="inline-block px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-sm font-bold rounded-lg border border-yellow-200 dark:border-yellow-700/30">
                Top 3 Contributors
              </div>
            </div>

            <div className="bg-[#cf6317]/5 border border-[#cf6317]/20 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-20 h-20 bg-[#cf6317]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-5xl text-[#cf6317]">local_library</span>
              </div>
              <h3 className="font-bold text-2xl text-stone-900 dark:text-white mb-2">Helper Badge</h3>
              <p className="text-stone-700 dark:text-[#A8A29E] mb-6 max-w-xs mx-auto">A special badge for those who consistently help others learn.</p>
              <div className="inline-block px-4 py-2 bg-[#cf6317]/10 text-[#cf6317] text-sm font-bold rounded-lg border border-[#cf6317]/20">
                Minimum 5 submissions
              </div>
            </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-[#2b1e19]/90 backdrop-blur-md border-t border-stone-200 dark:border-white/5 space-y-3 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <button onClick={() => navigate(Screen.SUBMIT_ENTRY, { challenge: activeChallenge })} className="w-full bg-[#cf6317] hover:bg-[#b05210] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]">
          {activeChallenge.inputMode === 'Voice' && <span className="material-symbols-outlined text-2xl">mic</span>}
          {activeChallenge.inputMode === 'Translation' && <span className="material-symbols-outlined text-2xl">translate</span>}
          {activeChallenge.inputMode !== 'Voice' && activeChallenge.inputMode !== 'Translation' && <span className="material-symbols-outlined text-2xl">add_circle</span>}
          Contribute Now
        </button>
        <button onClick={handleShare} className="w-full bg-transparent hover:bg-stone-100 dark:hover:bg-white/5 text-stone-700 dark:text-[#A8A29E] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors border-2 border-stone-200 dark:border-white/10">
          <span className="material-symbols-outlined text-xl">share</span>
          Invite Contributors
        </button>
      </div>
    </div>
  );
};

export default ChallengeDetailsScreen;
