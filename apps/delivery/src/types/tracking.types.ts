/** A point on the map. */
export interface TrackPoint {
  lat: number;
  lng: number;
}

/** The delivery the track-map page follows (TODO(Phase 5): delivery_jobs + rider_locations). */
export interface ActiveDelivery {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
}
