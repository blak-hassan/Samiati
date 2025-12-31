
export const CONTRIBUTION_TYPES = [
    { id: 'Story', label: 'Story', icon: 'menu_book' },
    { id: 'Proverb', label: 'Proverb', icon: 'format_quote' },
    { id: 'Word', label: 'Word', icon: 'translate' },
    { id: 'Song', label: 'Song', icon: 'music_note' },
    { id: 'Phrases', label: 'Phrases', icon: 'forum' },
    { id: 'Translate Paragraphs', label: 'Translate', icon: 'history_edu' },
    { id: 'Riddle', label: 'Riddle', icon: 'quiz' },
    { id: 'Recipe', label: 'Recipe', icon: 'restaurant' },
    { id: 'Chant', label: 'Chant', icon: 'record_voice_over' },
    { id: 'Myth', label: 'Myth', icon: 'auto_stories' },
    { id: 'History', label: 'History', icon: 'history' },
];

export const CATEGORY_COLORS: Record<string, string> = {
    Story: 'text-rasta-green',
    Proverb: 'text-rasta-gold',
    Word: 'text-rasta-red',
    Song: 'text-blue-500',
    Phrases: 'text-purple-500',
    'Translate Paragraphs': 'text-orange-500',
    Riddle: 'text-pink-500',
    Recipe: 'text-emerald-500',
    Chant: 'text-amber-500',
    Myth: 'text-indigo-500',
    History: 'text-stone-500',
};
