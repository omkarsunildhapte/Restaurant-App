// Super Admin routes against the local Supabase stack and seed accounts. Skipped without .env keys.
import type { Server } from 'node:http';
import { adminClient } from '@config/supabase.config.js';
import { startServer, stopServer, supabaseReady, tokenFor } from '../helpers/test-server.js';

const spice = '10000000-0000-4000-a000-000000000002';


describe.skipIf(!supabaseReady)('/platform/v1/admin', () => {
  let server: Server;
  let base: string;
  let superToken: string;
  let ownerToken: string;
  let original: { plan_id: string; status: string; trial_ends_at: string | null; feature_overrides: object };
  let originalNotes: string | undefined;

  const call = (method: string, path: string, token: string, body?: unknown) =>
    fetch(base + '/platform/v1/admin' + path, {
      method,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  beforeAll(async () => {
    ({ server, origin: base } = await startServer());
    superToken = await tokenFor('super@platform.test');
    ownerToken = await tokenFor('owner@spiceroute.test');
    const { data } = await adminClient().from('tenants')
      .select('plan_id, status, trial_ends_at, feature_overrides').eq('id', spice).single();
    original = data!;
    const { data: notes } = await adminClient().from('tenant_notes').select('notes').eq('tenant_id', spice).maybeSingle();
    originalNotes = notes?.notes;
  });

  afterAll(async () => {
    await stopServer(server);
    await adminClient().from('tenants').update(original).eq('id', spice);
    if (originalNotes === undefined) await adminClient().from('tenant_notes').delete().eq('tenant_id', spice);
    else await adminClient().from('tenant_notes').update({ notes: originalNotes }).eq('tenant_id', spice);
  });

  it('owners get 403 on every admin route', async () => {
    for (const path of ['/stats', '/plans', '/tenants', `/tenants/${spice}`]) {
      expect((await call('GET', path, ownerToken)).status).toBe(403);
    }
    expect((await call('PATCH', `/tenants/${spice}`, ownerToken, { status: 'active' })).status).toBe(403);
  });

  it('stats cover every restaurant', async () => {
    const res = await call('GET', '/stats', superToken);
    expect(res.status).toBe(200);
    const stats = await res.json();
    expect(stats.tenants_total).toBeGreaterThanOrEqual(2);
    expect(stats.trials_ending.map((t: { id: string }) => t.id)).toContain(spice);
  });

  it('lists restaurants with outlet and staff counts, and filters', async () => {
    const all = await (await call('GET', '/tenants', superToken)).json();
    const brew = all.find((t: { slug: string }) => t.slug === 'brew-and-leaf');
    expect(brew).toMatchObject({ outlet_count: 2, staff_count: 6, plan_id: 'chain' });

    const trials = await (await call('GET', '/tenants?status=trial', superToken)).json();
    expect(trials.every((t: { status: string }) => t.status === 'trial')).toBe(true);

    const found = await (await call('GET', '/tenants?q=spice', superToken)).json();
    expect(found.map((t: { id: string }) => t.id)).toEqual([spice]);
  });

  it('shows one restaurant with outlets, staff, invitations and features', async () => {
    const res = await call('GET', '/tenants/10000000-0000-4000-a000-000000000001', superToken);
    const body = await res.json();
    expect(body.outlets).toHaveLength(2);
    expect(body.members.map((m: { profiles: { email: string } }) => m.profiles.email)).toContain('owner@brewleaf.test');
    expect(body.invitations.map((i: { email: string }) => i.email)).toEqual(['barista.kp@brewleaf.test']);
    expect(body.features.multi_outlet).toBe(true);
    expect(body.notes).toMatch(/Pilot/);
  });

  it('changes plan, status, trial and feature switches', async () => {
    const res = await call('PATCH', `/tenants/${spice}`, superToken, {
      planId: 'starter', status: 'active', trialEndsAt: null, featureOverrides: { delivery: true },
    });
    expect(res.status).toBe(200);
    const detail = await (await call('GET', `/tenants/${spice}`, superToken)).json();
    expect(detail.tenant).toMatchObject({ plan_id: 'starter', status: 'active', trial_ends_at: null });
    expect(detail.features).toMatchObject({ delivery: true, waiter_app: false });
  });

  it('saves internal notes', async () => {
    expect((await call('PUT', `/tenants/${spice}/notes`, superToken, { notes: 'Called, wants a demo' })).status).toBe(200);
    const detail = await (await call('GET', `/tenants/${spice}`, superToken)).json();
    expect(detail.notes).toBe('Called, wants a demo');
  });

  it('400 for an unknown status, 404 for an unknown restaurant', async () => {
    expect((await call('PATCH', `/tenants/${spice}`, superToken, { status: 'paused' })).status).toBe(400);
    expect((await call('GET', '/tenants/00000000-0000-4000-a000-00000000ffff', superToken)).status).toBe(404);
  });
});
