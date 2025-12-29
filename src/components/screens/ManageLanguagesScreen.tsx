"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Screen, LanguageSkill } from '@/types';

interface Props {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  languages: LanguageSkill[];
  onUpdateLanguages: (languages: LanguageSkill[]) => void;
}

const AVAILABLE_LANGUAGES = ['Hausa', 'Igbo', 'Amharic', 'Zulu', 'Xhosa', 'Arabic', 'Portuguese', 'Somali', 'Oromo', 'Twi', 'Yoruba', 'Swahili', 'French', 'English'];

interface CustomSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-bold text-stone-500 dark:text-text-muted uppercase mb-2 tracking-wider">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-stone-100 dark:bg-input-bg border border-stone-200 dark:border-white/10 rounded-xl p-4 text-stone-900 dark:text-white flex items-center justify-between hover:bg-stone-200 dark:hover:bg-white/10 transition-colors focus:ring-2 focus:ring-primary/50 outline-none"
      >
        <span className="font-medium">{value}</span>
        <span className={`material-symbols-outlined transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-dark border border-stone-200 dark:border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors text-stone-900 dark:text-white flex items-center justify-between border-b border-stone-100 dark:border-white/5 last:border-0 ${value === option ? 'bg-primary/5 dark:bg-primary/10 text-primary' : ''}`}
            >
              <span className={value === option ? 'font-bold' : ''}>{option}</span>
              {value === option && <span className="material-symbols-outlined text-primary text-sm">check</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ManageLanguagesScreen: React.FC<Props> = ({ navigate, goBack, languages, onUpdateLanguages }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newLangName, setNewLangName] = useState('');
  const [newLangLevel, setNewLangLevel] = useState<'Learning' | 'Conversational' | 'Fluent' | 'Native'>('Learning');

  // Derive available languages dynamically
  const unselectedLanguages = useMemo(() => {
    return AVAILABLE_LANGUAGES.filter(lang => !languages.some(userLang => userLang.name === lang));
  }, [languages]);

  // Options for the dropdown: include current selection + unselected ones
  const dropdownOptions = useMemo(() => {
    if (newLangName && !unselectedLanguages.includes(newLangName)) {
      return [newLangName, ...unselectedLanguages].sort();
    }
    return unselectedLanguages.sort();
  }, [newLangName, unselectedLanguages]);

  const getPercent = (level: string) => {
    switch (level) {
      case 'Native': return 100;
      case 'Fluent': return 80;
      case 'Intermediate': return 50;
      case 'Conversational': return 50;
      default: return 30; // Learning
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Native': return 'bg-rasta-green';
      case 'Fluent': return 'bg-rasta-green/80';
      case 'Conversational': return 'bg-rasta-gold';
      case 'Learning': return 'bg-primary';
    }
  };

  const handleDelete = (id: string) => {
    onUpdateLanguages(languages.filter(l => l.id !== id));
  };

  const handleUpdateLevel = (id: string, newLevel: 'Learning' | 'Conversational' | 'Fluent' | 'Native') => {
    onUpdateLanguages(languages.map(l => l.id === id ? { ...l, level: newLevel, percent: getPercent(newLevel) } : l));
  };

  const startAdding = () => {
    if (unselectedLanguages.length > 0) {
      setNewLangName(unselectedLanguages[0]);
      setNewLangLevel('Learning');
    } else {
      alert("All available languages have been added!");
    }
    setIsAdding(true);
  };

  const handleAddLanguage = () => {
    if (!newLangName) return;

    if (languages.some(l => l.name === newLangName)) {
      alert("You already have this language listed.");
      return;
    }

    const newLang: LanguageSkill = {
      id: Date.now().toString(),
      name: newLangName,
      level: newLangLevel,
      percent: getPercent(newLangLevel)
    };

    onUpdateLanguages([...languages, newLang]);
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-background-dark text-stone-900 dark:text-white transition-colors duration-300 relative">
      <header className="flex items-center p-4 bg-white dark:bg-surface-dark sticky top-0 z-10 border-b border-stone-200 dark:border-white/5 transition-colors">
        <button onClick={goBack} className="p-2 -ml-2 text-stone-900 dark:text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold pr-8">Manage Languages</h1>
      </header>

      <main className="flex-1 p-4 space-y-4 pb-24 overflow-y-auto">
        <p className="text-stone-600 dark:text-text-muted text-sm mb-2">
          Showcase the languages you speak and your proficiency level to the community.
        </p>

        {languages.map(lang => (
          <div key={lang.id} className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-stone-200 dark:border-white/5 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${getLevelColor(lang.level)} shadow-sm`}>
                  {lang.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-stone-900 dark:text-white">{lang.name}</h4>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${lang.level === 'Native' ? 'text-rasta-green' :
                    lang.level === 'Fluent' ? 'text-rasta-green/80' :
                      lang.level === 'Conversational' ? 'text-rasta-gold' :
                        'text-primary'
                    }`}>
                    {lang.level}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(lang.id)}
                className="p-2 text-stone-400 hover:text-error hover:bg-error/10 rounded-full transition-colors"
                title="Remove Language"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>

            {/* Proficiency Slider / Buttons */}
            <div className="bg-stone-100 dark:bg-black/20 rounded-lg p-1 flex mt-2">
              {(['Learning', 'Conversational', 'Fluent', 'Native'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => handleUpdateLevel(lang.id, lvl)}
                  className={`flex-1 py-2 rounded-md text-[10px] sm:text-xs font-bold transition-all ${lang.level === lvl
                    ? 'bg-white dark:bg-warm-dark-brown text-stone-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-stone-500 dark:text-text-muted hover:text-stone-800 dark:hover:text-white'
                    }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={startAdding}
          className="w-full py-4 border-2 border-dashed border-stone-300 dark:border-white/20 text-stone-500 dark:text-text-muted rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-stone-50 dark:hover:bg-white/5 hover:border-primary/50 hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Add Another Language
        </button>

      </main>

      <div className="p-4 bg-white dark:bg-surface-dark border-t border-stone-200 dark:border-white/5 sticky bottom-0 z-10">
        <button
          onClick={goBack}
          className="w-full bg-stone-200 dark:bg-white/10 text-stone-900 dark:text-white font-bold py-4 rounded-xl hover:bg-stone-300 dark:hover:bg-white/20 transition-colors"
        >
          Go Back
        </button>
      </div>

      {/* Add Language Modal Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#332619] w-full sm:max-w-md rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-white/10 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-stone-900 dark:text-white">Add New Language</h3>
              <button onClick={() => setIsAdding(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-1 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <CustomSelect
                label="Language"
                value={newLangName}
                options={dropdownOptions}
                onChange={(val) => setNewLangName(val)}
              />

              <CustomSelect
                label="Proficiency"
                value={newLangLevel}
                options={['Learning', 'Conversational', 'Fluent', 'Native']}
                onChange={(val) => setNewLangLevel(val as any)}
              />

              <div className="pt-4">
                <button
                  onClick={handleAddLanguage}
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 active:scale-[0.98] text-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLanguagesScreen;

