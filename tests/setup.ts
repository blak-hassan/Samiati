/**
 * A minimal in-memory `localStorage` for the Node test environment.
 *
 * Samiati's local backend is browser-storage based, so the tests need a
 * storage implementation. Stubbing it here keeps the test suite free of a
 * jsdom dependency.
 */
class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
}

const globalWithStorage = globalThis as typeof globalThis & {
  localStorage?: Storage;
};

if (!globalWithStorage.localStorage) {
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    writable: true,
    configurable: true,
  });
}

if (!globalWithStorage.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: { randomUUID: () => `test-${Math.random().toString(36).slice(2)}` },
    writable: true,
    configurable: true,
  });
}
