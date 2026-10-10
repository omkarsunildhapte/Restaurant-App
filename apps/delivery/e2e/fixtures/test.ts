import { test as base, expect, Page } from '@playwright/test';
import { SUPABASE_STORAGE_KEY, e2eSession } from '../data/session';
import { mockBackend } from './backend-mock';

/**
 * The `test` every spec imports: the backend is always stubbed, and a signed-in session is seeded
 * unless the spec opts out with `test.use({ signedIn: false })`.
 */
export interface RiderFixtures {
  signedIn: boolean;
}

/** Writes the session where supabase-js reads it, before any app script runs. */
async function seedSession(page: Page): Promise<void> {
  await page.addInitScript(([key, value]: string[]) => window.localStorage.setItem(key, value), [SUPABASE_STORAGE_KEY, JSON.stringify(e2eSession())]);
}

export const test = base.extend<RiderFixtures>({
  signedIn: [true, { option: true }],
  page: async ({ page, signedIn }, use) => {
    await mockBackend(page);
    if (signedIn) {
      await seedSession(page);
    }
    await use(page);
  },
});

export { expect };
