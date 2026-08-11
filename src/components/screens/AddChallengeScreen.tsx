
import React, { useState } from 'react';
import { NavigateFn, Screen, ChallengeType, InputType, ChallengeInputField } from '@/types';
import { useUser } from '@/app/MockProviders';

interface Props {
  navigate: NavigateFn;
  goBack: () => void;
  onLaunch?: (challenge: { title: string; description: string; type: ChallengeType; goalCount: number }) => Promise<void>;
  isSubmitting?: boolean;
}

const AddChallengeScreen: React.FC<Props> = ({ navigate, goBack, onLaunch, isSubmitting }) => {
  const { addChallenge } = useUser();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ChallengeType | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    goalCount: 50,
    deadline: '7 Days',
    invitees: [] as string[],
    goalDescription: '',
    inputSchema: [
      { id: '1', type: 'AUDIO', label: 'Audio Recording', required: true }
    ] as ChallengeInputField[]
  });
  const [customMission, setCustomMission] = useState('');

  // Squad State
  const [squad, setSquad] = useState([
    { name: 'Wanjiku M.', avatar: 'WM', selected: true },
    { name: 'Ochieng J.', avatar: 'OJ', selected: false },
    { name: 'Kamau K.', avatar: 'KK', selected: true },
    { name: 'Aisha S.', avatar: 'AS', selected: false },
  ]);

  const [suggestions, setSuggestions] = useState([
    { name: 'Dr. Ali', avatar: 'DA', role: 'Linguist' },
    { name: 'Mama Z.', avatar: 'MZ', role: 'Elder' },
    { name: 'Kevo', avatar: 'K', role: 'Historian' },
    { name: 'Sarah', avatar: 'S', role: 'Teacher' },
  ]);

  const handleAddToSquad = (user: typeof suggestions[0]) => {
    setSquad([...squad, { ...user, selected: true }]);
    setSuggestions(suggestions.filter(s => s.name !== user.name));
  };

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

  const handleCustomTypeSelect = () => {
    if (!customMission.trim()) return;
    setSelectedType('CUSTOM');
    // Pre-fill the title with the custom mission name
    setFormData(prev => ({ ...prev, title: customMission }));
    handleNext();
  };

  const getChallengeTitle = () => {
    if (formData.title.trim()) return formData.title.trim();
    if (customMission.trim()) return customMission.trim();

    const projectType = PROJECT_TYPES.find((project) => project.type === selectedType);
    return projectType ? projectType.label : 'New Project';
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
                placeholder="Name your mission (e.g. Digital Museum)"
                className="flex-1 bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/10 rounded-xl p-4 text-stone-900 dark:text-white focus:border-[#cf6317] outline-none transition-colors"
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

        {/* STEP 2: DEFINE GOALS */}
        {
          step === 2 && (
            <div className="space-y-8">
              <div className="text-center space-y-2 mb-4">
                <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white">Define Success</h2>
                <p className="text-stone-500 dark:text-[#A8A29E]">Set a target to motivate the community.</p>
              </div>


              <div className="space-y-6">
                {/* Goal Description */}
                <div>
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Goal Description</label>
                  <textarea
                    value={formData.goalDescription}
                    onChange={(e) => setFormData({ ...formData, goalDescription: e.target.value })}
                    placeholder="Describe what success looks like (e.g. We need 50 recordings of the elders in the village...)"
                    className="w-full bg-white dark:bg-[#42342b] border-2 border-stone-200 dark:border-white/10 rounded-xl p-4 font-medium text-lg text-stone-900 dark:text-white placeholder-stone-300 focus:border-[#cf6317] outline-none transition-colors min-h-[120px] resize-y"
                  />
                </div>

                {/* Submission Inputs Builder */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-bold text-stone-700 dark:text-stone-300">Submission Requirements</label>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">What creators submit</span>
                  </div>

                  <div className="space-y-3">
                    {formData.inputSchema.map((input, index) => (
                      <div key={input.id} className="bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/10 p-4 rounded-xl flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center text-stone-500">
                          <span className="material-symbols-outlined">
                            {input.type === 'AUDIO' ? 'mic' :
                              input.type === 'VIDEO' ? 'videocam' :
                                input.type === 'IMAGE' ? 'image' :
                                  input.type === 'LOCATION' ? 'location_on' : 'text_fields'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              value={input.label}
                              onChange={(e) => {
                                const newSchema = [...formData.inputSchema];
                                newSchema[index].label = e.target.value;
                                setFormData({ ...formData, inputSchema: newSchema });
                              }}
                              className="font-bold text-stone-900 dark:text-white bg-transparent outline-none focus:underline decoration-[#cf6317]"
                            />
                            <span className="material-symbols-outlined text-stone-300 text-sm cursor-help" title="Click to rename">edit</span>
                          </div>
                          <div className="text-xs text-stone-400 font-medium flex gap-2">
                            <span>{input.type}</span>
                            <span>•</span>
                            <button
                              onClick={() => {
                                const newSchema = [...formData.inputSchema];
                                newSchema[index].required = !newSchema[index].required;
                                setFormData({ ...formData, inputSchema: newSchema });
                              }}
                              className={`${input.required ? 'text-[#cf6317]' : 'text-stone-300'} font-bold hover:underline`}
                            >
                              {input.required ? 'Required' : 'Optional'}
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newSchema = formData.inputSchema.filter((_, i) => i !== index);
                            setFormData({ ...formData, inputSchema: newSchema });
                          }}
                          className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    ))}

                    {/* Add Field Button */}
                    <div className="flex gap-2 flex-wrap">
                      {(['TEXT', 'AUDIO', 'VIDEO', 'IMAGE', 'LOCATION'] as InputType[]).map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            const newField: ChallengeInputField = {
                              id: Math.random().toString(36).substr(2, 9),
                              type,
                              label: type === 'TEXT' ? 'Description' :
                                type === 'AUDIO' ? 'Recording' :
                                  type === 'VIDEO' ? 'Video Clip' :
                                    type === 'IMAGE' ? 'Photo' : 'Location',
                              required: true
                            };
                            setFormData({ ...formData, inputSchema: [...formData.inputSchema, newField] });
                          }}
                          className="px-3 py-2 rounded-lg border border-dashed border-stone-300 dark:border-white/20 text-xs font-bold text-stone-500 hover:bg-stone-50 dark:hover:bg-white/5 hover:text-[#cf6317] hover:border-[#cf6317] transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* STEP 3: INVITE SQUAD */}
        {
          step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white">Assemble Your Squad</h2>
                <p className="text-stone-500 dark:text-[#A8A29E]">Who are the best experts for this task?</p>
              </div>

              <div className="bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-stone-100 dark:divide-white/5">
                {squad.map((user, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const newSquad = [...squad];
                      newSquad[idx].selected = !newSquad[idx].selected;
                      setSquad(newSquad);
                    }}
                    className="p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-black/20 cursor-pointer"
                  >
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

              {/* Suggestions Section */}
              {suggestions.length > 0 && (
                <div className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-bold text-stone-700 dark:text-stone-300">Suggested Experts</h3>
                    <span className="text-xs text-stone-400">Based on your mission</span>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                    {suggestions.map((user, idx) => (
                      <div
                        key={idx}
                        className="snap-center shrink-0 w-32 bg-white dark:bg-[#42342b] border border-stone-200 dark:border-white/5 rounded-xl p-3 flex flex-col items-center gap-2 text-center shadow-sm"
                      >
                        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center font-bold text-[#cf6317]">
                          {user.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-stone-900 dark:text-white truncate w-full">{user.name}</div>
                          <div className="text-xs text-stone-400">{user.role}</div>
                        </div>
                        <button
                          onClick={() => handleAddToSquad(user)}
                          className="mt-1 w-full py-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Add +
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }

      </main>

      {/* Footer Actions */}
      <footer className="sticky bottom-0 z-20 bg-white/90 dark:bg-[#2b1e19]/90 backdrop-blur-md p-4 border-t border-stone-200 dark:border-white/5 transition-colors">
        {step === 1 ? (
          <div className="text-center text-xs text-stone-400 font-bold uppercase tracking-widest pb-2">Select a type to proceed</div>
        ) : (
<button
            onClick={step === 3 ? async () => {
              const challengeData = {
                title: getChallengeTitle(),
                description: formData.goalDescription || `A collaborative ${selectedType?.toLowerCase()} project.`,
                type: selectedType!,
                goalCount: formData.goalCount,
              };
              
              if (onLaunch) {
                await onLaunch(challengeData);
              } else {
                const newChallenge = {
                  id: `new-${Date.now()}`,
                  ...challengeData,
                  inputSchema: formData.inputSchema,
                  currentCount: 0,
                  goalMetric: 'Entries',
                  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  image: 'https://images.unsplash.com/photo-1544985335-7c2a74c10648?auto=format&fit=crop&q=80&w=2000'
                };
                addChallenge(newChallenge);
                window.location.href = '/dashboard/challenges';
              }
            } : handleNext}
            disabled={isSubmitting}
            className="w-full bg-[#cf6317] hover:bg-[#b05210] text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Launching...' : step === 3 ? 'Launch Project 🚀' : 'Continue'}
          </button>
        )}
      </footer>
    </div >
  );
};

export default AddChallengeScreen;

