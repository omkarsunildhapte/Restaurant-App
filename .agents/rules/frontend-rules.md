# Thaliyo Frontend Rules — Coding Standards & Best Development Practice

These rules apply to **every Angular app in this repo**: `apps/business-panel`, `apps/customer`, `apps/delivery`, `apps/staff`, `apps/super-admin`. Project baseline, alias map, folder structure and per-app notes are in [`AGENTS.md`](../AGENTS.md); runtime performance rules (P1-P8) are in [`performance.md`](./performance.md).

Adapted from the Meal Sehat admin rules. **Rule numbers are kept identical** so a rule reference means the same thing in both codebases. Where Thaliyo differs (SSR is on, Supabase instead of a JWT API, Ionic in the mobile apps), the rule says so.

## 1. Import Paths
Absolute paths with the `@` alias must be used everywhere. Relative paths (`../` or `./`) are strictly prohibited.

Allowed aliases (mapped in `tsconfig.json`):
- `@app/*`: `app/*`
- `@shared/*`: `app/shared/*`
- `@pages/*`: `app/pages/*`
- `@components/*`: `app/components/*`
- `@services/*`: `services/*`
- `@appTypes/*`: `types/*`
- `@store/*`: `store/*`
- `@constants/*`: `constants/*`
- `@utils/*`: `utils/*`
- `@guard/*` or `@guards/*`: `guards/*`
- `@interceptors/*`: `interceptors/*`
- `@directives/*`: `directives/*`
- `@pipes/*`: `pipes/*`
- `@environments/*`: `environments/*`
- `@testing/*`: `testing/*` — importable from `.spec.ts` files only

## 2. Import Formatting
Every import stays on a single line, full stop — no matter how many names it destructures or how long the line runs. Multi-line destructured imports are never allowed, regardless of length.

```typescript
// NOT ALLOWED, at any length:
import {
  Component,
  inject,
  signal,
  computed
} from '@angular/core';

// ALLOWED, even when it runs well past a normal line width:
import { Component, inject, signal, computed } from '@angular/core';
import { CUSTOMERS_CLEAR_FILTERS_LABEL, CUSTOMERS_NO_PHONE_LABEL, CUSTOMERS_NO_ZONE_LABEL, CUSTOMERS_PANEL, CUSTOMER_DATE_FORMAT, customerJoinedChip, customerRef } from '@constants/customer.constants';
```

Before reaching for an import list this long, check whether the source file already groups those names into one object export (see the constants-grouping convention in `AGENTS.md`) — importing one grouped object is preferable to importing many loose names either way, independent of this rule.

Before reaching for a long import, check whether the source file already groups those names into one object export (see the constants-grouping convention in `AGENTS.md`) — importing one grouped object is preferable to importing many loose names either way, and shrinks the import block back toward Rule 2's single-line preference.

## 3. Strict Typing
The use of `any` is strictly prohibited. Use `unknown` or create proper interfaces/types. Server-side data must be properly typed when received.

This also applies to templates: the `$any()` template cast is prohibited. For DOM event handlers (e.g. `(input)`, `(change)`), pass the raw `$event` to a component method typed to accept `Event`, then cast `event.target` to the correct HTML element type (e.g. `event.target as HTMLSelectElement`) inside the `.ts` file — never inline in the template.

## 4. CSS Optimization
Avoid dumping component-specific styles into the global `styles.css`. If a CSS class is only used by one specific component, it must be placed in that component's respective `.css` file. Global `styles.css` should only contain design tokens, generic utility classes and base resets. Component styles are also budgeted — `angular.json` warns at 4 kB and errors at 8 kB per component stylesheet.

## 5. Modern Templates & Control Flow
Do not import `CommonModule`. Use standalone components and specific imports — if a template needs a pipe, import that pipe alone (`DatePipe`, `DecimalPipe`, `TitleCasePipe`, `UpperCasePipe`). Use the built-in `@if`, `@for`, and `@switch` control flow syntax exclusively; `*ngIf`, `*ngFor`, `[ngClass]`, and `[ngStyle]` are prohibited (use `[class]` / `[style]` bindings instead). When using `@for`, a unique tracking key is **mandatory** (e.g., `@for (item of items(); track item.id)`) to ensure optimal DOM reconciliation.

