/** Production environment. */
export const environment = {
  production: true,
  /** Python marketing API (backend/marketing): Sales CRM, website demo requests. */
  marketingApiUrl: 'https://api.example.com/marketing/api/v1',
  /** Node platform API (backend/, /platform): restaurants, plans, staff invites. */
  platformApiUrl: 'https://api.example.com/platform/v1',
  /** Hosted Supabase project: set before the first production build. */
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR-ANON-KEY',
};
