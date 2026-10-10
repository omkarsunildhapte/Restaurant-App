import type { Server } from 'node:http';
import { adminClient } from '@config/supabase.config.js';
import { call, startServer, stopServer, supabaseReady } from '../helpers/test-server.js';

/** POST /public/v1/signups against local Supabase (sign-up rows and Mailpit invite). */
describe.skipIf(!supabaseReady)('/public/v1/signups', () => {
  let server: Server;
  let origin: string;
  const runId = Date.now().toString(36);
  const emails: string[] = [];
  const body = (email: string) => ({ restaurantName: 'Test Tiffin', ownerName: 'Asha Kale', email, phone: '+91 98220 55555', city: 'Pune' });

  beforeAll(async () => {
    ({ server, origin } = await startServer());
  });

  afterAll(async () => {
    await stopServer(server);
    await adminClient().from('signups').delete().in('email', emails);
    const { data } = await adminClient().auth.admin.listUsers({ perPage: 1000 });
    for (const u of data?.users ?? []) {
      if (u.email && emails.includes(u.email)) await adminClient().auth.admin.deleteUser(u.id);
    }
  });

  it('400 with field errors for a bad body', async () => {
    const res = await call(origin, 'POST', '/public/v1/signups', undefined, { restaurantName: 'X', email: 'nope' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/restaurantName.*email|email.*restaurantName/s);
  });

  it('accepts a honeypot submission without storing anything', async () => {
    const email = `bot-${runId}@example.test`;
    emails.push(email);
    const res = await call(origin, 'POST', '/public/v1/signups', undefined, { ...body(email), website: 'http://spam.example' });
    expect(res.status).toBe(202);
    const { data } = await adminClient().from('signups').select('id').eq('email', email);
    expect(data).toEqual([]);
  });

  it('stores the sign-up and sends the invite', async () => {
    const email = `owner-${runId}@example.test`;
    emails.push(email);
    const res = await call(origin, 'POST', '/public/v1/signups', undefined, body(email));
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ status: 'check_email' });
    const { data } = await adminClient().from('signups').select('restaurant_name, completed_at').eq('email', email);
    expect(data).toEqual([{ restaurant_name: 'Test Tiffin', completed_at: null }]);
  });

  it('409 when the email already has an account, and no sign-up row is left', async () => {
    const res = await call(origin, 'POST', '/public/v1/signups', undefined, body('owner@brewleaf.test'));
    expect(res.status).toBe(409);
    const { data } = await adminClient().from('signups').select('id').eq('email', 'owner@brewleaf.test');
    expect(data).toEqual([]);
  });

  it('429 after 5 attempts from one address in an hour', async () => {
    // Every attempt counts, valid or not: the four tests above used 4 of the 5.
    const statuses: number[] = [];
    for (let i = 0; i < 3; i++) {
      const email = `limit-${i}-${runId}@example.test`;
      emails.push(email);
      statuses.push((await call(origin, 'POST', '/public/v1/signups', undefined, { ...body(email), website: 'x' })).status);
    }
    expect(statuses).toEqual([202, 429, 429]);
  });
});
