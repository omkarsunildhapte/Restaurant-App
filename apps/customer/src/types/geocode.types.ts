/** Address parts returned by the backend geocoder (Nominatim behind our API). */
export interface GeocodeAddress {
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface GeocodeResult {
  /** Nominatim place_id. */
  placeId: number;
  displayName: string;
  lat: number;
  lng: number;
  address: GeocodeAddress;
}

/** GET /geocode/search */
export interface GeocodeSearchResponse {
  results: GeocodeResult[];
  attribution: string;
}

/** GET /geocode/reverse */
export interface GeocodeReverseResponse {
  result: GeocodeResult | null;
  attribution: string;
}

/** The editable delivery address form (every field a string so each binds to an input). */
export interface AddressForm {
  line: string;
  road: string;
  suburb: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

/** The address search box. */
export interface AddressSearchForm {
  query: string;
}
