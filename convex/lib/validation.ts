/**
 * Pure input-validation helpers shared by Convex mutations. Kept free of
 * Convex imports so they can be unit-tested in isolation.
 */

const HANDLE_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export function isValidHandle(handle: string): boolean {
    return HANDLE_REGEX.test(handle);
}

export const MAX_AVATAR_URL_LENGTH = 2048;

// Avatar must be a real http(s) URL — no data:, javascript:, or file: URIs.
export function isValidAvatarUrl(url: string): boolean {
    if (url.length > MAX_AVATAR_URL_LENGTH) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return false;
    }
}

export function sanitizeText(input: string, maxLength: number): string {
    return input.trim().slice(0, maxLength);
}