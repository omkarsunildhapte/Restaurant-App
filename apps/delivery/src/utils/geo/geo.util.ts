import { MapPoint } from '@appTypes/order.types';
import { GEO } from '@constants/shift.constants';

/** Distance between two points in metres (haversine; plenty for a city). */
export function distanceMeters(a: MapPoint, b: MapPoint): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * GEO.EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}
