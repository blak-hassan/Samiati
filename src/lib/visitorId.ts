const STORAGE_KEY = 'mushenee_visitor_id';

export function createVisitorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `vid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getVisitorId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const generated = createVisitorId();
    window.localStorage.setItem(STORAGE_KEY, generated);
    return generated;
  } catch {
    return null;
  }
}
