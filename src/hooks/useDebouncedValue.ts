"use client";
import { useEffect, useState } from 'react';

/**
 * Debounce a fast-changing value (search input, scroll position, etc.) by
 * `delay` ms. Returns the most recent value once the user has paused.
 */
export function useDebouncedValue<T>(value: T, delay: number = 150): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}
