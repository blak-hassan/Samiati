// tests/setup.ts
// Vitest setup — provides a minimal window/localStorage for modules that
// touch the browser global (cookie consent, etc.).
import { vi } from 'vitest';

const storage = new Map<string, string>();

vi.stubGlobal('window', {
  localStorage: {
    getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
    setItem: (k: string, v: string) => {
      storage.set(k, v);
    },
    removeItem: (k: string) => {
      storage.delete(k);
    },
    clear: () => storage.clear(),
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  navigator: { language: 'en-US', globalPrivacyControl: false },
});