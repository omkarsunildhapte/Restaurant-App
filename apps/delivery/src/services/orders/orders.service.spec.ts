import { TestBed } from '@angular/core/testing';
import { OrdersService } from '@services/orders/orders.service';
import { SupabaseService } from '@services/supabase/supabase.service';
import { RiderWorkspaceService } from '@services/rider-workspace/rider-workspace.service';
import { deliveryJobRow, fakeDataClient } from '@testing/delivery-fixtures';

describe('OrdersService', () => {
  function setup(answers: Parameters<typeof fakeDataClient>[0] = {}) {
    const fake = fakeDataClient(answers);
    const workspace = { current: vi.fn(async () => ({ tenantId: 'tenant-1', tenantName: 'Brew & Leaf', outletId: null, writable: true })) };
    TestBed.configureTestingModule({ providers: [{ provide: SupabaseService, useValue: fake.supabase }, { provide: RiderWorkspaceService, useValue: workspace }] });
    return { service: TestBed.inject(OrdersService), fake };
  }

  it('lists open jobs for the Active tab', async () => {
    const { service, fake } = setup({ my_deliveries: { data: [deliveryJobRow(), deliveryJobRow({ job_id: 'job-2', status: 'offered' })], error: null } });
    const orders = await service.listOrders('active');
    expect(orders.map((o) => o.id)).toEqual(['job-1', 'job-2']);
    expect(fake.calls[0]).toMatchObject({ kind: 'rpc', name: 'my_deliveries', args: { p_tenant: 'tenant-1', p_open_only: true } });
  });

  it('lists only finished jobs for History', async () => {
    const rows = [deliveryJobRow({ status: 'picked_up' }), deliveryJobRow({ job_id: 'job-9', status: 'delivered', finished_at: '2026-10-10T08:00:00Z' })];
    const { service, fake } = setup({ my_deliveries: { data: rows, error: null } });
    expect((await service.listOrders('history')).map((o) => o.id)).toEqual(['job-9']);
    expect(fake.calls[0]?.args).toEqual({ p_tenant: 'tenant-1', p_open_only: false });
  });

  it('accepts and rejects offers', async () => {
    const { service, fake } = setup({ respond_to_delivery: { data: 'assigned', error: null } });
    expect(await service.accept('job-1')).toBe('assigned');
    await service.reject('job-1', 'Too far');
    expect(fake.calls.map((c) => c.args)).toEqual([
      { p_job: 'job-1', p_accept: true, p_reason: null },
      { p_job: 'job-1', p_accept: false, p_reason: 'Too far' },
    ]);
  });

  it('moves a job forward with the position', async () => {
    const { service, fake } = setup();
    await service.advance('job-1', 'picked_up', { lat: 18.56, lng: 73.77 });
    await service.advance('job-1', 'at_drop', null);
    expect(fake.calls.map((c) => c.args)).toEqual([
      { p_job: 'job-1', p_status: 'picked_up', p_lat: 18.56, p_lng: 73.77 },
      { p_job: 'job-1', p_status: 'at_drop', p_lat: null, p_lng: null },
    ]);
  });

  it('completes with OTP and cash collected', async () => {
    const { service, fake } = setup();
    await service.complete('job-1', { otp: '4821', photoUrl: null, codCollected: 230, position: null });
    expect(fake.calls[0]).toMatchObject({ name: 'complete_delivery', args: { p_job: 'job-1', p_otp: '4821', p_photo_url: null, p_cod_collected: 230 } });
  });

  it("passes the server's refusal on (wrong OTP)", async () => {
    const { service } = setup({ complete_delivery: { data: null, error: { message: 'Wrong OTP' } } });
    await expect(service.complete('job-1', { otp: '0000', photoUrl: null, codCollected: 230, position: null })).rejects.toThrowError('Wrong OTP');
  });

  it('fails a delivery with a reason', async () => {
    const { service, fake } = setup();
    await service.fail('job-1', { reason: 'Customer not answering', photoUrl: null, position: { lat: 1, lng: 2 } });
    expect(fake.calls[0]).toMatchObject({ name: 'fail_delivery', args: { p_job: 'job-1', p_reason: 'Customer not answering', p_lat: 1, p_lng: 2 } });
  });
});
