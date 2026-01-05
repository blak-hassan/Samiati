import React from 'react';
import { ArrowLeft, Search, X, MoreVertical } from 'lucide-react';

interface WatuHeaderProps {
    isSelectContactMode: boolean;
    peopleCount: number;
    isSearchVisible: boolean;
    setIsSearchVisible: (visible: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    goBack: () => void;
}

export const WatuHeader: React.FC<WatuHeaderProps> = ({
    isSelectContactMode,
    peopleCount,
    isSearchVisible,
    setIsSearchVisible,
    searchQuery,
    setSearchQuery,
    goBack
}) => {
    return (
        <>
            <header className="flex items-center p-4 bg-white dark:bg-surface-dark transition-colors">
                <button
                    onClick={goBack}
                    className="p-2 -ml-2 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-full transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 ml-2">
                    <h1 className="text-lg font-bold leading-tight">{isSelectContactMode ? 'Select contact' : 'Watu'}</h1>
                    {isSelectContactMode && <p className="text-xs text-stone-500 dark:text-text-muted">{peopleCount} contacts</p>}
                </div>
                {!isSelectContactMode && (
                    <button
                        onClick={() => setIsSearchVisible(!isSearchVisible)}
                        className={`p-2 -mr-2 rounded-full transition-colors ${isSearchVisible
                            ? 'text-primary bg-primary/10'
                            : 'text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5'
                            }`}
                        aria-label={isSearchVisible ? 'Hide search' : 'Show search'}
                    >
                        {isSearchVisible ? <X className="w-6 h-6" /> : <Search className="w-6 h-6" />}
                    </button>
                )}
                {isSelectContactMode && (
                    <div className="flex gap-2">
                        <button
                            className="p-2 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-full transition-colors"
                            onClick={() => setIsSearchVisible(!isSearchVisible)}
                            aria-label="Search"
                        >
                            <Search className="w-6 h-6" />
                        </button>
                        <button
                            className="p-2 -mr-2 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-white/5 rounded-full transition-colors"
                            aria-label="More options"
                        >
                            <MoreVertical className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </header>

            {/* Search Bar (Collapsible) */}
            {isSearchVisible && (
                <div className="px-4 pb-3 bg-white dark:bg-surface-dark animate-in slide-in-from-top-2 duration-200">
                    <div className="relative">
                        <div className="absolute left-4 top-3.5 text-stone-500">
                            <Search className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search watu..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-stone-100 dark:bg-black/20 border-none rounded-xl py-3 pl-12 pr-10 text-stone-900 dark:text-white placeholder-stone-400 focus:ring-2 focus:ring-primary outline-none transition-colors"
                            autoFocus
                            aria-label="Search users"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-3 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-white transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
