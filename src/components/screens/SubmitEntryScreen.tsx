
import React from 'react';
import { Screen } from '@/types';

interface ChallengeParams {
    id: string;
    title: string;
    type: string;
    desc: string;
    img: string;
    goal?: string;
    progress?: number;
    inputMode?: string; // 'Translation', 'Voice', 'Recipe', 'Script', 'Riddle', 'Song', 'Totem'
}

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  challenge?: ChallengeParams;
}

const SubmitEntryScreen: React.FC<Props> = ({ navigate, goBack, challenge }) => {
  const activeChallenge = challenge || {
      id: 'default',
      title: 'The Kikuyu 100',
      type: 'Translation',
      inputMode: 'Translation',
      desc: 'Help us translate the 100 most common words.'
  };

  const isVoice = activeChallenge.inputMode === 'Voice' || activeChallenge.inputMode === 'Song';
  const isRecipe = activeChallenge.inputMode === 'Recipe';
  const isScript = activeChallenge.inputMode === 'Script';
  const isTranslation = activeChallenge.inputMode === 'Translation';

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
      <header className="flex items-center p-4 border-b border-stone-200 dark:border-white/5">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
        <div className="flex-1 text-center pr-8">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white">Teach Samiati</h2>
          <p className="text-primary text-sm font-medium">Challenge: {activeChallenge.title}</p>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-6">
        
        {/* Source Card / Prompt */}
        <div className="bg-white dark:bg-surface-dark border border-stone-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
           <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-stone-500 dark:text-text-muted uppercase tracking-wide">
                  {isTranslation ? 'Word 12 of 100' : 'Prompt'}
              </span>
              <span className="bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-white text-xs px-2 py-1 rounded font-bold">
                  {isVoice ? 'Audio' : 'English'}
              </span>
           </div>
           
           {isTranslation ? (
               <>
                <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white mb-2">"Person"</h1>
                <p className="text-sm text-stone-600 dark:text-text-muted italic">
                    Context: A human being regarded as an individual. (Singular)
                </p>
               </>
           ) : (
               <h1 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
                   {isRecipe ? "Share your recipe for: Mukimo" : 
                    isVoice ? `Record: "Habari ya asubuhi"` :
                    isScript ? "Upload an image of the script for: 'Hello'" :
                    activeChallenge.desc}
               </h1>
           )}
        </div>

        {/* Dynamic Inputs */}
        <div className="flex-1 flex flex-col gap-4">
          
          {isVoice && (
              <div className="flex flex-col items-center justify-center py-8 bg-stone-50 dark:bg-white/5 rounded-xl border-2 border-dashed border-stone-200 dark:border-white/10">
                  <div className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center mb-4 shadow-lg cursor-pointer hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-4xl">mic</span>
                  </div>
                  <p className="font-bold text-stone-900 dark:text-white">Tap to Record</p>
                  <p className="text-xs text-stone-500 dark:text-text-muted mt-1">Max 60 seconds</p>
              </div>
          )}

          {isTranslation && (
            <div className="flex-col flex">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-stone-900 dark:text-white font-bold">Translation</label>
                    <button className="text-primary text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">mic</span>
                        Record Pronunciation
                    </button>
                </div>
                <textarea 
                className="w-full flex-1 min-h-[100px] bg-stone-50 dark:bg-black/20 border-2 border-stone-200 dark:border-white/10 rounded-xl p-4 text-lg text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-text-muted focus:ring-0 focus:border-primary outline-none resize-none transition-colors"
                placeholder="e.g., Mündü"
                ></textarea>
            </div>
          )}

          {(isRecipe || isScript) && (
             <div className="flex-col flex gap-4">
                 {isRecipe && (
                     <textarea 
                        className="w-full min-h-[150px] bg-stone-50 dark:bg-black/20 border-2 border-stone-200 dark:border-white/10 rounded-xl p-4 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-text-muted focus:ring-0 focus:border-primary outline-none resize-none transition-colors"
                        placeholder="List ingredients and steps here..."
                     ></textarea>
                 )}
                 
                 <div className="border-2 border-dashed border-stone-300 dark:border-white/20 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                     <span className="material-symbols-outlined text-3xl text-stone-400 mb-2">add_photo_alternate</span>
                     <p className="font-bold text-sm text-stone-700 dark:text-stone-300">{isScript ? 'Upload Script Image' : 'Add Photo of Dish'}</p>
                 </div>
             </div>
          )}

          {/* Common Optional Field */}
          {!isVoice && (
            <div className="flex-col flex">
                <label className="text-stone-900 dark:text-white font-bold mb-2">Notes / Context</label>
                <textarea 
                className="w-full min-h-[80px] bg-white dark:bg-surface-dark border border-stone-200 dark:border-white/10 rounded-xl p-4 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition-colors"
                placeholder="Any specific usage notes, dialect info, or history?"
                ></textarea>
            </div>
          )}
        </div>
      </main>

      <div className="p-4 border-t border-stone-200 dark:border-white/5 bg-white dark:bg-background-dark">
        <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary">local_fire_department</span>
                 <span className="text-sm font-bold text-stone-700 dark:text-white">+20 XP</span>
             </div>
             <span className="text-xs text-stone-500 dark:text-text-muted">Will be reviewed by community</span>
        </div>
        <div className="flex gap-3">
            {isTranslation && (
                <button onClick={() => navigate(Screen.CHALLENGE_DETAILS)} className="flex-1 bg-transparent border border-stone-300 dark:border-white/20 hover:bg-stone-50 dark:hover:bg-white/5 text-stone-900 dark:text-white font-bold py-3.5 rounded-xl transition-colors">
                Skip Word
                </button>
            )}
            <button onClick={() => navigate(Screen.IDEA_SUBMITTED)} className={`flex-[2] bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2 ${!isTranslation ? 'w-full' : ''}`}>
                Submit Contribution
            </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitEntryScreen;
