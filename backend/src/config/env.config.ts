/** Environment settings, read once at startup. Every other file imports `config` from here. */
export type AppEnv = 'development' | 'staging' | 'production';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

const appEnv = (process.env.APP_ENV ?? 'development') as AppEnv;

export const config = {
  appEnv,
  // 3000 is often taken by other local dev servers; 4100 = marketing API, 4201 = business-panel, 4300 = super-admin.
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:4200,http://localhost:4201,http://localhost:4300,http://localhost:8100,http://localhost:4001,http://localhost:4002,http://localhost:4003,http://localhost:4004,http://localhost:4006,http://localhost:4500,http://localhost:4400,https://localhost,capacitor://localhost').split(',').map((o) => o.trim()),
  supabase: {
    url: appEnv === 'development' ? (process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321') : required('SUPABASE_URL'),
    // Public key: the API acts as the signed-in user with it, so database RLS decides access.
    anonKey: process.env.SUPABASE_ANON_KEY ?? '',
    // Server-side only. Never ship this key to an app.
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },
  // Business panel address that invite emails link to.
  consoleUrl: process.env.CONSOLE_URL ?? 'http://localhost:4201',
  // Geocoding goes through the API only (see service/geocode/geocode.service.ts).
  nominatim: {
    url: process.env.NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org/',
    // Nominatim policy: identify the app and give a contact, e.g. "Thaliyo/1.0 (ops@thaliyo.com)".
    userAgent: appEnv === 'development' ? (process.env.NOMINATIM_USER_AGENT ?? 'Thaliyo-dev/0.1') : required('NOMINATIM_USER_AGENT'),
    countryCodes: process.env.NOMINATIM_COUNTRY_CODES ?? 'in',
    minIntervalMs: Number(process.env.NOMINATIM_MIN_INTERVAL_MS ?? 1100),
  },
};
