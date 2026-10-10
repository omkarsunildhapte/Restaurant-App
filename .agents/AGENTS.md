# Thaliyo — Agent Rules

These rules must be followed by every person and agent writing frontend code in this repo. This file is the entry point: project baseline, alias map, folder structure, routing. The full coding standard is **[`rules/frontend-rules.md`](./rules/frontend-rules.md)** (Rules 1-27) — read it before writing any code. Runtime performance and bundle-size rules (P1-P8) are in **[`rules/performance.md`](./rules/performance.md)**.

Who owns which folder is in [`docs/REPO-LAYOUT.md`](../docs/REPO-LAYOUT.md); the plan is in [`docs/ROADMAP.md`](../docs/ROADMAP.md); the brand is in [`brand/`](../brand/README.md).

---

## Project Baseline

| | |
|---|---|
| Framework | Angular 22.2 — standalone only (no `NgModule`, no `*.module.ts`), signals-first |
| Language | TypeScript 6.0, strict, strict templates |
| Runtime | Node.js 24 LTS (`.nvmrc`) |
| Rendering | **SSR for the web build** (`@angular/ssr`, `AngularNodeAppEngine`, Express 5); Capacitor apps add a static `mobile` build |
| Change detection | Zoneless (`provideZonelessChangeDetection()`), OnPush |
| Styling | Tailwind CSS 4 (`@tailwindcss/postcss`), brand tokens in `styles.css`; component CSS in the component's own `.css` |
| Data | Supabase (Postgres + RLS, Auth, Storage, Realtime) via `@supabase/supabase-js`; the Node API (`backend/`, `environment.apiUrl`) for privileged actions and geocoding |
| Push | Firebase Cloud Messaging only (`firebase/messaging`) |
| Unit tests | Vitest via `@angular/build:unit-test` (`npm test`) |
| E2E tests | Playwright (`npm run e2e`), Supabase and the API stubbed by default |
| Lint / format | ESLint 9+ flat config with `angular-eslint`, Prettier |

### Apps

| App | Who uses it | Ionic | Dev port | SSR port |
|---|---|---|---|---|
| `apps/business-panel` | Restaurant owner, manager | no | 4201 | 4001 |
| `apps/customer` | Diners | Ionic 9 + Capacitor 8 | 4200 | 4002 |
| `apps/delivery` | Riders | Ionic 9 + Capacitor 8 | 4200 | 4003 |
| `apps/super-admin` | Thaliyo staff (Super Admin, Sales CRM) | no | 4300 | 4004 |
| `apps/staff` | Waiter, kitchen (KDS), cashier (POS) | Ionic/Capacitor later | 4500 | 4006 |
| `backend/` | API for every app | — | 4000 | — |

Restaurant-facing apps (customer app, restaurant websites) show the **restaurant's** theme (`templates/THEME.md`); Thaliyo's own UI uses the brand in `brand/`.

---

## Import Alias Map

Absolute `@` aliases everywhere; relative paths (`../`, `./`) are prohibited (Rule 1). Every app maps the same aliases in its `tsconfig.json` (paths relative to `src/`):

| Alias | Path |
|---|---|
| `@app/*` | `app/*` |
| `@shared/*` | `app/shared/*` — app-shell-level UI (modal host, toasts, confirm dialog) |
| `@pages/*` | `app/pages/*` — one routed screen per folder |
| `@components/*` | `app/components/*` — reusable components (forms, list widgets, empty states) |
| `@layout/*` | `app/layout/*` — the shell (sidebar/header/tabs + `<router-outlet>`) |
| `@services/*` | `services/*` |
| `@store/*` | `store/*` — route-scoped signal stores |
| `@appTypes/*` | `types/*` — every shared type (Rule 9) |
| `@constants/*` | `constants/*` — every hard-coded value and UI copy (Rule 21) |
| `@utils/*` | `utils/*` |
| `@guards/*` | `guards/*` |
| `@interceptors/*` | `interceptors/*` |
| `@directives/*` | `directives/*` |
| `@pipes/*` | `pipes/*` |
| `@environments/*` | `environments/*` |
| `@testing/*` | `utils/testing/*` — test doubles, **`.spec.ts` only**, excluded from `tsconfig.app.json` |

---

## Folder Structure

```
src/
  app/
    layout/                      the shell
    shared/<component>/          app-shell-level UI
    components/<component>/      reusable components
    pages/<screen>/              one routed screen per folder (login, dashboard, …)
    app.ts  app.html  app.css  app.config.ts  app.config.server.ts  app.routes.ts  app.routes.server.ts
  services/<name>/<name>.service.ts   + .spec.ts
  utils/<name>/<name>.util.ts         + .spec.ts
  guards/  interceptors/  directives/  pipes/
  types/  constants/  store/  environments/
  utils/testing/                 test doubles, spec-only
  main.ts  main.server.ts  server.ts  index.html  styles.css
public/                          static files, served from the site root (brand/, icons, favicon)
e2e/                             Playwright specs + fixtures
```

- Angular 20+ file naming: `login.ts` / `login.html` / `login.css` / `login.spec.ts`, class `Login` — no `.component` / `.page` suffix.
- **One folder per component, service and util**, holding its files and its `.spec.ts` (Rule 20).
- **Constants grouping:** a screen's copy, labels and columns live in one grouped object in `constants/<screen>.constants.ts` (e.g. `MENU_PAGE`, `STAFF_INVITE_MODAL`), with member names dropping the object's own prefix. Keep a name as a standalone export only when another file imports it too. Builder/formatter functions stay loose.

## Routing

- Every route entry is `loadComponent`/`loadChildren`, the layout shell included. Adding a static component import to `app.routes.ts` puts it back in the initial bundle — don't.
- Public routes (`/login`, `/forgot-password`, `/welcome`) stand alone; every signed-in screen is a child of the layout route, so the guard on the parent covers them all.
- Navigation uses `<a [routerLink]>` with `routerLinkActive` and `ariaCurrentWhenActive="page"`. Don't navigate from a `(click)` handler. Sidebar/tab links are built from one constant (e.g. `NAV_ITEMS` in `@constants/navigation.constants`), so a renamed path is renamed in one place.
- `app.routes.server.ts` sets render modes per route (Rule 16).

---

## Known Debt

Tracked, accepted, and **not** a licence to write new code the same way. Log any deliberate shortcut here.

- `apps/business-panel`: Prettier formats `.html`, `.css` and `.json` only (`npm run format`). It is not run on `.ts`, because it would wrap Rule 2's single-line imports; TypeScript style is checked by ESLint.
- `apps/customer`, `apps/delivery`: data calls are stubs (`// TODO(Phase 5/8)`) until their Supabase tables are wired.
- `apps/delivery`: initial bundle is 830 kB (warning budget 500 kB) because supabase-js is eager through the root guard and interceptor; fix by loading AuthService/Supabase lazily (`injectAsync`).
