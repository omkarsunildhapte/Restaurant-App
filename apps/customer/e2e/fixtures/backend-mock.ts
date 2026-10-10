import { Page, Route } from '@playwright/test';
import { E2E_USER, SUPABASE_URL, e2eSession } from '../data/session';

/** Matches environment.apiUrl (development). */
const API_URL = 'http://localhost:4000';

/** A JSON reply, or a function that builds one from the request. */
export type MockPayload = unknown | ((route: Route) => unknown);

/** Overrides by URL path suffix, e.g. { '/geocode/search': { results: [...] } }. */
export type MockRoutes = Record<string, MockPayload>;

export interface MockLog {
  /** Paths of every stubbed request, in order. */
  calls: string[];
}

const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/** Supabase Auth endpoints the app calls, answered like GoTrue would. */
const AUTH_DEFAULTS: MockRoutes = {
  '/auth/v1/token': () => e2eSession(),
  '/auth/v1/signup': () => ({ ...E2E_USER, identities: [] }),
  '/auth/v1/recover': {},
  '/auth/v1/user': () => E2E_USER,
  '/auth/v1/logout': {},
  '/auth/v1/otp': {},
  '/auth/v1/verify': () => e2eSession(),
};

/** Backend endpoints (geocoding), answered empty. */
const API_DEFAULTS: MockRoutes = {
  '/geocode/search': { results: [], attribution: '© OpenStreetMap contributors' },
  '/geocode/reverse': { result: null, attribution: '© OpenStreetMap contributors' },
};

/**
 * Stubs Supabase, the backend API and Google Fonts so a run needs no network. Anything not listed
 * answers `{}`. `overrides` replace a default per path suffix.
 */
export async function mockBackend(page: Page, overrides: MockRoutes = {}): Promise<MockLog> {
  const log: MockLog = { calls: [] };
  const handle = (defaults: MockRoutes) => async (route: Route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    const path = new URL(route.request().url()).pathname;
    log.calls.push(path);
    const routes = { ...defaults, ...overrides };
    const key = Object.keys(routes).find((k) => path.endsWith(k));
    const payload = key ? routes[key] : {};
    return json(route, typeof payload === 'function' ? (payload as (r: Route) => unknown)(route) : payload);
  };
  await page.route(`${SUPABASE_URL}/**`, handle(AUTH_DEFAULTS));
  await page.route(`${API_URL}/**`, handle(API_DEFAULTS));
  await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.route('https://fonts.gstatic.com/**', (route) => route.fulfill({ status: 404, body: '' }));
  return log;
}
