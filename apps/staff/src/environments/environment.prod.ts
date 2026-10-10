/** Prod environment. Fill in once the hosted Supabase project and domain exist. */
export const environment = {
  name: 'prod',
  production: true,
  supabase: { url: '', anonKey: '' },
  /** Thaliyo support on WhatsApp, 12 digits with 91 (e.g. 919822012345). Empty hides "Help". */
  supportWhatsApp: '',
  apiUrl: '',
};
