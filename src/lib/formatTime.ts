/**
 * Human-friendly relative timestamp ("2h ago", "yesterday", "3d ago").
 * Returns the absolute date for anything older than 14 days so the card
 * stays scannable.
 */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
    if (!timestamp || Number.isNaN(timestamp)) return "—";
    const diffMs = now - timestamp;
    if (diffMs < 0) return "just now";
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 45) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 14) return "1w ago";
    return new Date(timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: new Date(timestamp).getFullYear() === new Date(now).getFullYear() ? undefined : "numeric",
    });
}

export function formatAbsoluteTime(timestamp: number): string {
    if (!timestamp || Number.isNaN(timestamp)) return "—";
    return new Date(timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
