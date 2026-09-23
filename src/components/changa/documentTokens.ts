export const DOCUMENT_STATUS_COLORS: Record<string, string> = {
    uploading: 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300',
    parsing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    ready: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    in_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

export const DOCUMENT_KIND_ICONS: Record<string, string> = {
    dictionary: 'menu_book',
    novel: 'auto_stories',
    song_collection: 'music_note',
    website_link: 'link',
    transcript: 'description',
    other: 'inventory_2',
};

export type DocumentStatusBucket = 'All' | 'Live' | 'Under Review' | 'Needs Revision' | 'Declined';

export function documentStatusBucket(status: string | undefined): DocumentStatusBucket {
    switch (status) {
        case 'ready':
        case 'completed':
            return 'Live';
        case 'in_review':
        case 'parsing':
            return 'Under Review';
        case 'uploading':
        default:
            return 'All';
    }
}
