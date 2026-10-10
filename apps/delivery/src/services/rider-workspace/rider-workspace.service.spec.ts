import { TestBed } from '@angular/core/testing';
import { Session } from '@supabase/supabase-js';
import { RiderWorkspaceService } from '@services/rider-workspace/rider-workspace.service';
import { SupabaseService } from '@services/supabase/supabase.service';
import { AuthService } from '@services/auth/auth.service';
import { fakeAuthService, fakeSession } from '@testing/doubles';
import { fakeDataClient } from '@testing/delivery-fixtures';
import { ERROR_MESSAGES } from '@constants/messages.constants';

const workspaceRows = [
  { tenant_id: 'tenant-1', tenant_name: 'Brew & Leaf', role: 'delivery', outlet_id: 'outlet-1', writable: true },
  { tenant_id: 'tenant-2', tenant_name: 'Spice Route', role: 'cashier', outlet_id: null, writable: true },
];

describe('RiderWorkspaceService', () => {
  function setup(rows: unknown[] = workspaceRows, session: Session | null = fakeSession()) {
    const fake = fakeDataClient({ my_workspaces: { data: rows, error: null } });
    const auth = fakeAuthService(session);
    TestBed.configureTestingModule({ providers: [{ provide: SupabaseService, useValue: fake.supabase }, { provide: AuthService, useValue: auth }] });
    return { service: TestBed.inject(RiderWorkspaceService), fake, auth };
  }

  it('keeps only delivery memberships', async () => {
    const { service } = setup();
    expect(await service.list()).toEqual([{ tenantId: 'tenant-1', tenantName: 'Brew & Leaf', outletId: 'outlet-1', writable: true }]);
    expect((await service.current()).tenantId).toBe('tenant-1');
    expect(service.workspaces()).toHaveLength(1);
  });

  it('loads once per user and reloads after refresh()', async () => {
    const { service, fake } = setup();
    await service.list();
    await service.current();
    expect(fake.client.rpc).toHaveBeenCalledTimes(1);
    service.refresh();
    await service.list();
    expect(fake.client.rpc).toHaveBeenCalledTimes(2);
  });

  it('tells a person with no delivery membership to get invited', async () => {
    const { service } = setup([workspaceRows[1]]);
    await expect(service.current()).rejects.toThrowError(ERROR_MESSAGES.NO_RESTAURANT);
  });

  it('needs a signed-in user', async () => {
    const { service } = setup(workspaceRows, null);
    await expect(service.list()).rejects.toThrowError(ERROR_MESSAGES.SIGN_IN_REQUIRED);
  });
});
