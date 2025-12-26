import React from 'react';
import { Person } from '@/hooks/useWatuFilters';
import { Star, BadgeCheck, Users } from 'lucide-react';

interface WatuUserCardProps {
    person: Person;
    isSelectContactMode?: boolean;
    onUserClick: (person: Person) => void;
    onToggleFollow: (id: string) => void;
    showMutualConnections?: boolean;
}

export const WatuUserCard: React.FC<WatuUserCardProps> = ({
    person,
    isSelectContactMode = false,
    onUserClick,
    onToggleFollow,
    showMutualConnections = false
}) => {
    return (
        <div
            onClick={() => onUserClick(person)}
            className={`${isSelectContactMode
                ? 'px-4 py-3 hover:bg-stone-50 dark:hover:bg-white/5 border-b border-stone-100 dark:border-white/5 bg-white dark:bg-surface-dark rounded-none'
                : 'bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-stone-200 dark:border-white/5 hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30'
                } flex items-center gap-4 transition-all cursor-pointer group`}
        >
            <div className="relative">
                <img
                    src={person.avatar}
                    alt={person.name}
                    className={`${isSelectContactMode ? 'w-10 h-10' : 'w-14 h-14'} rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/20 transition-all`}
                />
                {!isSelectContactMode && person.contributionCount && person.contributionCount > 50 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center p-0.5" title="Top Contributor">
                        <Star className="w-3 h-3 text-white fill-current" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-stone-900 dark:text-white truncate ${isSelectContactMode ? 'text-base' : 'text-lg'}`}>
                            {person.name}
                        </h3>
                        {!isSelectContactMode && person.contributionCount && person.contributionCount > 100 && (
                            <BadgeCheck className="w-4 h-4 text-primary fill-current/10" />
                        )}
                    </div>
                    {isSelectContactMode ? (
                        <p className="text-sm text-stone-500 dark:text-text-muted truncate">
                            {person.about || 'Hey there! I am using Samiati.'}
                        </p>
                    ) : (
                        <p className="text-xs text-stone-500 dark:text-text-muted truncate">
                            {person.handle} • {person.role}
                        </p>
                    )}
                </div>

                {!isSelectContactMode && (
                    <>
                        <div className="flex flex-wrap gap-1 mt-2">
                            <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-white/10 rounded text-[10px] font-medium text-stone-600 dark:text-stone-300">
                                {person.region}
                            </span>
                            {person.languages.slice(0, 2).map(l => (
                                <span key={l} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium">
                                    {l}
                                </span>
                            ))}
                            {person.languages.length > 2 && (
                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium">
                                    +{person.languages.length - 2}
                                </span>
                            )}
                        </div>

                        {showMutualConnections && (
                            <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-text-muted mt-1">
                                <Users className="w-3 h-3" />
                                <span>3 mutual connections</span>
                            </div>
                        )}

                        {person.contributionCount && (
                            <p className="text-xs text-stone-500 dark:text-text-muted mt-1">
                                {person.contributionCount} contributions
                            </p>
                        )}
                    </>
                )}
            </div>

            {!isSelectContactMode && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFollow(person.id);
                    }}
                    className={`h-9 px-4 rounded-full text-sm font-bold transition-all ${person.isFollowing
                        ? 'bg-transparent border border-stone-300 dark:border-white/20 text-stone-600 dark:text-white hover:bg-stone-50 dark:hover:bg-white/5 hover:border-error hover:text-error'
                        : 'bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md'
                        }`}
                    aria-label={person.isFollowing ? `Unfollow ${person.name}` : `Follow ${person.name}`}
                >
                    <span className="group-hover:hidden">{person.isFollowing ? 'Following' : 'Follow'}</span>
                    <span className="hidden group-hover:inline">{person.isFollowing ? 'Unfollow' : 'Follow'}</span>
                </button>
            )}
        </div>
    );
};
