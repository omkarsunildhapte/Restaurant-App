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
├── templates/         Websites FOR restaurants (modern-cafe, then 9 more), Phase 8. Not the platform's own site
├── docs/              Roadmap, required changes, go-to-market, this file
├── package.json       (restaurant-app-ea) Root scripts only (install:all, build:all, dev:*, db:*); no shared node_modules
└── .nvmrc             Node version for every app
```

Rules:
- One app per folder under `apps/`. Each keeps its own `package.json` and `node_modules`.
- Nothing app-specific at the repo root. New apps go under `apps/`, new services under `backend/`.
- One work stream owns each folder. Before writing to a folder you don't own, ask its owner.

## Current state (2026-10-10, 02:35)

| Folder | What it is | Owner | Status |
|---|---|---|---|
| `apps/business-panel` | Business (owner) panel, being upgraded to Angular 22, PrimeNG removed (Tailwind only) | restaurant-app-ea (Phase 0) | Moved from `Admin/`, renamed from `apps/web-console` on 2026-10-10 (staged). Upgrade in progress: keep out until ea reports done |
| `apps/customer` | Users app, being upgraded to Ionic 9 / Capacitor 8 | restaurant-app-ea | Moved from `users/` (staged). Upgrade in progress |
| `apps/delivery` | Rider app, being upgraded to Ionic 9 / Capacitor 8 | restaurant-app-ea | Moved from `deilvey/` (staged). Upgrade in progress |
| `apps/super-admin` | Super Admin panel + Sales CRM, Angular 22, port 4300. Calls `backend/marketing` | restaurant-app-ef | Moved from root `console/` on the user's instruction |
| `apps/marketing-site` | The platform's marketing website for restaurant owners: home, features, pricing, demo, about, contact, legal drafts. Static, no-dependency Node build, port 4400, Cloudflare | restaurant-app-ef | New. Separate from `templates/` (those are restaurants' own sites) |
| `apps/staff` | POS, KDS, waiter app. Angular 22 (SSR, zoneless, Tailwind v4, Vitest, Supabase Auth); dev port 4500, SSR server 4006 | restaurant-app-ef | Handed over from ea at the user's request (2026-10-10) |
| `backend/` (`src/`, root files) | API base | restaurant-app-ea | New |
| `backend/src/` (controller, dao, service, router, middleware, config) | Restaurant platform API, layered: router → controller → service → dao. Admin routes (`router/admin/*`: tenants, plans, dashboard) and business routes (`router/business/*`: members, invitations, geocode) | restaurant-app-0f (routes), restaurant-app-ea (base) | Restructured 2026-10-10 (replaces `src/platform/`). Theme routes planned for Phase 8: `PUT /platform/v1/tenants/:id/theme`, public `GET /public/v1/restaurants/:slug/theme` |
| `backend/marketing/` | Marketing API (Python) | restaurant-app-ef | New. Don't edit without ef |
| `supabase/` | Phase 1 schema, RLS, roles, seed | restaurant-app-0f | New |
| `brand/` | Thaliyo brand assets, generated from `brand/source/thaliyo-logo-original.png` by `source/build-assets.mjs`; see `brand/README.md`. Brand colours are for Thaliyo's own UI only, **not** a restaurant theme default | restaurant-app-ea | New. Shared read-only: copy files into your app's assets, don't edit them in place |
| `templates/` | Modern Café template, data-driven build. **`templates/THEME.md` + `theme.mjs`: the one theme format shared by restaurant websites, the customer app and the database** | restaurant-app-53 | New. Change theme keys only after telling ea and 0f |
| `docs/` | Planning docs | shared: edit only your own sections. `DELIVERY.md` + Phase 5 sections: restaurant-app-74. `REPO-LAYOUT.md`: restaurant-app-53. Phase 0 ticks: restaurant-app-ea | New |

## Open decisions

- [x] Renamed `apps/web-console` to `apps/business-panel` (2026-10-10, mid-upgrade at the user's request). Root `package.json` scripts updated.
- [ ] `backend/marketing` (Python, ef): keep it inside `backend/`, or make it its own service?
- [ ] Commit the staged `Admin/ users/ deilvey/ → apps/` renames as one commit, before other work is committed on top of them.
