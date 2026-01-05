import { useMemo } from 'react';
import Fuse from 'fuse.js';

export function useFuzzySearch<T>(
    data: T[],
    searchQuery: string,
    keys: string[],
    threshold: number = 0.4
): T[] {
    const fuse = useMemo(() => new Fuse(data, {
        keys,
        threshold,
        includeScore: true,
        ignoreLocation: true,
        useExtendedSearch: true,
    }), [data, keys, threshold]);

    return useMemo(() => {
        if (!searchQuery?.trim()) return data;
        return fuse.search(searchQuery).map(result => result.item);
    }, [fuse, searchQuery, data]);
}
