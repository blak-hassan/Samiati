import React from 'react';
import { SearchX, FileText, UserX } from 'lucide-react';

interface WatuEmptyStateProps {
    type: 'no-results' | 'no-posts' | 'no-people';
    searchQuery?: string;
    onClearFilters?: () => void;
}

export const WatuEmptyState: React.FC<WatuEmptyStateProps> = ({ type, searchQuery, onClearFilters }) => {
    if (type === 'no-results') {
        return (
            <div className="text-center py-16 px-4">
                <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                    <SearchX className="w-10 h-10 text-stone-400 dark:text-text-muted" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">No watu found</h3>
                <p className="text-sm text-stone-500 dark:text-text-muted mb-4">
                    {searchQuery
                        ? `No results for "${searchQuery}". Try different keywords or filters.`
                        : 'Try adjusting your filters to see more people.'
                    }
                </p>
                {onClearFilters && (
                    <button
                        onClick={onClearFilters}
                        className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-hover transition-colors"
                    >
                        Clear All Filters
                    </button>
                )}
            </div>
        );
    }

    if (type === 'no-posts') {
        return (
            <div className="text-center py-16 px-4">
                <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-stone-400 dark:text-text-muted" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">No posts yet</h3>
                <p className="text-sm text-stone-500 dark:text-text-muted">
                    Follow more people to see their contributions here.
                </p>
            </div>
        );
    }

    return (
        <div className="text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto mb-4 bg-stone-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                <UserX className="w-10 h-10 text-stone-400 dark:text-text-muted" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">No people to show</h3>
            <p className="text-sm text-stone-500 dark:text-text-muted">
                Check back later for new suggestions.
            </p>
        </div>
    );
};
