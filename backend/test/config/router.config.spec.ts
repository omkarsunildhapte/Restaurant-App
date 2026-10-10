import type { Server } from 'node:http';
import { call, startServer, stopServer } from '../helpers/test-server.js';

/**
 * Every /platform/v1 and /geocode path needs a sign-in, and /health does not.
 *
 * The guards sit on the prefixes (config/routes/*.routes.ts), not on each route, so this sends
 * real requests through the real app to keep it that way. No database is involved: a request
 * without a token is turned away before any handler runs. The last platform path matches no
 * route at all; a 401 there (not a 404) proves the guard covers the whole prefix.
 */
let server: Server;
let origin: string;

beforeAll(async () => {
  ({ server, origin } = await startServer());
});
afterAll(() => stopServer(server));

const guarded: [string, string][] = [
  ['POST', '/platform/v1/tenants'],
  ['POST', '/platform/v1/tenants/10000000-0000-4000-a000-000000000001/members'],
  ['POST', '/platform/v1/invitations/10000000-0000-4000-a000-000000000001/resend'],
  ['GET', '/platform/v1/admin/stats'],
  ['GET', '/platform/v1/admin/plans'],
  ['PATCH', '/platform/v1/admin/plans/pro'],
  ['GET', '/platform/v1/admin/tenants'],
  ['GET', '/platform/v1/admin/tenants/10000000-0000-4000-a000-000000000001'],
  ['PATCH', '/platform/v1/admin/tenants/10000000-0000-4000-a000-000000000001'],
  ['PUT', '/platform/v1/admin/tenants/10000000-0000-4000-a000-000000000001/notes'],
  ['GET', '/geocode/search?q=MG%20Road'],
  ['GET', '/geocode/reverse?lat=18.5&lng=73.8'],
  ['GET', '/platform/v1/not-a-real-route'],
];

describe('route guards', () => {
  it.each(guarded)('%s %s → 401 without a token', async (method, path) => {
    const res = await call(origin, method, path);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Sign in first', errorCode: 'UNAUTHORIZED' });
  });

  it('rejects a header that is not a Bearer token', async () => {
    const res = await fetch(origin + '/platform/v1/admin/stats', { headers: { authorization: 'Basic abc' } });
    expect(res.status).toBe(401);
  });

  it('serves /health without a token', async () => {
    const res = await call(origin, 'GET', '/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok' });
  });
});

describe('CORS', () => {
  it('answers a preflight from an allowed app origin', async () => {
    const res = await fetch(origin + '/platform/v1/admin/stats', {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:4201', 'access-control-request-method': 'GET' },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:4201');
  });

  it('does not allow an unknown origin', async () => {
    const res = await fetch(origin + '/health', { headers: { origin: 'https://evil.example' } });
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });
});
