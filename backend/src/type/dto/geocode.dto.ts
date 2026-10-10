import { z } from 'zod';

/** GET /geocode/search?q= */
export const searchQuerySchema = z.object({ q: z.string().trim().min(3).max(200) });

/** GET /geocode/reverse?lat=&lng= */
export const reverseQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export interface GeocodeResult {
  /** Nominatim place_id; store it with the coordinates (e.g. outlets.osm_place_id). */
  placeId: number;
  displayName: string;
  lat: number;
  lng: number;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}
