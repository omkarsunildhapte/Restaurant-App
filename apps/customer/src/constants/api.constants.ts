/** Backend API paths (relative to environment.apiUrl). */
export const API_ENDPOINTS = {
  GEOCODE_SEARCH: '/geocode/search',
  GEOCODE_REVERSE: '/geocode/reverse',
} as const;

export const API_PARAMS = {
  QUERY: 'q',
  LAT: 'lat',
  LNG: 'lng',
} as const;

export const AUTH_HEADER = {
  NAME: 'Authorization',
  bearer: (token: string) => `Bearer ${token}`,
} as const;
