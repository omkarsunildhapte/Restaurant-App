import { MapPoint, RiderOrder } from '@appTypes/order.types';

/** A point on the map. */
export type TrackPoint = MapPoint;

/** The delivery the track-map page follows: the rider's newest open job. */
export type ActiveDelivery = RiderOrder;
