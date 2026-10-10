import { Page } from '@playwright/test';
import { environment } from '@environments/environment';
import { e2eSession } from '../data/session';

/**
 * A stand-in for Supabase Auth and the backend API, so a run needs nothing but this repo.
 * Supabase tables are not called at all yet (the data services are Phase 5 stubs); any REST or
 * Realtime call is answered empty so a stray request can never reach a real database.
 */
const SUPABASE = environment.supabase.url;

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

export async function mockBackend(page: Page): Promise<void> {
  await page.route(`${SUPABASE}/auth/v1/token**`, (route) => route.fulfill(json(e2eSession())));
  await page.route(`${SUPABASE}/auth/v1/signup**`, (route) => route.fulfill(json(e2eSession())));
  await page.route(`${SUPABASE}/auth/v1/recover**`, (route) => route.fulfill(json({})));
  await page.route(`${SUPABASE}/auth/v1/logout**`, (route) => route.fulfill({ status: 204, body: '' }));
  await page.route(`${SUPABASE}/auth/v1/user**`, (route) => route.fulfill(json(e2eSession().user)));
  await page.route(`${SUPABASE}/rest/v1/**`, (route) => route.fulfill(json([])));
  await page.route(`${SUPABASE}/realtime/**`, (route) => route.abort());
  await page.route(`${environment.apiUrl}/**`, (route) => route.fulfill(json({})));
}
