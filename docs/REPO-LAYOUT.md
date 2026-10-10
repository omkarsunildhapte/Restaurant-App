# Repo layout

Where each part of the platform lives, and which folder each work stream owns.
Matches "Platforms (8) and codebases (4 + backend)" in [ROADMAP.md](ROADMAP.md).

- **Last updated:** 2026-10-10

---

## Target layout

```
Restaurant-App/
├── apps/
│   ├── super-admin/   Super Admin panel + Sales CRM (Vernoka staff)                      (from console/)
│   ├── marketing-site/ Platform's own website for restaurant owners (not a template)      (new, Phase 2)
│   ├── business-panel/ Business (owner) panel                                          (from Admin/)
│   ├── staff/         Codebase B: POS, KDS, waiter app                                   (new, Phase 3)
│   ├── customer/      Codebase C: customer app + QR ordering                             (from users/, Phase 8)
│   └── delivery/      Codebase D: rider app                                              (from deilvey/, Phase 5)
├── backend/           One Node API (Express) for every app: src/{router,controller,service,dao}, marketing/ = Python marketing API
├── supabase/          Postgres schema, RLS tenant isolation, roles, seed, DB tests
├── brand/            Thaliyo logo, emblem, favicons, app icons, brand colours (read-only source; apps copy what they need)
├── tools/            Local-only developer tools (not shipped): dograh/ = voice AI sandbox
├── templates/         Websites FOR restaurants (modern-cafe, then 9 more), Phase 8. Not the platform's own site
├── docs/              Roadmap, required changes, go-to-market, this file
├── package.json       (restaurant-app-ea) Root scripts only (install:all, build:all, dev:*, db:*); no shared node_modules
└── .nvmrc             Node version for every app
```

Rules:
- One app per folder under `apps/`. Each keeps its own `package.json` and `node_modules`.
- Nothing app-specific at the repo root. New apps go under `apps/`, new services under `backend/`.
- One work stream owns each folder. Before writing to a folder you don't own, ask its owner.

## Current state (2026-10-10, after the session restart)

Sessions restarted with new names; old names in brackets. Also owned by **2c**: `.agents/` (coding rules), `CLAUDE.md`, root `package.json` and `.nvmrc`.

**Branches:** work happens on `phase-0` (checkpoint `6657905`) and feature branches such as `ef/pilot-ready`. Nobody commits on `main`. A session's name can change on restart: ask the owner, don't guess from an old name.

| Folder | What it is | Owner | Status |
|---|---|---|---|
| `apps/business-panel` | Business (owner) panel, Angular 22 | **2c** (was ea): app shell, login, `services/auth` + Supabase client, shared UI, config, SSR. **6e** (was 0f): business screens (`src/app/pages`), layout/shell, `components/diet-mark`, and the services, store, guards, interceptors, types, constants and utils those screens use | Screens being rebuilt to the `.agents/` rules by 6e |
| `apps/customer` | Customer app + QR ordering, Ionic 9 / Capacitor 8 | **2c** | Theme mirror at `src/app/core/theme/theme.ts` (keep in sync with `templates/theme.mjs`) |
| `apps/delivery` | Rider app, Ionic 9 / Capacitor 8 | **51** (was 74), features: rider screens (`src/app/pages/*`, `src/app/components/*`) and data layer (`services/rider`, `orders`, `tracking`, `rider-workspace` + their types/constants). **2c**, foundation: `app.ts`, `app.config*`, `app.routes*` (51 adds routes after telling 2c), `main*.ts`, `server.ts`, `icons.ts`, `services/auth`/`supabase`/`location`/`geocode`, guards, interceptors, `angular.json`, `package.json`, `tsconfig*`, lint/format/Playwright config, environments, `public/brand` | Split agreed by 2c and 51, 2026-10-10 |
| `apps/super-admin` | Super Admin panel + Sales CRM, port 4300 | **c7** (was ef), except `pages/platform/**` and `core/platform/**`: **6e** | Committed on branch `ef/pilot-ready` |
| `apps/marketing-site` | Thaliyo's own marketing website for restaurant owners, port 4400 | **c7** | Separate from `templates/` |
| `apps/staff` | POS, KDS, waiter app; dev 4500, SSR 4006 | **c7** | Split bill / ESC/POS / Hindi-Marathi work by 51, coordinated with c7 |
| `backend/src/` (router, controller, service, dao) | Restaurant platform API (admin + business routes) | **6e** | Theme routes planned for Phase 8 |
| `backend/` base (`src/config`, `app.ts`/`server.ts`, geocode) | Express app setup | **2c** | |
| `backend/marketing/` | Marketing API (Python) | **c7** | |
| `supabase/` | Schema, RLS, roles, seed, pgTAP tests, migrations | **6e** (was 0f); migrations 0005, 0009 and 0013 with `delivery.test.sql` and `split_bills.test.sql`: **51** | 0013 (outlet pickup lat/lng in `my_deliveries()`) approved by 6e on condition of a pgTAP test, all tests passing, `migration up --local` without a reset, and types regenerated only in `apps/delivery` |
| `brand/` | Thaliyo brand assets (logo, icons, colours) | **2c**; shared read-only | Thaliyo colours are for Thaliyo's own UI, never a restaurant theme default |
| `templates/` | Restaurant website templates; **`THEME.md` + `theme.mjs` = the one theme format** for websites, the customer app and the database | **ec** (was 53) | Change theme keys only after telling the customer-app and `supabase/` owners |
| `tools/dograh/` | Dograh (open-source voice AI), Docker Compose, **local only**: bound to 127.0.0.1, no public tunnel, telemetry off. Ports: app 3010, API 8000, MinIO 9000/9001 (Postgres and Redis not published). Secrets in git-ignored `tools/dograh/.env`; see its README | **c7** | For trying voice agents; not part of the product |
| `docs/` | Planning docs | shared, edit only your own sections. `REPO-LAYOUT.md`: **ec**. `DELIVERY.md` + Phase 5: **51**. `PILOT-PLAN.md`, `pilot-kit/`: **c7** | |

## Open decisions

- [x] Renamed `apps/web-console` to `apps/business-panel` (2026-10-10, mid-upgrade at the user's request). Root `package.json` scripts updated.
- [ ] `backend/marketing` (Python, ef): keep it inside `backend/`, or make it its own service?
- [x] Folder moves committed on branch `phase-0` (checkpoint `6657905`).
