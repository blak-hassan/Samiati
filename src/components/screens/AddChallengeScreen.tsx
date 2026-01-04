
import React, { useState } from 'react';
import { Screen, ChallengeType } from '@/types';

interface Props {
  navigate: (screen: Screen, params?: any) => void;
  goBack: () => void;
}

const AddChallengeScreen: React.FC<Props> = ({ navigate, goBack }) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ChallengeType | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    goalCount: 50,
    deadline: '7 Days',
    invitees: [] as string[]
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const PROJECT_TYPES: { type: ChallengeType; label: string; icon: string; desc: string; color: string }[] = [
    { type: 'ACCENT', label: 'Accent Preservation', icon: 'mic', desc: 'Collect audio recordings of local accents.', color: 'bg-red-500' },
    { type: 'DIALECT', label: 'Dialect Mapping', icon: 'map', desc: 'Pin specific dialect variations on a map.', color: 'bg-green-600' },
    { type: 'ALPHABET', label: 'Alphabet Creation', icon: 'border_color', desc: 'Design or document scripts/symbols.', color: 'bg-blue-600' },
    { type: 'TOTEM', label: 'Totem Registry', icon: 'photo_camera', desc: 'Archive photos and histories of totems.', color: 'bg-amber-600' },
  ];

  const handleTypeSelect = (type: ChallengeType) => {
    setSelectedType(type);
    handleNext();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] dark:bg-[#2b1e19] text-stone-900 dark:text-white transition-colors duration-300 font-display">
      {/* Header */}
      <header className="flex items-center p-4 sticky top-0 bg-[#FAF9F6]/90 dark:bg-[#2b1e19]/90 backdrop-blur-md z-20">
        <button onClick={step === 1 ? goBack : handleBack} className="p-2 -ml-2 text-stone-500 hover:text-[#cf6317] transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold">Start a Movement</h1>
          <div className="flex justify-center gap-1 mt-1">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1 w-8 rounded-full transition-colors ${step >= i ? 'bg-[#cf6317]' : 'bg-stone-200 dark:bg-white/10'}`} />
            ))}
          </div>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 p-6 pb-32 max-w-lg mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* STEP 1: CHOOSE TYPE */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white">Choose Your Mission</h2>
              <p className="text-stone-500 dark:text-[#A8A29E]">What part of heritage needs saving today?</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => handleTypeSelect(t.type)}
                  className="relative group overflow-hidden bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/5 p-6 rounded-2xl flex items-center gap-5 hover:border-[#cf6317] hover:shadow-lg transition-all text-left"
                >
                  <div className={`w-14 h-14 rounded-full ${t.color} bg-opacity-10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <span className={`material-symbols-outlined text-2xl ${t.color.replace('bg-', 'text-')}`}>{t.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-stone-900 dark:text-white group-hover:text-[#cf6317] transition-colors">{t.label}</h3>
                    <p className="text-sm text-stone-500 dark:text-[#A8A29E] leading-relaxed">{t.desc}</p>
                  </div>
                  <span className="material-symbols-outlined text-stone-300 group-hover:text-[#cf6317] transition-colors">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: DEFINE GOALS */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center space-y-2 mb-4">
              <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white">Define Success</h2>
              <p className="text-stone-500 dark:text-[#A8A29E]">Set a target to motivate the community.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Project Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. The Great Kikuyu Archive"
                  className="w-full bg-white dark:bg-[#42342b] border-2 border-stone-200 dark:border-white/10 rounded-xl p-4 font-bold text-lg text-stone-900 dark:text-white placeholder-stone-300 focus:border-[#cf6317] outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Target Goal</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.goalCount}
                      onChange={(e) => setFormData({ ...formData, goalCount: parseInt(e.target.value) })}
                      className="w-full bg-white dark:bg-[#42342b] border-2 border-stone-200 dark:border-white/10 rounded-xl p-4 font-bold text-lg text-stone-900 dark:text-white focus:border-[#cf6317] outline-none transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">ITEMS</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Duration</label>
                  <select
                    className="w-full bg-white dark:bg-[#42342b] border-2 border-stone-200 dark:border-white/10 rounded-xl p-4 font-bold text-lg text-stone-900 dark:text-white focus:border-[#cf6317] outline-none transition-colors appearance-none"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  >
                    <option>3 Days</option>
                    <option>7 Days</option>
                    <option>30 Days</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-xl flex gap-3">
                <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-500">lightbulb</span>
                <p className="text-sm text-stone-700 dark:text-[#A8A29E]">
                  <strong>Pro tip:</strong> Projects with clear, achievable goals (like "50 Recordings") get 3x more contributions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: INVITE SQUAD */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white">Assemble Your Squad</h2>
              <p className="text-stone-500 dark:text-[#A8A29E]">Who are the best experts for this task?</p>
            </div>

            <div className="bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-stone-100 dark:divide-white/5">
              {[
                { name: 'Wanjiku M.', avatar: 'WM', selected: true },
                { name: 'Ochieng J.', avatar: 'OJ', selected: false },
                { name: 'Kamau K.', avatar: 'KK', selected: true },
                { name: 'Aisha S.', avatar: 'AS', selected: false },
              ].map((user, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-black/20 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-white/10 flex items-center justify-center font-bold text-stone-600 dark:text-stone-400">
                      {user.avatar}
                    </div>
                    <span className="font-bold text-stone-700 dark:text-white">{user.name}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${user.selected ? 'bg-[#cf6317] border-[#cf6317]' : 'border-stone-300 dark:border-white/20'}`}>
                    {user.selected && <span className="material-symbols-outlined text-white text-sm">check</span>}
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full py-4 rounded-xl border-2 border-dashed border-stone-300 dark:border-white/20 text-stone-500 dark:text-stone-400 font-bold hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
              + Copy Invite Link
            </button>
          </div>
        )}

      </main>

      {/* Footer Actions */}
      <footer className="sticky bottom-0 z-20 bg-white/90 dark:bg-[#2b1e19]/90 backdrop-blur-md p-4 border-t border-stone-200 dark:border-white/5 transition-colors">
        {step === 1 ? (
          <div className="text-center text-xs text-stone-400 font-bold uppercase tracking-widest pb-2">Select a type to proceed</div>
        ) : (
          <button
            onClick={step === 3 ? () => navigate(Screen.CHALLENGE_DETAILS, {
              challenge: {
                id: 'new-1',
                title: formData.title || 'New Project',
                description: `A collaborative ${selectedType?.toLowerCase()} project.`,
                type: selectedType,
                goalCount: formData.goalCount,
                currentCount: 0,
                goalMetric: 'Entries',
                image: 'https://images.unsplash.com/photo-1544985335-7c2a74c10648?auto=format&fit=crop&q=80&w=2000' // Placeholder
              }
            }) : handleNext}
            className="w-full bg-[#cf6317] hover:bg-[#b05210] text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {step === 3 ? 'Launch Project 🚀' : 'Continue'}
          </button>
        )}
      </footer>
    </div>
  );
};

export default AddChallengeScreen;

