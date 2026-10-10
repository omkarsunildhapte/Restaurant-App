import type { Role, Workspace } from '@app/core/models';

/** Which screens each role works in, and where it lands after sign-in. */
export type Mode = 'waiter' | 'kitchen' | 'pos';

export const MODES: Record<Role, readonly Mode[]> = {
  admin: ['pos', 'waiter', 'kitchen'],
  owner: ['pos', 'waiter', 'kitchen'],
  manager: ['pos', 'waiter', 'kitchen'],
  cashier: ['pos', 'waiter'],
  waiter: ['waiter'],
  kitchen: ['kitchen'],
  delivery: [],
};

/** The plan feature switch each screen needs (plans.features / tenants.feature_overrides). */
export const MODE_FEATURE: Record<Mode, string> = { pos: 'pos', kitchen: 'kds', waiter: 'waiter_app' };

/**
 * Screens this role may use on this business's plan. A switch that is missing counts as on, so
 * a device still holding an older saved copy of its workplaces keeps working offline.
 */
export function modesFor(w: Workspace | null): readonly Mode[] {
  if (!w) return [];
  return MODES[w.role].filter((m) => w.features?.[MODE_FEATURE[m]] !== false);
}
