import { TestBed } from '@angular/core/testing';
import { OrdersService } from '@services/orders/orders.service';

describe('OrdersService (Phase 5 stub)', () => {
  it('lists no orders for either segment', async () => {
    const service = TestBed.inject(OrdersService);
    expect(await service.listOrders('active')).toEqual([]);
    expect(await service.listOrders('history')).toEqual([]);
  });
});
