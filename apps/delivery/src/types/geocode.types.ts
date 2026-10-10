/** Address parts the backend's /geocode endpoints return (from OpenStreetMap Nominatim). */
export interface GeocodeAddress {
  houseNumber?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;
}

export interface GeocodeResult {
  /** Nominatim place_id */
  placeId: number;
  displayName: string;
  lat: number;
  lng: number;
  address: GeocodeAddress;
}

/** GET /geocode/search?q= */
export interface GeocodeSearchResponse {
  results: GeocodeResult[];
  attribution: string;
}

/** GET /geocode/reverse?lat=&lng= */
export interface GeocodeReverseResponse {
  result: GeocodeResult | null;
  attribution: string;
}
