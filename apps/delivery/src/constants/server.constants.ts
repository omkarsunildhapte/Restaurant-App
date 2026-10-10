/** SSR server defaults (src/server.ts). */
export const SERVER = {
  /** 4000 is the backend API; the delivery SSR server uses 4003. */
  DEFAULT_PORT: 4003,
  /** Used when NG_ALLOWED_HOSTS is not set. */
  DEFAULT_ALLOWED_HOSTS: 'localhost,127.0.0.1',
  ALLOWED_HOSTS_SEPARATOR: ',',
  BROWSER_DIST: '../browser',
  STATIC_MAX_AGE: '1y',
  ALLOWED_HOSTS_ENV: 'NG_ALLOWED_HOSTS',
  PORT_ENV: 'PORT',
  PM2_ENV: 'pm_id',
} as const;
