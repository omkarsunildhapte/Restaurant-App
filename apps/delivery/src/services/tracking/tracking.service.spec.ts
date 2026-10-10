import { TestBed } from '@angular/core/testing';
import { TrackingService } from '@services/tracking/tracking.service';
import { OrdersService } from '@services/orders/orders.service';
import { deliveryJobRow } from '@testing/delivery-fixtures';
import { toRiderOrder } from '@utils/delivery-job/delivery-job.util';

describe('TrackingService', () => {
  function setup(statuses: string[]) {
    const listOrders = vi.fn(async () => statuses.map((status, n) => toRiderOrder(deliveryJobRow({ job_id: `job-${n}`, status }))));
    TestBed.configureTestingModule({ providers: [{ provide: OrdersService, useValue: { listOrders } }] });
    return { service: TestBed.inject(TrackingService), listOrders };
  }

  it('follows the newest accepted, unfinished job', async () => {
    const { service, listOrders } = setup(['offered', 'picked_up', 'assigned']);
    expect((await service.getActiveDelivery())?.id).toBe('job-1');
    expect(listOrders).toHaveBeenCalledWith('active');
  });

  it('has nothing to follow with only offers (or no jobs)', async () => {
    expect(await setup(['offered']).service.getActiveDelivery()).toBeNull();
  });
});
