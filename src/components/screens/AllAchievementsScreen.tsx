"use client";

import React, { useState } from 'react';
import { Screen } from '@/types';

interface Props {
  goBack: () => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  dateUnlocked?: string;
  category: 'Community' | 'Learning' | 'Creation' | 'Streaks';
}

const ACHIEVEMENTS: Achievement[] = [
  { id: '1', title: 'First Steps', description: 'Complete your first language lesson', icon: 'school', xp: 50, progress: 1, maxProgress: 1, isUnlocked: true, dateUnlocked: 'Oct 12, 2023', category: 'Learning' },
  { id: '2', title: 'Word Weaver', description: 'Contribute 10 new words to the dictionary', icon: 'translate', xp: 200, progress: 10, maxProgress: 10, isUnlocked: true, dateUnlocked: 'Nov 05, 2023', category: 'Creation' },
  { id: '3', title: 'Week Warrior', description: 'Maintain a 7-day Changa streak', icon: 'local_fire_department', xp: 150, progress: 7, maxProgress: 7, isUnlocked: true, dateUnlocked: 'Dec 01, 2023', category: 'Streaks' },
  { id: '4', title: 'Community Helper', description: 'Verify 50 community Changa', icon: 'verified_user', xp: 300, progress: 50, maxProgress: 50, isUnlocked: true, dateUnlocked: 'Jan 15, 2024', category: 'Community' },
  { id: '5', title: 'Storyteller', description: 'Submit 5 stories that get approved', icon: 'auto_stories', xp: 500, progress: 3, maxProgress: 5, isUnlocked: false, category: 'Creation' },
  { id: '6', title: 'Polyglot', description: 'Learn basics in 3 different languages', icon: 'language', xp: 400, progress: 1, maxProgress: 3, isUnlocked: false, category: 'Learning' },
  { id: '7', title: 'Monthly Master', description: 'Maintain a 30-day streak', icon: 'calendar_month', xp: 1000, progress: 21, maxProgress: 30, isUnlocked: false, category: 'Streaks' },
  { id: '8', title: 'Trendsetter', description: 'Have a Changa reach 100 likes', icon: 'trending_up', xp: 250, progress: 87, maxProgress: 100, isUnlocked: false, category: 'Community' },
  { id: '9', title: 'Wisdom Keeper', description: 'Save 50 proverbs to your collection', icon: 'bookmark', xp: 150, progress: 12, maxProgress: 50, isUnlocked: false, category: 'Learning' },
  { id: '10', title: 'Voice of the People', description: 'Submit 10 audio pronunciations', icon: 'mic', xp: 300, progress: 4, maxProgress: 10, isUnlocked: false, category: 'Creation' },
];

const AllAchievementsScreen: React.FC<Props> = ({ goBack }) => {
  const [filter, setFilter] = useState<'All' | 'Earned' | 'In Progress'>('All');

  const filteredAchievements = ACHIEVEMENTS.filter(a => {
    if (filter === 'Earned') return a.isUnlocked;
    if (filter === 'In Progress') return !a.isUnlocked;
    return true;
  });

  const totalXP = ACHIEVEMENTS.reduce((acc, curr) => acc + (curr.isUnlocked ? curr.xp : 0), 0);
  const earnedCount = ACHIEVEMENTS.filter(a => a.isUnlocked).length;

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-background-dark text-stone-900 dark:text-white transition-colors duration-300">
      <header className="flex items-center p-4 bg-white dark:bg-surface-dark sticky top-0 z-10 border-b border-stone-200 dark:border-white/5 transition-colors">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold pr-8">Achievements</h1>
      </header>

      <div className="p-4 bg-stone-50 dark:bg-background-dark sticky top-[60px] z-10 space-y-4">
        {/* Stats Summary */}
        <div className="bg-gradient-to-r from-stone-800 to-stone-900 dark:from-warm-dark-brown dark:to-surface-dark rounded-xl p-5 text-white shadow-lg flex justify-between items-center">
            <div className="flex flex-col items-center flex-1 border-r border-white/10">
                <span className="text-3xl font-bold text-primary">{earnedCount}</span>
                <span className="text-xs uppercase tracking-wider opacity-70">Badges Earned</span>
            </div>
            <div className="flex flex-col items-center flex-1">
                <span className="text-3xl font-bold text-yellow-400">{totalXP}</span>
                <span className="text-xs uppercase tracking-wider opacity-70">Total XP</span>
            </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-stone-200 dark:bg-white/5 rounded-lg p-1">
          {['All', 'Earned', 'In Progress'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
                filter === tab 
                  ? 'bg-white dark:bg-surface-dark text-stone-900 dark:text-white shadow-sm' 
                  : 'text-stone-500 dark:text-text-muted hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-4 pt-0 space-y-4 pb-12">
        {filteredAchievements.map(achievement => (
          <div 
            key={achievement.id} 
            className={`relative bg-white dark:bg-surface-dark rounded-xl p-4 border transition-colors ${
              achievement.isUnlocked 
                ? 'border-primary/20 dark:border-primary/20 shadow-sm' 
                : 'border-stone-200 dark:border-white/5 opacity-90'
            }`}
          >
            <div className="flex gap-4 items-start">
              {/* Icon */}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-4 transition-colors ${
                achievement.isUnlocked 
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-600 dark:text-yellow-400' 
                  : 'bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-300 dark:text-white/20'
              }`}>
                <span className="material-symbols-outlined text-3xl">{achievement.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-bold text-base truncate pr-2 ${achievement.isUnlocked ? 'text-stone-900 dark:text-white' : 'text-stone-500 dark:text-text-muted'}`}>
                    {achievement.title}
                  </h3>
                  <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                    achievement.isUnlocked 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-stone-100 dark:bg-white/10 text-stone-400 dark:text-text-muted'
                  }`}>
                    {achievement.xp} XP
                  </div>
                </div>
                
                <p className="text-sm text-stone-600 dark:text-text-muted mb-3 leading-snug">
                  {achievement.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-stone-500 dark:text-text-muted">
                        <span>Progress</span>
                        <span>{achievement.progress} / {achievement.maxProgress}</span>
                    </div>
                    <div className="h-2 bg-stone-100 dark:bg-black/30 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${achievement.isUnlocked ? 'bg-success' : 'bg-primary'}`} 
                            style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {achievement.isUnlocked && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-success">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>Unlocked on {achievement.dateUnlocked}</span>
                    </div>
                )}
              </div>
            </div>
            
            {/* Category Badge */}
            <div className="absolute top-4 right-4 hidden">
                {/* Could add category badges here if needed */}
            </div>
          </div>
        ))}
        
        {filteredAchievements.length === 0 && (
            <div className="text-center py-12 text-stone-400 dark:text-text-muted">
                <p>No achievements found in this category.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default AllAchievementsScreen;

