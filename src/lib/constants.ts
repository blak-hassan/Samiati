
export const CONTRIBUTION_TYPES = [
    { id: 'Word', label: 'Word', icon: 'translate' },
    { id: 'Translate Paragraphs', label: 'Translate', icon: 'history_edu' },
    { id: 'Story', label: 'Story', icon: 'menu_book' },
    { id: 'Song', label: 'Song', icon: 'music_note' },
    { id: 'Custom', label: 'Custom', icon: 'add_circle' },
];

export const CATEGORY_COLORS: Record<string, string> = {
    Word: 'text-rasta-red',
    'Translate Paragraphs': 'text-orange-500',
    Story: 'text-rasta-green',
    Song: 'text-blue-500',
    Custom: 'text-stone-500',
    // Keeping others in case of legacy data reference, or I can just remove them. 
    // User asked to "delete the rest", so I will remove them from the UI list (CONTRIBUTION_TYPES).
    // I will keep the colors for now just in case legacy items exist in mock data.
    Proverb: 'text-rasta-gold',
    Phrases: 'text-purple-500',
    Riddle: 'text-pink-500',
    Recipe: 'text-emerald-500',
    Chant: 'text-amber-500',
    Myth: 'text-indigo-500',
    History: 'text-stone-500',
};
