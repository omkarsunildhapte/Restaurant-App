import { vi } from 'vitest';

/*
 * Browser APIs that Ionic's web components use and jsdom lacks. Loaded via the unit-test
 * builder's setupFiles (spec-only; excluded from the app build).
 */
const noopObserver = class {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): [] {
    return [];
  }
};

if (!('IntersectionObserver' in globalThis)) Object.assign(globalThis, { IntersectionObserver: noopObserver });
if (!('ResizeObserver' in globalThis)) Object.assign(globalThis, { ResizeObserver: noopObserver });
if (!window.matchMedia) {
  Object.assign(window, {
    matchMedia: vi.fn().mockImplementation((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })),
  });
}
