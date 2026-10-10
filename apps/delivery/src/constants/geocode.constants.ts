/** Backend geocoding endpoints (proxying OpenStreetMap Nominatim), relative to environment.apiUrl. */
export const GEOCODE = {
  SEARCH_PATH: '/geocode/search',
  REVERSE_PATH: '/geocode/reverse',
  QUERY_PARAM: 'q',
  LAT_PARAM: 'lat',
  LNG_PARAM: 'lng',
  /** Required by the OpenStreetMap licence wherever geocoded results are shown. */
  ATTRIBUTION: '© OpenStreetMap contributors',
} as const;
