import { TestBed } from '@angular/core/testing';
import { TrackingService } from '@services/tracking/tracking.service';

describe('TrackingService (Phase 5 stub)', () => {
  it('has no active delivery', async () => {
    expect(await TestBed.inject(TrackingService).getActiveDelivery()).toBeNull();
  });
});
