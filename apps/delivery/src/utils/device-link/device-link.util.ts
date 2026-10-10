import { MapPoint } from '@appTypes/order.types';
import { DEVICE_LINKS } from '@constants/track-map.constants';

/** Opens the phone's maps app at a point, for turn-by-turn navigation (geo: URI, RFC 5870). */
export function mapLink(point: MapPoint | null): string | null {
  return point ? `${DEVICE_LINKS.GEO_PREFIX}${point.lat},${point.lng}?q=${point.lat},${point.lng}` : null;
}

/** Opens the dialler with a phone number (spaces and dashes removed). */
export function telLink(phone: string | null): string | null {
  const digits = phone?.replace(/[^\d+]/g, '') ?? '';
  return digits ? DEVICE_LINKS.TEL_PREFIX + digits : null;
}
