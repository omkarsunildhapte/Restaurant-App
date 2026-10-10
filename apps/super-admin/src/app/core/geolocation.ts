/**
 * The device's current position, from the browser's Geolocation API
 * (navigator.geolocation.getCurrentPosition). Used on visits: the salesperson stands at the
 * restaurant and taps "Use my current location".
 *
 * Only works on HTTPS or localhost, and only after the person allows location access.
 * Addresses are never looked up here: that goes through the platform's Nominatim endpoint.
 */
export interface Position {
  latitude: number;
  longitude: number;
  /** Metres, as the device reports it. A phone outdoors is ~5–20 m; a laptop on Wi-Fi can be 1 km+. */
  accuracyM: number;
}

export function currentPosition(): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This browser cannot share its location.'));
      return;
    }
    if (!window.isSecureContext) {
      reject(new Error('Location only works on a secure (https) page.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: round6(position.coords.latitude),
          longitude: round6(position.coords.longitude),
          accuracyM: Math.round(position.coords.accuracy),
        }),
      (error) => reject(new Error(MESSAGES[error.code] ?? 'Could not get your location.')),
      // A fresh, precise fix: a cached position from the last place visited would be wrong.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

const MESSAGES: Record<number, string> = {
  1: 'Location permission was refused. Allow location for this site in the browser settings and try again.',
  2: 'Your location is not available right now. Turn on GPS or location services and try again.',
  3: 'Getting your location took too long. Step outside or near a window and try again.',
};

/** Six decimals is about 10 cm, more than any phone can deliver; it is what the database stores. */
function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/** A link that opens the point on OpenStreetMap (the platform does not use Google Maps). */
export function osmLink(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;
}
