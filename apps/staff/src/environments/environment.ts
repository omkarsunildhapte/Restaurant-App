/** Local development (the default build). staging/prod replace this file (angular.json). */
export const environment = {
  name: 'development',
  production: false,
  /** Local Supabase (`supabase status`). The anon key is public by design; never put the service-role key here. */
  supabase: { url: 'http://127.0.0.1:54321', anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' },
  /** Node platform API (backend/), for things the database can't do alone. */
  /** Thaliyo support on WhatsApp, 12 digits with 91 (e.g. 919822012345). Empty hides "Help". */
  supportWhatsApp: '',
  apiUrl: 'http://localhost:4000',
};
