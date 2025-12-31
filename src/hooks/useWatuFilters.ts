import { useState, useMemo, useEffect } from 'react';

export interface Person {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    languages: string[];
    region: string;
    isFollowing: boolean;
    role?: string;
    about?: string;
    contributionCount?: number;
    lastActive?: string;
}

export const REGIONS = ['All', 'East Africa', 'West Africa', 'Southern Africa', 'North Africa', 'Central Africa', 'Diaspora'];

export const REGION_LANGUAGES_MAP: Record<string, string[]> = {
    'All': ['All', 'Swahili', 'Akan', 'Igbo', 'Yoruba', 'Zulu', 'Xhosa', 'Wolof', 'Amharic', 'Arabic', 'Twi', 'Pidgin', 'English', 'French'],
    'East Africa': ['All', 'Swahili', 'Amharic', 'Arabic', 'English'],
    'West Africa': ['All', 'Akan', 'Igbo', 'Yoruba', 'Wolof', 'Twi', 'Pidgin', 'English', 'French'],
    'Southern Africa': ['All', 'Zulu', 'Xhosa', 'English'],
    'North Africa': ['All', 'Arabic', 'French'],
    'Central Africa': ['All', 'Swahili', 'French'],
    'Diaspora': ['All', 'English', 'Swahili', 'French']
};

export const ROLES = ['All', 'Storyteller', 'Historian', 'Proverb Expert', 'Musician', 'Community Elder', 'Writer', 'Learner', 'Student'];

export const ACTIVITY_LEVELS = ['All', 'Active Today', 'Active This Week', 'Active This Month'];

export const SORT_OPTIONS = ['Recommended', 'Most Followed', 'Recently Active', 'Alphabetical'];

export function useWatuFilters(people: Person[]) {
    const [selectedLanguage, setSelectedLanguage] = useState('All');
    const [selectedRegion, setSelectedRegion] = useState('All');
    const [selectedRole, setSelectedRole] = useState('All');
    const [selectedActivity, setSelectedActivity] = useState('All');
    const [sortBy, setSortBy] = useState('Recommended');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    // Update available languages when region changes
    const availableLanguages = useMemo(() => {
        return REGION_LANGUAGES_MAP[selectedRegion] || REGION_LANGUAGES_MAP['All'];
    }, [selectedRegion]);

    // Reset selected language if it's not available in the new region
    useEffect(() => {
        if (!availableLanguages.includes(selectedLanguage)) {
            setSelectedLanguage('All');
        }
    }, [selectedRegion, availableLanguages, selectedLanguage]);

    // Filter and sort people
    const filteredPeople = useMemo(() => {
        const filtered = people.filter(person => {
            const languageMatch = selectedLanguage === 'All' || person.languages.includes(selectedLanguage);
            const regionMatch = selectedRegion === 'All' || person.region === selectedRegion;
            const roleMatch = selectedRole === 'All' || person.role === selectedRole;
            const searchMatch = searchQuery === '' ||
                person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                person.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                person.about?.toLowerCase().includes(searchQuery.toLowerCase());

            // Activity filter (mock implementation - would use real timestamps in production)
            let activityMatch = true;
            if (selectedActivity !== 'All') {
                // This would check person.lastActive in real implementation
                activityMatch = true; // For now, show all
            }

            return languageMatch && regionMatch && roleMatch && searchMatch && activityMatch;
        });

        // Sort
        if (sortBy === 'Alphabetical') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'Most Followed') {
            // Would sort by follower count in real implementation
            filtered.sort((a, b) => (b.contributionCount || 0) - (a.contributionCount || 0));
        } else if (sortBy === 'Recently Active') {
            // Would sort by lastActive timestamp in real implementation
            // For now, keep original order
        }
        // 'Recommended' keeps the original order (would use algorithm in real implementation)

        return filtered;
    }, [people, selectedLanguage, selectedRegion, selectedRole, selectedActivity, sortBy, searchQuery]);

    const clearAllFilters = () => {
        setSelectedLanguage('All');
        setSelectedRegion('All');
        setSelectedRole('All');
        setSelectedActivity('All');
        setSortBy('Recommended');
        setSearchQuery('');
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (selectedLanguage !== 'All') count++;
        if (selectedRegion !== 'All') count++;
        if (selectedRole !== 'All') count++;
        if (selectedActivity !== 'All') count++;
        if (sortBy !== 'Recommended') count++;
        if (searchQuery !== '') count++;
        return count;
    }, [selectedLanguage, selectedRegion, selectedRole, selectedActivity, sortBy, searchQuery]);

    return {
        selectedLanguage,
        setSelectedLanguage,
        selectedRegion,
        setSelectedRegion,
        selectedRole,
        setSelectedRole,
        selectedActivity,
        setSelectedActivity,
        sortBy,
        setSortBy,
        searchQuery,
        setSearchQuery,
        isSearchVisible,
        setIsSearchVisible,
        availableLanguages,
        filteredPeople,
        clearAllFilters,
        activeFilterCount
    };
}
