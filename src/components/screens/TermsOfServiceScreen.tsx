
import React from 'react';

interface Props {
  goBack: () => void;
}

const TermsOfServiceScreen: React.FC<Props> = ({ goBack }) => {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-[#2b1e19] transition-colors duration-300">
      <header className="flex items-center p-4 sticky top-0 bg-stone-50 dark:bg-[#2b1e19] z-10 border-b border-stone-200 dark:border-white/5">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-stone-900 dark:text-white ml-2">Terms of Service</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 text-stone-800 dark:text-[#E7E5E4] leading-relaxed text-sm">
        <h2 className="text-lg font-bold mb-3 text-stone-900 dark:text-white">1. Introduction</h2>
        <p className="mb-4">Welcome to Samiati. By accessing or using our mobile application, you agree to be bound by these Terms of Service.</p>

        <h2 className="text-lg font-bold mb-3 text-stone-900 dark:text-white">2. User Conduct</h2>
        <p className="mb-4">You agree not to use the App for any unlawful purpose or in any way that interrupts, damages, or impairs the service.</p>

        <h2 className="text-lg font-bold mb-3 text-stone-900 dark:text-white">3. Content Ownership</h2>
        <p className="mb-4">You retain ownership of the content you post, but you grant Samiati a non-exclusive license to use, store, and copy that content.</p>

        <h2 className="text-lg font-bold mb-3 text-stone-900 dark:text-white">4. Termination</h2>
        <p className="mb-4">We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever.</p>

        <h2 className="text-lg font-bold mb-3 text-stone-900 dark:text-white">5. Changes to Terms</h2>
        <p className="mb-4">We reserve the right, at our sole discretion, to modify or replace these Terms at any time.</p>
        
        <div className="h-10"></div>
      </main>
    </div>
  );
};

export default TermsOfServiceScreen;
