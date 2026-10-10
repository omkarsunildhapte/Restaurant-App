import { Page } from '@playwright/test';
import { environment } from '@environments/environment';
import { E2E_WORKSPACE, e2eSession } from '../data/session';
import { SUPABASE_RPC } from '@constants/supabase.constants';

/**
 * A stand-in for Supabase Auth, the delivery data and the backend API, so a run needs nothing but
 * this repo. The signed-in rider is a `delivery` member of one business, has no rider profile yet
 * (onboarding) and no jobs. Any other REST or Realtime call is answered empty so a stray request
 * can never reach a real database. Specs override a route by registering their own after this.
 */
const SUPABASE = environment.supabase.url;

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

export async function mockBackend(page: Page): Promise<void> {
  await page.route(`${SUPABASE}/auth/v1/token**`, (route) => route.fulfill(json(e2eSession())));
  await page.route(`${SUPABASE}/auth/v1/recover**`, (route) => route.fulfill(json({})));
  await page.route(`${SUPABASE}/auth/v1/logout**`, (route) => route.fulfill({ status: 204, body: '' }));
  /* GET reads the user; PUT (welcome screen) sets the password and returns the user. */
  await page.route(`${SUPABASE}/auth/v1/user**`, (route) => route.fulfill(json(e2eSession().user)));
  await page.route(`${SUPABASE}/rest/v1/**`, (route) => route.fulfill(route.request().method() === 'GET' ? json([]) : json(null)));
  await page.route(`${SUPABASE}/rest/v1/rpc/${SUPABASE_RPC.MY_WORKSPACES}**`, (route) => route.fulfill(json([E2E_WORKSPACE])));
  await page.route(`${SUPABASE}/rest/v1/rpc/${SUPABASE_RPC.MY_DELIVERIES}**`, (route) => route.fulfill(json([])));
  await page.route(`${SUPABASE}/realtime/**`, (route) => route.abort());
  await page.route(`${environment.apiUrl}/**`, (route) => route.fulfill(json({})));
}
