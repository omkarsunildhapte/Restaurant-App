# Super Admin (apps/super-admin)

Angular 22 + Tailwind 4 web console, copied from vernoka-admin's `web/` setup. It currently holds
the **Sales CRM**: dashboard, pipeline board/list, lead detail with activity log and WhatsApp
templates, follow-ups, areas, CSV import, dealers and team. It talks to the Python marketing API
(`backend/marketing`).

```bash
npm install
npm start                 # dev server, http://localhost:4300
npm test                  # Vitest unit tests (no Karma/Jasmine)
npm run build             # production build, with SSR
npm run serve:ssr         # run the SSR server from dist/ (port 4004; set PORT to change)
```

Sign-in is **Supabase Auth**, one login shared with the Node platform API. The app talks to
three backends: Supabase (`supabaseUrl`), the Python marketing API (`marketingApiUrl`, port 4100)
and the Node platform API (`platformApiUrl`, port 4000), all set in `src/environments/`.

**SSR:** the login page is rendered on the server; signed-in pages render in the browser,
because the Supabase session lives there (`src/app/app.routes.server.ts`). The server only
renders for allow-listed host names: localhost by default, otherwise set
`NG_ALLOWED_HOSTS=admin.example.in`. Code that touches `window`, `document` or `localStorage`
must go through `DOCUMENT` / `isPlatformBrowser` (see `core/layout.store.ts`).

Local testing against local Supabase needs the development configuration
(`ng build --configuration development`); the production build points at placeholder URLs
until the hosted Supabase project exists. The initial-bundle warning budget is 650 kB because
`@supabase/supabase-js` is part of startup.

The API URL is set per build in `src/environments/`. Sales CRM roles: **admin** (everything) and
**sales** (works leads; cannot delete leads or change dealers and the team).

The restaurant owners' Business panel is a separate app in `apps/` (the old Admin).
