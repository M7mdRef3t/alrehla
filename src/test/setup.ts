import "@testing-library/jest-dom";
import { webcrypto } from "node:crypto";
import { vi } from "vitest";

// Provide Web Crypto for tests
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as unknown as Crypto;
}
Object.defineProperty(window, "crypto", { value: globalThis.crypto });

if (!globalThis.btoa) {
  globalThis.btoa = (input: string) => Buffer.from(input, "binary").toString("base64");
}

if (!globalThis.atob) {
  globalThis.atob = (input: string) => Buffer.from(input, "base64").toString("binary");
}

// Mock localStorage with in-memory implementation
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    return storage.has(key) ? storage.get(key)! : null;
  }),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, String(value));
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key);
  }),
  clear: vi.fn(() => {
    storage.clear();
  }),
  key: vi.fn((index: number) => {
    return Array.from(storage.keys())[index] ?? null;
  }),
  get length() {
    return storage.size;
  }
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
(globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