## 6. Signals-First Reactivity
Use Angular Signals exclusively for reactivity and state management instead of traditional RxJS `BehaviorSubjects` or standard properties.
- **Component I/O:** Use `input()`, `input.required()`, `output()`, and `model()` instead of legacy `@Input`/`@Output` decorators.
- **Dependent State:** Use `linkedSignal()` for state that needs to reset based on a source signal, rather than manual `effect()` logic.
- **Queries:** Use signal-based `viewChild`, `viewChildren`, `contentChild`, and `contentChildren` instead of `@ViewChild`/`@ContentChild`.

## 7. Dependency Injection
Prefer using the `inject()` function for dependency injection over traditional constructor parameter injection. Constructors should primarily be used for initialization logic, not for declaring dependencies.
- For services that are only needed after a specific user action (e.g. a heavy export or upload flow), use `injectAsync(() => import('./x').then(m => m.X))` to lazy-load the service's bundle rather than eagerly importing it. Pair with `injectAsync(loader, { prefetch: onIdle })` when the service should preload once the browser is idle rather than waiting for first use.

## 8. Data Fetching (Resource APIs)
Angular services and components must use the built-in `resource()`, `rxResource()`, or `httpResource()` APIs for asynchronous reads, rather than manual RxJS subscriptions or raw Promises in components. This gives declarative, auto-cancelling fetching with built-in race-condition handling.
- **Supabase reads** go through `resource()` (supabase-js returns Promises): the `loader` calls a typed service method, e.g. `loader: () => this.menuService.listItems(this.outletId())`. **Backend API reads** (`environment.apiUrl`, e.g. `/geocode`, `/platform/v1`) use `httpResource<T>()` or `rxResource()` over an `HttpClient` service method.
- Always supply a `defaultValue` so templates never branch on `undefined` at startup. Return `undefined` from the request/params lambda when the resource should not fire (e.g. no outlet selected yet) rather than gating with a manual flag.
- Prefer the resource's `status()` signal (`idle | loading | reloading | error | resolved | local`) over ad-hoc booleans when distinguishing first load from a background reload.
- When deriving one resource from another, use `resource.snapshot` with `resourceFromSnapshots()` rather than hand-rolled derived loading/error state.
- Writes (insert/update/delete/RPC) may return a Promise or `Observable`; pair them with `.reload()` on the affected resource.
- **Gotchas (learned in Meal Sehat, apply here):**
  - Omitting `params` means the resource only reloads on an explicit `.reload()`; use that for search boxes so typing doesn't fire a request per keystroke (or `debounced()` the input signal, Rule 24).
  - `resource.value()` throws while the resource is in an error state. Keep a `lastLoaded` signal synced via an `effect()` guarded by `resource.hasValue()`, so a failed reload keeps the previous data on screen (with a toast) instead of blanking or throwing.
- **SSR:** resources that need the signed-in user's session must not run on the server (the session lives in the browser). Those routes are `RenderMode.Client` in `app.routes.server.ts`, or the loader returns early when `isPlatformServer`.

## 9. Service Layer Typings
The service layer must **never** declare its own data models/interfaces inline. **Every shared type lives in `src/types/`, imported via `@appTypes/`** — entity shapes, unions, API response envelopes and view-model types alike. There is no separate models folder: `src/models/` and the `@models/*` alias were removed when the two merged, so an import from `@models/` does not resolve.

Within `@appTypes/`, one file per domain (`package.types.ts`, `voucher.types.ts`, …) plus `common.types.ts` for the shapes more than one domain needs. Build on the bases in `common.types.ts` rather than restating their fields:

- **Entities** — `Entity` → `CreatedEntity` → `TimestampedEntity` → `SoftDeletableEntity`, and `NamedRef` for the `{ id, name }` stub an API includes so a row can print a name without a second request.
- **List queries** — `PaginationParams`, `SearchParams`, `SortParams<T>`, composed as `ListQueryParams<T>`. A `*ListFilters` type extends whichever of these it actually sends and adds only its own fields.
- **View models** — `TableColumn` / `SortableColumn`, `FilterChip`, `TabConfig`, `ActionButton`, `StatTile`, `LabelledValue`, and the rest.

Narrow an inherited member where a domain is genuinely narrower (a two-value `align`, a specific `sortBy` union); do not re-declare it unchanged.

