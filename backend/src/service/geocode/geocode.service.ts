// OpenStreetMap Nominatim client. Every app geocodes through this module, never directly:
// the public Nominatim policy (https://operations.osmfoundation.org/policies/nominatim/) allows
// at most 1 request/second from one application, needs an identifying User-Agent, and expects
// results to be cached. Search-as-you-type is not allowed; apps search on submit only.

import { config } from '@config/env.config.js';
import { AppError } from '@utils/app-error.utils.js';
import type { GeocodeResult } from '@type/dto/geocode.dto.js';

export type { GeocodeResult };

export const attribution = '© OpenStreetMap contributors';

interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

const cacheTtlMs = 7 * 24 * 60 * 60 * 1000;
const cacheMaxEntries = 5000;
const cache = new Map<string, { expires: number; value: GeocodeResult[] }>();
const inFlight = new Map<string, Promise<GeocodeResult[]>>();

// One request at a time, at least minIntervalMs apart, across the whole API process.
let queue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

function throttled<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastRequestAt + config.nominatim.minIntervalMs - Date.now();
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastRequestAt = Date.now();
    return task();
  });
  queue = run.catch(() => undefined);
  return run;
}

function toResult(place: NominatimPlace): GeocodeResult {
  const a = place.address ?? {};
  return {
    placeId: place.place_id,
    displayName: place.display_name,
    lat: Number(place.lat),
    lng: Number(place.lon),
    address: {
      road: a['road'],
      suburb: a['suburb'] ?? a['neighbourhood'],
      city: a['city'] ?? a['town'] ?? a['village'],
      state: a['state'],
      postcode: a['postcode'],
      country: a['country'],
    },
  };
}

async function fetchPlaces(path: string, params: Record<string, string>): Promise<GeocodeResult[]> {
  const url = new URL(path, config.nominatim.url);
  url.search = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', ...params }).toString();
  const res = await fetch(url, {
    headers: { 'User-Agent': config.nominatim.userAgent, 'Accept-Language': 'en' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw AppError.upstream(`Address lookup failed (${res.status}). Try again later.`);
  }
  const body = (await res.json()) as NominatimPlace | NominatimPlace[] | { error: string };
  if ('error' in body) {
    return []; // reverse lookup with no address at that point
  }
  return (Array.isArray(body) ? body : [body]).map(toResult);
}

async function cached(key: string, load: () => Promise<GeocodeResult[]>): Promise<GeocodeResult[]> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.value;
  }
  const pending = inFlight.get(key);
  if (pending) {
    return pending;
  }
  const promise = throttled(load)
    .then((value) => {
      cache.delete(key);
      cache.set(key, { expires: Date.now() + cacheTtlMs, value });
      if (cache.size > cacheMaxEntries) {
        cache.delete(cache.keys().next().value!);
      }
      return value;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

export function search(query: string): Promise<GeocodeResult[]> {
  const q = query.trim().replace(/\s+/g, ' ');
  return cached(`s:${q.toLowerCase()}`, () =>
    fetchPlaces('search', { q, limit: '5', ...(config.nominatim.countryCodes && { countrycodes: config.nominatim.countryCodes }) }),
  );
}

export async function reverse(lat: number, lng: number): Promise<GeocodeResult | null> {
  // ~1 m precision: nearby GPS fixes share a cache entry.
  const la = lat.toFixed(5);
  const ln = lng.toFixed(5);
  const results = await cached(`r:${la},${ln}`, () => fetchPlaces('reverse', { lat: la, lon: ln, zoom: '18' }));
  return results[0] ?? null;
}

/** Test hook. */
export function resetGeocodeState() {
  cache.clear();
  inFlight.clear();
  queue = Promise.resolve();
  lastRequestAt = 0;
}
