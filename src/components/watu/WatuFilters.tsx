import React, { useState, useRef, useEffect } from 'react';
import { REGIONS, ROLES, ACTIVITY_LEVELS, SORT_OPTIONS } from '@/hooks/useWatuFilters';
import { SlidersHorizontal, ChevronDown, Check, ArrowUpDown } from 'lucide-react';

interface WatuFiltersProps {
    selectedRegion: string;
    setSelectedRegion: (region: string) => void;
    selectedLanguage: string;
    setSelectedLanguage: (language: string) => void;
    selectedRole: string;
    setSelectedRole: (role: string) => void;
    selectedActivity: string;
    setSelectedActivity: (activity: string) => void;
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
    selectedActivity,
    setSelectedActivity,
    sortBy,
    setSortBy,
    availableLanguages,
    activeFilterCount,
    clearAllFilters
}) => {
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setShowSortDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-3 px-4 pb-2">
            {/* Primary Filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <span className="text-xs font-bold uppercase text-stone-500 dark:text-text-muted self-center mr-1">Region:</span>
                {REGIONS.map(region => (
                    <button
                        key={region}
                        onClick={() => setSelectedRegion(region)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${selectedRegion === region
                            ? 'bg-stone-800 dark:bg-white text-white dark:text-stone-900 border-stone-800 dark:border-white'
                            : 'bg-white dark:bg-surface-dark text-stone-600 dark:text-text-muted border-stone-200 dark:border-white/10 hover:border-stone-400 dark:hover:border-white/20'
                            }`}
                        aria-label={`Filter by ${region}`}
                    >
                        {region}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <span className="text-xs font-bold uppercase text-stone-500 dark:text-text-muted self-center mr-1">Lang:</span>
                {availableLanguages.map(lang => (
                    <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${selectedLanguage === lang
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white dark:bg-surface-dark text-stone-600 dark:text-text-muted border-stone-200 dark:border-white/10 hover:border-primary/50'
                            }`}
                        aria-label={`Filter by ${lang}`}
                    >
                        {lang}
                    </button>
                ))}
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
                    {/* Role Filter */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        <span className="text-xs font-bold uppercase text-stone-500 dark:text-text-muted self-center mr-1">Role:</span>
                        {ROLES.map(role => (
                            <button
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${selectedRole === role
                                    ? 'bg-rasta-green text-white border-rasta-green'
                                    : 'bg-white dark:bg-surface-dark text-stone-600 dark:text-text-muted border-stone-200 dark:border-white/10 hover:border-rasta-green/50'
                                    }`}
                                aria-label={`Filter by ${role}`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>

                    {/* Activity Filter */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        <span className="text-xs font-bold uppercase text-stone-500 dark:text-text-muted self-center mr-1">Activity:</span>
                        {ACTIVITY_LEVELS.map(activity => (
                            <button
                                key={activity}
                                onClick={() => setSelectedActivity(activity)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${selectedActivity === activity
                                    ? 'bg-green-600 text-white border-green-600'
                                    : 'bg-white dark:bg-surface-dark text-stone-600 dark:text-text-muted border-stone-200 dark:border-white/10 hover:border-green-400'
                                    }`}
                                aria-label={`Filter by ${activity}`}
                            >
                                {activity}
                            </button>
                        ))}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative" ref={sortRef}>
                        <button
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-surface-dark border border-stone-200 dark:border-white/10 text-sm font-medium text-stone-700 dark:text-white hover:border-primary transition-colors"
                            aria-label="Sort options"
                        >
                            <ArrowUpDown className="w-5 h-5" />
                            <span>Sort: {sortBy}</span>
                            <ChevronDown className={`w-5 h-5 ml-auto transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showSortDropdown && (
                            <div className="absolute left-0 top-full mt-2 w-full bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-stone-200 dark:border-white/10 overflow-hidden z-10 animate-in fade-in slide-in-from-top-2 duration-150">
                                {SORT_OPTIONS.map(option => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setSortBy(option);
                                            setShowSortDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/5 transition-colors border-b border-stone-100 dark:border-white/5 last:border-0 ${sortBy === option
                                            ? 'bg-primary/5 text-primary font-bold'
                                            : 'text-stone-700 dark:text-text-main'
                                            }`}
                                    >
                                        <span>{option}</span>
                                        {sortBy === option && <Check className="w-5 h-5" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="h-px bg-stone-200 dark:bg-white/10 mt-1"></div>
        </div>
    );
};