All API responses must be typed with the envelope generics in `@appTypes/api-response.types` — `PaginatedResponse<T>`, `ApiItemResponse<T>`, `ApiListResponse<T>`, `ApiActionResponse` for backend API calls (the backend's `{ error, errorCode }` error shape included) — never with a bare entity type or `any`.

**Money is `number`, in rupees.** Postgres `numeric` columns arrive from Supabase/PostgREST as JSON numbers. Do not widen a price, amount or rate to `number | string`. Database row types are generated from the schema (`database.types.ts`, owned by the database work stream) — build domain types on them rather than re-typing columns by hand.

## 10. Function Formatting
Functions with a single parameter should be kept on a single line where possible, avoiding multi-line formatting for single arguments (e.g. `getPackageById(id: number): Observable<...>` instead of wrapping the argument on a new line).

## 11. State Management (Loading States)
Do not maintain generic UI loading states (like `isLoading`) manually within components or services via boolean flags. Components should rely on the reactive getters provided by Resource APIs (`resource.isLoading()`, `resource.error()`) to automatically manage their loading states when fetching data.

## 12. Service Testing
Whenever a service is created or updated, you must write or update the corresponding unit test cases for it. Ensure full coverage of the service's logic, including mock HTTP calls (`provideHttpClientTesting`) if it's a data service.

## 13. Zero-Dependency State Encapsulation
Services must manage state using private writable signals (`signal()`) exposed to components via public read-only views (`computed()`), avoiding heavy external libraries like NgRx unless absolutely necessary.

## 14. Functional Routing & Interceptors
Class-based guards and interceptors are legacy. Use functional `HttpInterceptorFn`, `CanActivateFn`, and `ResolveFn`. `withComponentInputBinding()` is enabled in `app.config.ts`, so route params map straight onto component signal inputs — read them that way rather than injecting `ActivatedRoute`.
- Authenticated panels are children of the `Layout` route; put the guard on the parent rather than repeating it per panel. See `AGENTS.md` → Routing for the path constants and lazy-loading contract.
- If a route declares its own `providers`, add `withExperimentalAutoCleanupInjectors()` to `provideRouter(...)` so those service instances are destroyed on navigating away rather than living for the app's lifetime. Still experimental in Angular 22 — verify current status before relying on it in production.
- For active-link state, use the reactive `isActive('/path', router, options)` signal from `@angular/router` instead of `routerLinkActive` boilerplate or manual URL comparison, especially when the active state needs to be read from component logic and not just applied as a CSS class.

## 15. Signal-Driven Forms
Signal Forms (`@angular/forms/signals`) is stable as of Angular 22 and is the required approach for new forms; do not bridge to legacy Reactive Forms unless integrating with a pre-existing Reactive Forms component (use `compatForm`/`SignalFormControl` from `@angular/forms/signals/compat` for that case only).
- Build forms with the `form(dataSignal, schema)` function; bind fields in templates via the `FormField` directive (`[formField]="myForm.name"`).
- Use the Submission API (`submission: { action, onInvalid, ignoreValidators }` on `form()`, or the standalone `submit()` helper) instead of hand-written submit handlers, and bind `<form>` via the `FormRoot` directive so native browser validation and duplicate error messages are suppressed automatically.
- Use `validateStandardSchema()` for Zod/Valibot-based validation instead of writing custom validator functions when a Standard Schema-compatible library is already in use.
- Use `provideSignalFormsConfig({ classes: { ... } })` for status-driven CSS classes (`ng-invalid`, `ng-dirty`, etc.) instead of manually toggling classes from component code.
- Use the `disabled` / `readonly` / `hidden` helpers with a `when` predicate for conditional field state, not manual `[disabled]` bindings driven by component booleans.
- **Ionic apps:** Ionic's form components (`ion-input`, `ion-select`, `ion-checkbox`, …) work with Signal Forms through the `FormField` directive only where verified; if a component does not round-trip correctly, bind it with native signal bindings (`[value]` + `(ionInput)`) and say why in a comment. Do not fall back to `ngModel`.

## 16. Zoneless, Deferred Loading & SSR
- Every app is Zoneless (`provideZonelessChangeDetection()`). Never reintroduce Zone.js or code that depends on it. Anything mutating state outside a signal (raw `setTimeout`, Supabase Realtime callbacks, Capacitor plugin callbacks, third-party widgets) must write into a `signal()` so change detection is notified.
- Use `@defer` for below-the-fold or non-critical UI (`on viewport`, `on idle`, `on interaction`).
- **SSR is on for the web build of every app** (user decision). Server routes live in `app.routes.server.ts`: `RenderMode.Server` by default, `RenderMode.Client` for pages that only make sense with the browser session (dashboards, account screens), `RenderMode.Prerender` for public static pages. The Capacitor `mobile` build configuration is static (`outputMode: static`, no SSR).
- Hydration: `provideClientHydration()` is used where it works. **Ionic apps keep `ngSkipHydration` on `<ion-app>`**, because Ionic components rewrite their own DOM and cause NG0500 mismatches. Use `withEventReplay()` only where hydration is on.
- Browser-only APIs (`window`, `document`, `localStorage`, `navigator.*`, Capacitor plugins, Supabase auth) run only behind `isPlatformBrowser`/`afterNextRender`. Inject `DOCUMENT` instead of using the global `document`. Never test for the browser with `typeof localStorage` (Node 25+ has a global `localStorage`). A server render that crashes silently falls back to client rendering, so verify SSR by checking the server HTML for real content.
- Allowed hosts for the SSR engine come from `NG_ALLOWED_HOSTS`.

## 17. Security
- **Supabase keys:** apps only ever hold the **anon** key (`environment.supabase.anonKey`). The service-role key exists only in `backend/.env` and never in an app, a test fixture or a commit. Access control is enforced by Postgres RLS, so never "fix" a permission error in the client.
- Auth state comes from supabase-js (`AuthService`'s `session` signal). Don't store tokens yourself; any app-owned `localStorage` key is a constant in `@constants/storage-keys.constants`.
- Guards check a real session (and role from `my_workspaces()` where relevant), not the mere presence of a key. A guard that rejects clears stale local state.
- The backend bearer token is attached only to requests whose URL starts with `environment.apiUrl`. Never send it to third-party URLs (storage signed URLs, Nominatim, map tiles).
- Geocoding goes through the backend `/geocode` endpoint only, on explicit submit (Nominatim policy). Never call Nominatim or Google geocoding from an app.
- Do not bypass Angular's sanitizer with `DomSanitizer.bypassSecurityTrust*`. Customer-supplied text (reviews, notes, addresses, restaurant names) is exactly what sanitization exists for. Logos/uploads are PNG/WebP only (SVG can carry script).
- CSP headers are set by the host or the SSR server, not by nonce code in components.

## 18. Animations & Assets
Prefer Web Animations API and CSS keyframes bound to component host classes over `@angular/animations` to save ~60KB on bundle sizes.

## 19. Strict Template Diagnostics
Enforce strict template checks (`strictTemplates`, `strictInputAccessModifiers`, `invalidBananaInBox`) in `tsconfig.json` to catch unhandled signals or missing control flows at build time. These are enabled — do not weaken them to make an error go away; fix the type instead.

## 20. Mandatory File Structure & Testing
- **Components:** Every Angular component MUST have its own dedicated `.ts`, `.html`, `.css`, and `.spec.ts` file. Inline templates or inline styles within the `.ts` file are strictly prohibited.
- **Other Elements:** All other architectural pieces (Services, Directives, Pipes, Guards, Interceptors, Utils) MUST have a `.ts` file and an accompanying `.spec.ts` file for unit testing.

## 21. No Hardcoded Values in TypeScript
Never use "magic numbers" or hardcoded string values directly in TypeScript (`.ts`) files.
- All configuration values, API endpoints, status strings, storage keys, Supabase table, RPC and Realtime channel names, numeric thresholds, and user-facing message copy must be extracted into constants (`const`), `enum`s, or environment variables under `src/constants/`.
- *Exception:* Hardcoded string values are permitted in HTML template (`.html`) files for direct UI display purposes.

## 22. HTML Template Standards
Never hardcode repeated UI items directly in HTML templates.

- Do not write multiple `<option>`, `<a>`, tab, card, badge, or button elements manually when the data is a list.
- Move the data to the component `.ts` file as a typed array (interface in `types/`, constant in `constants/`).
- Render it with `@for` and a mandatory `track` key.

Applies to: select options, radio buttons, nav links, tabs, breadcrumbs, chips, action menus, filter options, status badges, repeated cards, and dashboard tab definitions.

## 23. Documentation Sync
Planning docs live in `docs/` (ROADMAP, REQUIRED-CHANGES, PILOT-PLAN, REPO-LAYOUT …) and the brand in `brand/`. Update the affected document **in the same change** that makes it true (tick the roadmap item, add the update-log line). Never document work that isn't done. Each work stream edits only its own sections (see `docs/REPO-LAYOUT.md`).

## 24. Angular 22 Baseline (Change Detection, HTTP, Debouncing)
The project targets Angular 22. The following are now the required defaults, not opt-in choices:

- **Change detection:** All new components must use (or implicitly get) `ChangeDetectionStrategy.OnPush`, which is the framework default in v22. Do not set `changeDetection: ChangeDetectionStrategy.Eager` on new components — `Eager` exists only for legacy migration compatibility and must not be used in new code.
- **HTTP backend:** `HttpClient` uses `FetchBackend` by default; do not call the now-deprecated `withFetch()`. If a feature genuinely needs upload-progress events (`reportUploadProgress`), it must explicitly opt into `provideHttpClient(withXhr())` — Fetch does not support upload progress and Angular will throw if this is misconfigured. Use `reportDownloadProgress` (Fetch-compatible) wherever only download progress is needed. Relevant here: bill-photo and logo uploads, and CSV exports.
- **Debouncing signals/resources:** Use the built-in `debounced(signal, ms)` function for delaying resource/signal updates (e.g. the panel search boxes) instead of hand-rolled `setTimeout`/RxJS `debounceTime` shims outside of forms. Signal Forms has debouncing built in for form fields — prefer that over a manual `debounced()` wrapper inside form code.
- **TypeScript/Node baseline:** TypeScript 6.0 and Node.js 24 LTS (`.nvmrc`; Angular 22 also supports 22.22+ and 26+, not 25). Do not add code that depends on TypeScript 5.9-only syntax.

## 25. Angular 22 Template Syntax
Prefer these native template capabilities over component-side workarounds now that they're supported:
- Object/array spread and rest arguments are allowed directly in templates (e.g. `[class]="{ ...baseClasses, active: isActive() }"`) — don't pre-compute spread objects in the component just to avoid template syntax.
- `@switch` supports fall-through `@case` stacking and exhaustiveness checks via `@default never;` (or `@default never(expr);` when switching on a narrowed property). Add exhaustiveness checks to `@switch` blocks over union-typed state (order status, subscription status, review kind) so new union members fail the build instead of silently falling into `@default`.
- Arrow functions with implicit returns are allowed in template expressions (useful in `@for` + event bindings) — block-bodied arrow functions and pipes inside them are still not allowed.
- `?.` in templates now follows real JavaScript short-circuit semantics (short-circuits to `undefined`, not Angular's old special-cased behavior). Do not rely on the pre-v22 behavior; wrap with `$null(...)` only if the old semantics are genuinely required for a specific expression.
- `//` and `/* */` comments are permitted inside element attribute lists for documenting non-obvious bindings on complex elements.

## 26. Angular 22 Security Defaults
Angular 22 extends built-in sanitization to dynamic `href`/`xlink:href` on SVG `<a>` elements, `meta` selectors, and `placeholder` values, and normalizes namespaced tag names. Do not bypass this with `DomSanitizer.bypassSecurityTrust*` calls for these cases unless the value is verified server-controlled and there is no alternative — bypassing sanitizer defaults must be flagged in code review, not treated as a routine fix for a sanitizer warning.


## 27. Ionic & Capacitor (customer, delivery, staff)
- Ionic 9 is standalone: there is no `IonicModule` and no `/standalone` subpath. Controllers (`AlertController`, `ToastController` …) and `provideIonicAngular()` come from `@ionic/angular`; components come from their own entry points (next point). `provideIonicAngular()` lives in `app.config.ts`; the server config uses `importProvidersFrom(IonicServerModule)`.
- **Import each Ion* component from its own entry point** (e.g. `import { IonButton } from '@ionic/angular/ion-button'`), never from the `@ionic/angular` barrel: the barrel pulls ~700 kB of `@ionic/core` into the initial bundle (measured in `apps/delivery`: 1.39 MB → 830 kB).
- Icons are registered once in `src/app/icons.ts` via `addIcons()`, which is loaded through the build's `polyfills` (written without `.ts`), so server-rendered `<ion-icon>` resolves before code-split chunks run. Register only icons that are used.
- Capacitor plugins are called only on the browser side and behind a service (`@services/location`, `@services/push` …), never directly from a component. Check `Capacitor.isNativePlatform()` before native-only APIs.
- App identity: `com.thaliyo.app` (customer), `com.thaliyo.rider` (delivery), `com.thaliyo.staff` (staff). Static files live in `public/`, served from the site root.
- On a device, `localhost` is the phone: use the PC's LAN IP or `10.0.2.2` (emulator) in development environments.

---

Runtime performance and bundle-size rules (P1-P8) live in [`performance.md`](./performance.md).
