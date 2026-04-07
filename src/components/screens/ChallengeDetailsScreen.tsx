
import React, { useState } from 'react';
import { Challenge, NavigateFn, Screen, User } from '@/types';
import { ProjectHero } from '@/components/changa/ProjectHero';
import { SquadList } from '@/components/changa/SquadList';
import { AccentRecorder } from '@/components/changa/inputs/AccentRecorder';
import { DialectMapper } from '@/components/changa/inputs/DialectMapper';
import { TotemUploader } from '@/components/changa/inputs/TotemUploader';

interface Props {
  navigate: NavigateFn;
  goBack: () => void;
  onViewProfile?: (user: User) => void;
  unreadCount?: number;
  challenge?: Challenge;
}

const DEFAULT_CHALLENGE: Challenge = {
  id: 'c1',
  title: 'The Kikuyu 100',
  description: 'Help us translate the 100 most common words into Kikuyu.',
  type: 'TRANSLATION', // Default fallback
  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgGK4HiP_WY3pOD4a5vjGWGtQqUUhOEyj94mc4Il4W9cK7uPISoDqA2_rAz6yx1hMgSr8B5pR8Q6cUCf4E81l5Yo--0f2oCHKyYXaSMxJOQKq6tn9MI-Cjx-_4Er3rmI0A8aTcqHLHpt7l2rEFyWita0CSiwer0MhunOiGwr3xKNC0bD-0tv8nalLieXnnzrSwIA5w9S3Fmuvy2UtBjpw7MdkR-USmYOn1ZIjsdIHGV9bFOVr97G958mCv7m40Q8Pa3Wq6A3Td9dk',
  goalMetric: 'Words',
  goalCount: 100,
  currentCount: 64,
  roles: [
    { userId: 'Kamau', role: 'LEAD' },
    { userId: 'Wanjiku', role: 'CONTRIBUTOR' },
    { userId: 'Ochieng', role: 'CONTRIBUTOR' }
  ]
};

const ChallengeDetailsScreen: React.FC<Props> = ({ navigate, goBack, challenge }) => {
  const activeChallenge = challenge || DEFAULT_CHALLENGE;
  const [activeTab, setActiveTab] = useState<'board' | 'squad' | 'discussion'>('board');
  const tabs: Array<{ label: string; key: 'board' | 'squad' | 'discussion' }> = [
    { label: 'Project Board', key: 'board' },
    { label: 'The Squad', key: 'squad' },
    { label: 'War Room', key: 'discussion' },
  ];

  const renderInput = () => {
    switch (activeChallenge.type) {
      case 'ACCENT': return <AccentRecorder />;
      case 'DIALECT': return <DialectMapper />;
      case 'TOTEM': return <TotemUploader />;
      default: return (
        <div className="p-8 text-center border-2 border-dashed border-stone-200 dark:border-white/10 rounded-2xl">
          <p className="text-stone-500">Standard text contribution input would go here.</p>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#2b1e19] text-stone-900 dark:text-white transition-colors duration-300 font-display">

      {/* Navbar Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pointer-events-none">
        <button onClick={goBack} className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/30 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <ProjectHero challenge={activeChallenge} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs */}
            <div className="flex border-b border-stone-200 dark:border-white/10">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-6 py-4 font-bold text-sm transition-colors relative ${isActive ? 'text-[#cf6317]' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'}`}
                  >
                    {tab.label}
                    {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#cf6317]" />}
                  </button>
                )
              })}
            </div>

            {activeTab === 'board' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Contribution Input Area */}
                <div>
                  <h3 className="font-bold text-xl mb-4">Add Contribution</h3>
                  {renderInput()}
                </div>

                {/* Recent Contributions Feed (Mock) */}
                <div>
                  <h3 className="font-bold text-xl mb-4 text-stone-900 dark:text-white">Recent Entries</h3>
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white dark:bg-[#42342b] p-4 rounded-xl border border-stone-200 dark:border-white/5 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-white/10"></div>
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-stone-100 dark:bg-white/5 rounded mb-2"></div>
                          <div className="h-3 w-3/4 bg-stone-50 dark:bg-white/5 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'squad' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SquadList roles={activeChallenge.roles || []} />
              </div>
            )}

            {activeTab === 'discussion' && (
              <div className="p-12 text-center text-stone-400 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                <p>Discussion board for coordinating spellings and standards.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#cf6317] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <h3 className="font-bold text-2xl mb-1">Invite Collaborators</h3>
              <p className="text-white/80 text-sm mb-6">This project needs 5 more dialects mapped.</p>
              <button className="w-full py-3 bg-white text-[#cf6317] font-extrabold rounded-xl shadow-md hover:bg-stone-50 transition-colors">
                Copy Invite Link
              </button>
            </div>

            <div className="bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/5 rounded-2xl p-6">
              <h4 className="font-bold text-stone-900 dark:text-white mb-4">Project Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Created</span>
                  <span className="font-bold dark:text-white">2 days ago</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Deadline</span>
                  <span className="font-bold text-red-500">4 days left</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ChallengeDetailsScreen;


