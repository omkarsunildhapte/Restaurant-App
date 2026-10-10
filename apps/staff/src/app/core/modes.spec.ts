import { describe, expect, it } from 'vitest';
import { modesFor } from '@app/core/modes';
import type { Role, Workspace } from '@app/core/models';

const ws = (role: Role, features?: Record<string, boolean>): Workspace => ({
  tenant_id: 't', tenant_name: 'Brew', tenant_slug: 'brew', role, outlet_id: null, status: 'trial', writable: true, features,
});
const STARTER = { pos: true, kds: true, waiter_app: false };

describe('modesFor (plan feature switches)', () => {
  it('gives each role its screens when the plan has them all', () => {
    expect(modesFor(ws('owner', { pos: true, kds: true, waiter_app: true }))).toEqual(['pos', 'waiter', 'kitchen']);
    expect(modesFor(ws('kitchen', { kds: true }))).toEqual(['kitchen']);
  });

  it('drops the waiter screen on a plan without the waiter app', () => {
    expect(modesFor(ws('cashier', STARTER))).toEqual(['pos']);
    expect(modesFor(ws('manager', STARTER))).toEqual(['pos', 'kitchen']);
    expect(modesFor(ws('waiter', STARTER))).toEqual([]);
  });

  it('follows an override that switches the kitchen screen off', () => {
    expect(modesFor(ws('kitchen', { ...STARTER, kds: false }))).toEqual([]);
  });

  it('treats a missing switch as on (older saved copy, offline)', () => {
    expect(modesFor(ws('waiter'))).toEqual(['waiter']);
  });

  it('has no screens without a workspace or for delivery riders', () => {
    expect(modesFor(null)).toEqual([]);
    expect(modesFor(ws('delivery', STARTER))).toEqual([]);
  });
});
