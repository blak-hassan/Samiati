
import React from 'react';

interface Props {
  goBack: () => void;
}

const OpenSourceLicensesScreen: React.FC<Props> = ({ goBack }) => {
  const licenses = [
    { name: 'React', version: '18.2.0', license: 'MIT' },
    { name: 'Tailwind CSS', version: '3.3.0', license: 'MIT' },
    { name: 'Google Generative AI SDK', version: '0.1.0', license: 'Apache-2.0' },
    { name: 'Material Symbols', version: 'Google Fonts', license: 'Apache-2.0' },
    { name: 'Lucide React', version: '0.263.1', license: 'ISC' },
    { name: 'Framer Motion', version: '10.12.16', license: 'MIT' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-[#2b1e19] transition-colors duration-300">
      <header className="flex items-center p-4 sticky top-0 bg-stone-50 dark:bg-[#2b1e19] z-10 border-b border-stone-200 dark:border-white/5">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-stone-900 dark:text-white ml-2">Open Source Licenses</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="bg-white dark:bg-[#42342b] rounded-xl shadow-sm border border-stone-200 dark:border-white/5 overflow-hidden">
            {licenses.map((lib, idx) => (
                <div key={idx} className="p-4 border-b border-stone-100 dark:border-white/5 last:border-0 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-stone-900 dark:text-white">{lib.name}</h3>
                        <span className="text-xs font-bold bg-stone-100 dark:bg-white/10 px-2 py-0.5 rounded text-stone-600 dark:text-[#A8A29E]">{lib.license}</span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-[#A8A29E]">Version {lib.version}</p>
                    <p className="text-xs text-stone-400 dark:text-white/30 mt-2 font-mono">
                        Copyright (c) 2023 {lib.name} Authors.
                    </p>
                </div>
            ))}
        </div>
        <p className="text-center text-xs text-stone-400 dark:text-white/20 mt-6 mb-8 px-4">
            This application uses open source software. We are grateful to the developers and communities who contribute to these projects.
        </p>
      </main>
    </div>
  );
};

export default OpenSourceLicensesScreen;
