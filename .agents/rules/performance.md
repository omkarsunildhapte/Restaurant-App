# Thaliyo Frontend Rules — Performance & Load Optimization

Split out of [`frontend-rules.md`](./frontend-rules.md), whose Rules 1-26 cover code architecture and style. This document covers **runtime performance and bundle size** for every Thaliyo app. Restaurant staff use the business panel and staff app all day on mid-range Android tablets and phones, often on patchy mobile data, so fast screen switches, fast filtering and small bundles matter more than anything else. The customer app and restaurant websites also have a Core Web Vitals / SEO dimension (SSR, Rule 16).

## P1. Change Detection & Reactivity
- All components run `OnPush` (Angular 22 default — see Rule 24). Never fall back to `Eager` change detection in new code; it re-checks the entire tree on every event and is the single biggest avoidable cause of jank in large Angular apps.
- The app is Zoneless (Rule 16). Removing Zone.js's monkey-patched async tracking cuts bundle size and removes an entire class of unnecessary change-detection cycles — but it also means anything async that isn't a signal write will not trigger a re-render. Route Supabase Realtime events, timers, Capacitor and third-party callbacks through signals.
- Use signals (`signal`, `computed`, `linkedSignal`) instead of plain class fields for anything that drives the template.

## P2. Bundle Size & Code Splitting
- Lazy-load every feature route with `loadComponent`/`loadChildren`; nothing outside the shell and the current route's dependencies should be in the initial bundle. Every panel in `app.routes.ts` already uses `loadComponent` — adding a static import there would silently undo it.
- Use `injectAsync()` for services that pull in heavy libraries but are only needed after a user action (Rule 7). Pair with `{ prefetch: onIdle }` for features likely to be used soon.
- Prefer the Web Animations API / CSS keyframes over `@angular/animations` (Rule 18).
- Respect the production budgets in `angular.json`: initial bundle warns at **500 kB** and errors at **1 MB**; component styles warn at 4 kB and error at 8 kB. A build that trips the error threshold is a failed build, not a warning to route around.
- Run a bundle analyzer (`esbuild`'s `--metafile` output, or `source-map-explorer` against the production build) before every release to catch dependency bloat before it ships. `@supabase/supabase-js` is the largest non-Angular dependency — keep it out of public, signed-out pages where possible.
- Audit `package.json` for date/utility libraries (e.g. full `moment.js`, full `lodash`) and prefer tree-shakable alternatives (`date-fns`, `lodash-es` with named imports).

## P3. Deferred Loading
Use `@defer` blocks for below-the-fold or non-critical UI, with `on viewport` / `on idle` / `on interaction` chosen per component based on how soon it's actually needed. Modals, drawers, and the heavier editor forms (packages, service-area polygon editing) are natural `@defer (on interaction)` candidates. Hydration triggers (`hydrate on ...`) apply only where hydration is on (not under Ionic's `ngSkipHydration`).

## P4. Data & List Rendering
- Panels list operational data that grows without bound (orders, subscriptions, invoices, reviews). Always send `page`/`limit` to the API rather than fetching everything and filtering client-side; use Supabase `.range(from, to)` with `count: 'exact'`, or the backend's `PaginatedResponse<T>`.
- Debounce search inputs with `debounced()` (Rule 24) so keystrokes don't produce one request each.
- Every `@for` needs a stable `track` key (Rule 5) — re-keying a 500-row table on every reload is a visible stall.
- Prefer `computed()` over methods called from the template for derived/filtered lists; a method re-runs on every change detection pass, a `computed` re-runs only when its inputs change.

## P5. Images & Assets
Use `NgOptimizedImage` (`ngSrc`, `width`, `height`) for menu-item, logo and restaurant imagery so intrinsic sizing prevents layout shift while tables and cards load. Uploaded images should be served at a sensible size rather than shipping full-resolution originals into a list view.

## P6. Caching & HTTP Headers
- The build emits content-hashed assets (`outputHashing: "all"`); the static host must serve them with long `Cache-Control` + `immutable` headers, and `index.html` with a short/no-store policy so deploys are picked up immediately.
- Ensure gzip/Brotli compression is enabled at the host/CDN for HTML, JS, CSS, and JSON.
- Add `preconnect`/`dns-prefetch` hints for the API origin so the connection handshake overlaps with HTML parsing.

## P7. Monitoring & Auditing
- Check the browser console for zoneless change-detection warnings and unhandled errors before every release — `provideBrowserGlobalErrorListeners()` is enabled and will surface them.
- Watch the production build's reported bundle sizes on every release; a sudden jump means a dependency crept into the eager path.
- Profile the heaviest panels (packages, custom plans, orders) with the Angular DevTools profiler when a table feels slow, rather than guessing at the cause.

## P8. Useful Tooling
| Purpose | Tooling |
|---|---|
| Bundle analysis | `esbuild --metafile`, `source-map-explorer` |
| Component profiling | Angular DevTools profiler |
| Unit tests | Vitest via `@angular/build:unit-test` (`npm test`) |
| Date/utility libs | `date-fns`, `lodash-es` (named imports only — never the full `lodash` bundle) |
