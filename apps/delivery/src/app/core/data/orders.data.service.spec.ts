import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { OrdersDataService } from './orders.data.service';

describe('OrdersDataService', () => {
  let service: OrdersDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrdersDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns no orders until Supabase is wired (Phase 5)', async () => {
    expect(await firstValueFrom(service.getOrders())).toEqual([]);
  });
});
