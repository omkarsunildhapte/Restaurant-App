import { Injectable } from '@angular/core';
import { ActiveDelivery } from '@appTypes/tracking.types';

/** Live tracking for the track-map page. Stub until Phase 5: there is no active delivery. */
@Injectable({ providedIn: 'root' })
export class TrackingService {
  // TODO(Phase 5): Supabase tables delivery_jobs + orders (the rider's open job) and rider_locations
  async getActiveDelivery(): Promise<ActiveDelivery | null> {
    return null;
  }
}
