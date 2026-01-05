import React, { useState, useRef, useEffect } from 'react';
import { REGIONS, ROLES, ACTIVITY_LEVELS, SORT_OPTIONS } from '@/hooks/useWatuFilters';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';

interface WatuFiltersProps {
    selectedRegion: string;
    setSelectedRegion: (region: string) => void;
    selectedLanguage: string;
    setSelectedLanguage: (language: string) => void;
    selectedRole: string;
    setSelectedRole: (role: string) => void;

    sortBy: string;
    setSortBy: (sort: string) => void;
    availableLanguages: string[];
    activeFilterCount: number;
    clearAllFilters: () => void;
}

export const WatuFilters: React.FC<WatuFiltersProps> = ({
    selectedRegion,
    setSelectedRegion,
    selectedLanguage,
    setSelectedLanguage,
    selectedRole,
    setSelectedRole,

    sortBy,
    setSortBy,
    availableLanguages,
    activeFilterCount,
    clearAllFilters
}) => {
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    return (
        <div className="space-y-3 px-4 pb-2">
            {/* Primary Filters */}


            <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase text-stone-500 dark:text-text-muted ml-1">Lang:</span>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {availableLanguages.map(lang => (
                        <button
                            key={lang}
                            onClick={() => setSelectedLanguage(lang)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedLanguage === lang
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white dark:bg-surface-dark text-stone-600 dark:text-text-muted border-stone-200 dark:border-white/10 hover:border-primary/50'
                                }`}
                            aria-label={`Filter by ${lang}`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors"
                    aria-label="Toggle advanced filters"
                >
                    <SlidersHorizontal className="w-5 h-5" />
                    <span>Advanced Filters</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                    {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 bg-primary text-white rounded-full text-xs font-bold">
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                {activeFilterCount > 0 && (
                    <button
                        onClick={clearAllFilters}
                        className="text-xs font-bold text-error hover:text-error/80 transition-colors"
                        aria-label="Clear all filters"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {/* Region Filter */}
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase text-stone-500 dark:text-text-muted ml-1">Region:</span>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {REGIONS.map(region => (
                                <button
                                    key={region}
                                    onClick={() => setSelectedRegion(region)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedRegion === region
                                        ? 'bg-stone-800 dark:bg-white text-white dark:text-stone-900 border-stone-800 dark:border-white'
                                        : 'bg-white dark:bg-surface-dark text-stone-600 dark:text-text-muted border-stone-200 dark:border-white/10 hover:border-stone-400 dark:hover:border-white/20'
                                        }`}
                                    aria-label={`Filter by ${region}`}
                                >
                                    {region}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Role Filter */}
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase text-stone-500 dark:text-text-muted ml-1">Role:</span>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {ROLES.map(role => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedRole === role
                                        ? 'bg-rasta-green text-white border-rasta-green'
                                        : 'bg-white dark:bg-surface-dark text-stone-600 dark:text-text-muted border-stone-200 dark:border-white/10 hover:border-rasta-green/50'
                                        }`}
                                    aria-label={`Filter by ${role}`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>



                    {/* Sort Filter */}
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase text-stone-500 dark:text-text-muted ml-1">Sort:</span>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {SORT_OPTIONS.map(option => (
                                <button
                                    key={option}
                                    onClick={() => setSortBy(option)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${sortBy === option
                                        ? 'bg-stone-800 dark:bg-white text-white dark:text-stone-900 border-stone-800 dark:border-white'
                                        : 'bg-white dark:bg-surface-dark text-stone-600 dark:text-text-muted border-stone-200 dark:border-white/10 hover:border-stone-400 dark:hover:border-white/20'
                                        }`}
                                    aria-label={`Sort by ${option}`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="h-px bg-stone-200 dark:bg-white/10 mt-1"></div>
        </div>
    );
};
