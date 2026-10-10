import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from '@services/supabase/supabase.service';
import { AuthService } from '@services/auth/auth.service';
import { RiderWorkspace } from '@appTypes/rider.types';
import { Database } from '@appTypes/database.types';
import { RIDER_ROLE, SUPABASE_RPC } from '@constants/supabase.constants';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { unwrap } from '@utils/supabase-result/supabase-result.util';

type WorkspaceRow = Database['public']['Functions']['my_workspaces']['Returns'][number];

/**
 * The business(es) the signed-in person rides for: their `delivery` memberships, from
 * `my_workspaces()`. A rider is invited by a restaurant like any staff member, so with no
 * membership there is nothing to deliver for. Riders with one business (the pilot) use it
 * directly; `workspaces` lists all of them for a picker once someone rides for two.
 *
 * Cached per signed-in user; `refresh()` reloads (e.g. after an invite is accepted).
 */
@Injectable({ providedIn: 'root' })
export class RiderWorkspaceService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  private readonly state = signal<{ userId: string; workspaces: RiderWorkspace[] } | null>(null);
  readonly workspaces = computed(() => this.state()?.workspaces ?? []);

  /** Every business this person rides for (loaded once per user). */
  async list(): Promise<RiderWorkspace[]> {
    const userId = this.auth.userId();
    if (!userId) {
      throw new Error(ERROR_MESSAGES.SIGN_IN_REQUIRED);
    }
    const cached = this.state();
    if (cached?.userId === userId) {
      return cached.workspaces;
    }
    const rows = unwrap<WorkspaceRow[]>(await this.supabase.require().rpc(SUPABASE_RPC.MY_WORKSPACES)) ?? [];
    const workspaces = rows.filter((row) => row.role === RIDER_ROLE).map(toWorkspace);
    this.state.set({ userId, workspaces });
    return workspaces;
  }

  /** The business to work for now (the first one), or an Error telling the rider to get invited. */
  async current(): Promise<RiderWorkspace> {
    const [first] = await this.list();
    if (!first) {
      throw new Error(ERROR_MESSAGES.NO_RESTAURANT);
    }
    return first;
  }

  refresh(): void {
    this.state.set(null);
  }
}

function toWorkspace(row: WorkspaceRow): RiderWorkspace {
  return { tenantId: row.tenant_id, tenantName: row.tenant_name, outletId: row.outlet_id ?? null, writable: row.writable };
}
