// Runs against the local Supabase stack with the seed accounts (supabase/seed.sql).
// Needs SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in backend/.env; skipped otherwise.
import type { Server } from 'node:http';
import { adminClient } from '@config/supabase.config.js';
import { startServer, stopServer, supabaseReady, tokenFor } from '../helpers/test-server.js';

const brew = '10000000-0000-4000-a000-000000000001';
const spice = '10000000-0000-4000-a000-000000000002';
const runId = Date.now().toString(36);


describe.skipIf(!supabaseReady)('/platform against local Supabase', () => {
  let server: Server;
  let base: string;
  const tokens: Record<string, string> = {};
  const createdSlugs: string[] = [];
  const invitedEmails: string[] = [];

  const post = (path: string, who: string, body: unknown) =>
    fetch(base + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${tokens[who]}` },
      body: JSON.stringify(body),
    });

  beforeAll(async () => {
    ({ server, origin: base } = await startServer());
    for (const who of ['super@platform.test', 'owner@brewleaf.test', 'manager.baner@brewleaf.test']) {
      tokens[who] = await tokenFor(who);
    }
  });

  afterAll(async () => {
    await stopServer(server);
    // Clean up what the tests created (service role bypasses RLS).
    if (createdSlugs.length) await adminClient().from('tenants').delete().in('slug', createdSlugs);
    const { data } = await adminClient().auth.admin.listUsers({ perPage: 1000 });
    for (const u of data?.users ?? []) {
      if (u.email && invitedEmails.includes(u.email)) await adminClient().auth.admin.deleteUser(u.id);
    }
    await adminClient().from('invitations').delete().in('email', invitedEmails);
  });

  it('400 with field errors for a bad body', async () => {
    const res = await post('/platform/v1/tenants', 'super@platform.test', { name: 'X', slug: 'Bad Slug', ownerEmail: 'nope' });
    expect(res.status).toBe(400);
    const { error } = await res.json();
    expect(error).toMatch(/name/);
    expect(error).toMatch(/slug/);
    expect(error).toMatch(/ownerEmail/);
  });

  it('400 for a member invite with an unknown role', async () => {
    const res = await post(`/platform/v1/tenants/${brew}/members`, 'owner@brewleaf.test', { email: 'a@b.test', role: 'chef' });
    expect(res.status).toBe(400);
  });

  it('Super Admin creates a restaurant and the owner gets an invite', async () => {
    const slug = `test-cafe-${runId}`;
    const ownerEmail = `owner-${runId}@example.test`;
    createdSlugs.push(slug);
    invitedEmails.push(ownerEmail);

    const res = await post('/platform/v1/tenants', 'super@platform.test', {
      name: 'Test Café', slug, ownerEmail, planId: 'starter', city: 'Pune',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.owner).toBe('invited');

    // Invite email created the account, and the trigger turned the invitation into an owner membership.
    const { data: members } = await adminClient().from('memberships').select('role').eq('tenant_id', body.tenant_id);
    expect(members).toEqual([{ role: 'owner' }]);
    const { data: rates } = await adminClient().from('tax_rates').select('rate').eq('tenant_id', body.tenant_id);
    expect(rates?.map((r) => Number(r.rate)).sort((a, b) => a - b)).toEqual([0, 5, 18]);
  });

  it('409 when the web address is taken', async () => {
    const res = await post('/platform/v1/tenants', 'super@platform.test', {
      name: 'Copy', slug: 'brew-and-leaf', ownerEmail: 'x@example.test',
    });
    expect(res.status).toBe(409);
  });

  it('403 when an owner tries to create a restaurant', async () => {
    const res = await post('/platform/v1/tenants', 'owner@brewleaf.test', {
      name: 'Side Hustle', slug: `side-${runId}`, ownerEmail: 'x@example.test',
    });
    expect(res.status).toBe(403);
  });

  it('owner invites a new waiter to one outlet', async () => {
    const email = `waiter-${runId}@example.test`;
    invitedEmails.push(email);
    const res = await post(`/platform/v1/tenants/${brew}/members`, 'owner@brewleaf.test', {
      email, role: 'waiter', outletId: '20000000-0000-4000-a000-000000000002',
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ status: 'invited' });
  });

  it('existing account is added straight away', async () => {
    const res = await post(`/platform/v1/tenants/${brew}/members`, 'owner@brewleaf.test', {
      email: 'manager.baner@brewleaf.test', role: 'manager',
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'already_member' });
  });

  it('403 when a manager invites staff', async () => {
    const res = await post(`/platform/v1/tenants/${brew}/members`, 'manager.baner@brewleaf.test', {
      email: 'x@example.test', role: 'waiter',
    });
    expect(res.status).toBe(403);
  });

  it('403 when an owner invites into another restaurant', async () => {
    const res = await post(`/platform/v1/tenants/${spice}/members`, 'owner@brewleaf.test', {
      email: 'x@example.test', role: 'waiter',
    });
    expect(res.status).toBe(403);
  });
});
