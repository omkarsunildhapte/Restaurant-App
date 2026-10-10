# Restaurant Platform Roadmap

All-in-one restaurant and café system: own website, own apps, own delivery, POS and kitchen, for many restaurants on one platform (B2B), with a consumer marketplace later (B2C).

- **Owner:** Vernoka Software Technology
- **Repo:** `D:\Restaurant-App` (`Admin/`, `users/`, `deilvey/`, `templates/`)
- **Last updated:** 2026-10-10
- **Related docs:** [GO-TO-MARKET.md](GO-TO-MARKET.md) (where and how to sell) · [REQUIRED-CHANGES.md](REQUIRED-CHANGES.md) (code changes checklist) · [PROBLEMS-AND-SOLUTIONS.md](PROBLEMS-AND-SOLUTIONS.md) (normal website problems vs our solution) · [DELIVERY.md](DELIVERY.md) (Phase 5 delivery design)

---

## Current status

Build order: **business ecosystem first, customer side last.** Until the customer phase, restaurants only meet the platform through the **marketing website** and **onboarding**; their own customers keep ordering the way they do today (walk-in, phone, aggregators).

| Phase | Name | Weeks | Status | Progress |
|---|---|---|---|---|
| 0 | Setup and upgrade | 1 | In progress | ~60% |
| 1 | Backend, Super Admin and Business panel | 2–4 | In progress | 85% |
| 2 | Marketing website, restaurant onboarding and Sales CRM | 5–7 | In progress | ~50% |
| 3 | Restaurant operations: POS, KDS, Waiter | 8–11 | Not started | 0% |
| 4 | Pilot and launch (dine-in) | 12–14 | Not started | 0% |
| 5a | Delivery: own riders (built first) | 15–17 | Not started | 0% |
| 5b | Delivery: third-party partners | 18–19 | Not started | 0% |
| 6 | Business growth features | 20–23 | Not started | 0% |
| 7 | Corporate cafeteria mode | 24–28 | On hold (contract check) | 0% |
| 8 | Customer side: templates, websites, QR ordering, customer app, payments | 29–33 | In progress (template engine started early) | 10% |
| 9 | B2C marketplace and ONDC | 34+ | Not started | 0% |

Status values: `Not started` · `In progress` · `Blocked` · `Done` · `On hold`

---

## Roles

| Level | Who | Uses |
|---|---|---|
| Super Admin | Vernoka (platform owner) | Super Admin panel |
| Admin | Restaurant brand HQ, or corporate facility team | Business panel |
| Owner | Restaurant owner, or cafeteria vendor | Business panel |
| Staff | Manager, cashier, waiter, kitchen | Business panel, POS, Waiter app, KDS |
| Delivery Person | Restaurant's own rider, or platform rider | Delivery app |
| Customer | Diner, or office employee | Customer app, website, QR menu |

Every record (menu item, table, order, bill, staff member) belongs to a **tenant → outlet**, so one business never sees another's data.

---

## Platforms (8) and codebases (4 + backend)

| # | Platform | Users | Type | Device | Codebase |
|---|---|---|---|---|---|
| 1 | Super Admin panel (incl. Sales CRM) | Vernoka | Web app | Laptop | A. Web console |
| 2 | Business panel (Admin, Owner, Manager) | Business side | Web app | Laptop, tablet | A. Web console |
| 3 | POS (billing) | Cashier | Installable web app, offline, printer | PC, tablet, Android POS | B. Staff app |
| 4 | KDS (kitchen display) | Kitchen | Web app, full screen | Tablet or TV | B. Staff app |
| 5 | Waiter / captain app | Waiters | Mobile app | Android phone | B. Staff app |
| 6 | Customer app | Diners, employees | Mobile app | Android + iPhone | C. Customer app |
| 7 | Customer website and QR menu | Diners | Website | Phone browser | C. Customer app |
| 8 | Delivery app | Delivery person | Mobile app | Android phone | D. Delivery app |
| — | Self-order kiosk (later) | Office employees | Web app, kiosk mode | Touch tablet | B. Staff app |
| — | Platform marketing website + onboarding | Restaurant owners | Website | Any | A. Web console (public pages) |

| Codebase | Tech | Published as | Built from |
|---|---|---|---|
| A. Web console | Angular 22 | `admin.<domain>`, `app.<domain>` | `Admin/` |
| B. Staff app | Angular 22 + Ionic + Capacitor | Installable web app + Play Store | New |
| C. Customer app | Angular 22 + Ionic + Capacitor | Play Store, App Store, `<cafe>.<domain>` | `users/` |
| D. Delivery app | Ionic + Capacitor | Play Store | `deilvey/` |
| Backend | Postgres (Supabase) + Node API; Firebase for push only | `api.<domain>` | New |

---

## Templates (restaurant branding)

Every restaurant's **website, QR menu and customer app** use a template. The platform ships **10 default templates**; each restaurant can customise one, or order its own custom template.

### How it works
Built in **Phase 8** (customer side), after the business ecosystem.
- **Template** = layout + section order + typography + component style (menu cards, hero, booking block). Built once by Vernoka, shared by all restaurants.
- **Theme settings** (per restaurant, edited in the Business panel without code): logo, brand colours, fonts, hero photos, section on/off and order, menu card style, social links, opening hours.
- **Live preview** in the Business panel before publishing; switching template keeps the restaurant's menu, photos and settings.
- The customer app reads the same template and theme, so website, QR menu and app always match.
- **Custom template** (paid): a one-off design for one restaurant, built on the same engine so it still gets platform updates.

### 10 default templates
| # | Template | Best for | Look |
|---|---|---|---|
| 1 | Classic Bistro | Family restaurants, multi-cuisine | Warm, photo-led, full menu with categories |
| 2 | Modern Café | Coffee shops, bakeries | Light, minimal, big product photos. **Starting point exists:** `templates/modern-cafe` (Brew & Leaf demo) |
| 3 | Street Food | QSR, chaat, rolls, momos | Bold colours, fast "order now" flow |
| 4 | Fine Dine | Premium restaurants | Dark, elegant serif, reservations first |
| 5 | Cloud Kitchen | Delivery-only brands | Menu-first, combos and offers up front |
| 6 | Dhaba / Desi | North Indian, thali, dhabas | Earthy, regional typography, thali highlights |
| 7 | South Indian / Tiffin | Udupi, tiffin centres, mess | Clean, fast scan, breakfast/lunch timing blocks |
| 8 | Pizza & Burger | Fast food, pizzerias | Builder-style menu (sizes, toppings, add-ons) |
| 9 | Bar & Lounge | Pubs, lounges, rooftops | Night theme, events and table booking first |
| 10 | Cafeteria / Canteen | Office canteens, college mess, food courts | Counter-wise menu, daily menu, quick pickup |

### Template sources in this repo
| Folder | Template | State |
|---|---|---|
| `templates/modern-cafe` | Modern Café | Brew & Leaf demo, moved here from `vernoka-software-technology/cafe-website` on 2026-10-10. Static HTML/CSS/JS (Home, Menu, About, Contact, Book), live demo at https://brew-and-leaf-demo.dhapteomkar38.workers.dev (Cloudflare Worker `brew-and-leaf-demo`; deploy with `npx wrangler deploy` from this folder). Now data-driven: `restaurant.json` + `node build.mjs` (theme colours/fonts/logo, home sections, ₹ menu with veg/egg/non-veg marks). See its README. |

### Pricing (from Phase 8)
| Option | Price |
|---|---|
| Any of the 10 templates + theme customisation | Included with online ordering |
| Template setup done by Vernoka (photos, colours, sections) | Part of the setup fee |
| Custom template for one restaurant | ₹15,000–40,000 one-time (planned) |

---

## What exists today (audit, 2026-10-10)

- **Admin (Angular 17, Firebase):** login/register, dashboard, foods, beverages, combo maker, orders, tables. Chats page is empty.
- **Customer app (Ionic 7, Capacitor 6, Android):** phone OTP sign-up, location, menu, cart, confirm order, tracking, reviews, table booking, account, history.
- **Delivery app (Ionic 7, Capacitor 6, Android):** rider sign-up with personal, document, vehicle and bank details; orders; account; Google Maps tracking.
- **Gaps:** no payments; single restaurant only (no restaurant id, no roles); no waiter, kitchen or billing; Firestore rules in the repo deny all reads and writes; framework versions are two years old.
- **Secrets check:** no private keys, service accounts or `.env` files committed.

---

## Phases

### Phase 0: Setup and upgrade (week 1)
- [x] Product name: **Thaliyo** (logo in [`brand/`](../brand/)). Domain: free subdomains for now (`*.pages.dev`, `*.supabase.co`); `thaliyo.com` was available on 2026-10-10, buy it when paid hosting starts
- [x] Upgrade to Angular 22, Ionic 9, Capacitor 8: `apps/business-panel`, `apps/customer`, `apps/delivery` on Angular 22.2 with SSR (web) + static mobile build, zoneless, Tailwind 4, Vitest; no CommonModule, zone.js, platform-browser-dynamic, Karma/Jasmine or PrimeNG
- [x] One repo layout for codebases A–D plus backend: `apps/`, `backend/`, `supabase/`, `templates/`, `docs/` (see [REPO-LAYOUT.md](REPO-LAYOUT.md))
- [ ] Dev, staging and production environments (dev works locally; staging/production configs exist with placeholders until the Supabase projects and domain exist)
- [ ] Create Postgres (Supabase) project (local stack runs; staging and production cloud projects not created yet)
- [x] Firebase limited to push notifications (FCM); login and data move to Supabase
- [x] Geocoding through the backend with OpenStreetMap Nominatim (`/geocode`), not Google

**Done when:** all apps build and run locally and the base deploys.

### Phase 1: Backend, Super Admin and Business panel (weeks 2–4)
- [x] Database: tenants, outlets, users, roles, menu, categories, tables, orders, bills, taxes (`supabase/migrations` 0001–0004)
- [ ] Login for all roles; role-based screens *(one Supabase login for every app; Super Admin screens done; Business panel role-based screens built, waiting to be wired into the app and browser-tested)*
- [x] Tenant data isolation enforced in the database (RLS + composite foreign keys; 31 pgTAP tests in `supabase/tests`)
- [x] Super Admin: create tenants, plans, 14-day trial, feature switches, platform dashboard (`apps/super-admin` → Platform)
- [ ] Business panel: outlets, menu and categories, combos, tables, staff invites, GST settings, basic reports *(all screens built in `apps/business-panel/src/app/business`; wiring the `/business` route and browser tests pending)*

**Done when:** a café can be created and its owner can set up menu, tables and staff.

### Phase 2: Marketing website, restaurant onboarding and Sales CRM (weeks 5–7)
Customer-facing work in this phase is limited to the marketing website and onboarding; the Sales CRM is internal.
- [ ] **Marketing website** for the platform (normal company site, aimed at restaurant owners): home, features, pricing, demo request, contact, privacy, terms, refund policy *(pages built in `apps/marketing-site`; not deployed yet, needs product name, domain and legal review)*
- [x] Demo booking / "Start free trial" form that creates a lead in Super Admin
- [ ] **Restaurant onboarding:** self sign-up → verify phone/email → business details (name, GSTIN, FSSAI number, address) → first outlet → 14-day trial starts
- [ ] Setup wizard in the Business panel: menu upload (manual or CSV), tables, taxes, staff invites, printer setup checklist *(built; wiring and browser test pending with the Business panel)*
- [x] Assisted onboarding from Super Admin (Vernoka creates and sets up a restaurant on the owner's behalf): Platform → New restaurant, or Sales CRM → convert lead
- [ ] Welcome email/WhatsApp with login links for owner and staff

**Sales CRM (in the Super Admin panel, separate from vernoka-admin)**

Built for selling the platform to restaurants, so a lead becomes a trial, then an onboarded and paying restaurant, in the same system.
- [x] **Leads:** restaurant name, type (café, family restaurant, QSR, cloud kitchen, chain), area/city, owner name, phone, WhatsApp, Google Maps link, seats, outlets
- [x] **Qualifying fields:** current billing system (paper, Petpooja, other), on Zomato/Swiggy (yes/no), estimated monthly aggregator orders, has website, has own delivery riders
- [x] **Pipeline:** New → Contacted → Visit/demo booked → Demo done → Trial → Onboarding → Paying → Lost (with reason)
- [x] **Lead sources:** website form, walk-in visit, dealer/partner, referral, Instagram, Google Ads, expo; marketing-site leads arrive automatically
- [x] **Activities:** call, visit, WhatsApp, demo notes; next follow-up date with reminders; today's follow-up list
- [x] **Area view:** leads grouped by area for planning visit routes (Baner, Koregaon Park, Viman Nagar and so on)
- [x] **Lead import:** CSV upload of restaurant lists (e.g. from Google Maps research)
- [x] **WhatsApp templates:** intro message, demo reminder, trial check-in, payment reminder
- [x] **Convert to restaurant:** one click turns a won lead into a tenant with trial started, using the details already collected
- [ ] **Dealers and partners:** *(dealer list, their leads and estimated commission done; dealer logins not yet)* dealer accounts with their own lead list, deals they brought in, and recurring commission (e.g. 20%) owed each month
- [ ] **Sales team:** *(team, roles, assignment and per-person results done; targets not yet)* assign leads to salespeople; per-person targets and results
- [ ] **Reports:** *(done except MRR and churn are estimated until real billing, Phase 4)* leads by source and area, conversion at each pipeline stage, trial-to-paid rate, monthly recurring revenue, churn

**Done when:** a restaurant owner finds the site, signs up, and finishes setup without help (or Vernoka does it in under an hour), and every lead, from any source, is tracked from first contact to payment in the Sales CRM.

### Phase 3: Restaurant operations (weeks 8–11)
- [ ] Waiter app: pick table → add items → send KOT
- [ ] KDS: live orders with sound → preparing → ready → served
- [ ] POS: dine-in, takeaway and phone/delivery bills; GST invoice; discounts; split bill
- [ ] Thermal printer (58/80 mm) and cash drawer
- [ ] Cash, UPI (static QR) and card payments recorded at the counter; day open and close; cash reconciliation
- [ ] Offline POS with sync

**Done when:** a real café runs a full dine-in service (order → kitchen → bill) on the system.

### Phase 4: Pilot and launch, dine-in (weeks 12–14)
- [ ] Free 1-month pilot with 2–3 cafés in Pune
- [ ] On-site setup, printer setup, staff training
- [ ] Fix real-world issues (speed, offline, printing)
- [ ] Subscription billing live in Super Admin
- [ ] Sales kit: demo café account, brochure, pitch message

**Done when:** 2 cafés agree to pay. This is the go/no-go point.

### Phase 5: Delivery, own riders first, then third-party (weeks 15–19)
Delivery orders come in through the POS (phone and walk-in orders) until the customer side exists. **Own delivery is built first** as a simple, complete flow (5a). Third-party partners (5b) are added on top only after own delivery runs at a pilot café. Full design: [DELIVERY.md](DELIVERY.md).

**5a. Own riders (weeks 15–17)**
- [ ] Owner/cashier assigns delivery orders to the restaurant's own riders
- [ ] Rider app: online/offline, accept/reject, pickup → on the way → delivered
- [ ] Proof of delivery by OTP or photo
- [ ] Live location for the owner
- [ ] Cash-on-delivery settlement; rider earnings screen
- [ ] Super Admin rider verification
- [ ] Own-rider reports: deliveries per rider, delivery time, failed deliveries, saved vs aggregator commission

**5a done when:** a café delivers all its phone orders with its own riders, from assign to cash settled, for one week without paper.

**5b. Third-party delivery partners (weeks 18–19, after 5a works)**
- [ ] One delivery-partner layer in the backend, so each partner is a plug-in (book, cancel, track, status updates)
- [ ] Shortlist and sign up partners; confirm API access and commercial terms for each (candidates: Porter, Shadowfax, Borzo, ONDC logistics via a provider such as Shiprocket, or an aggregator such as Pobo that connects several carriers). Partner availability changes, so verify before building.
- [ ] Price quotes and ETA from available partners shown to the cashier before booking
- [ ] Book a rider in one tap; partner status (assigned → picked up → delivered / cancelled) updates the order automatically
- [ ] Live partner-rider tracking link on the order
- [ ] Delivery charge per order recorded; monthly partner cost report
- [ ] Partner account per restaurant (restaurant's own account) or through the platform's account (cost billed to the restaurant)

**Choosing own vs third-party (5b)**
- [ ] Rules per outlet: own rider first, third-party when no own rider is free, or always third-party beyond a set distance
- [ ] Fallback: if the partner cancels, re-offer to own riders or another partner
- [ ] Owner report comparing own-rider cost vs partner cost vs aggregator commission

**5b done when:** the same café books a third-party rider in one tap when its own riders are busy.

### Phase 6: Business growth features (weeks 20–23)
- [ ] Inventory: stock deducted per dish, low-stock alerts
- [ ] Multi-outlet chains: central menu, per-outlet reports
- [ ] Owner analytics: best sellers, peak hours, staff performance
- [ ] Staff attendance and shifts
- [ ] Expense and purchase entries; daily profit view

### Phase 7: Corporate cafeteria mode (weeks 24–28)
> **On hold:** check the DeskDyne / Yagy Tech agreement for non-compete, confidentiality and code-ownership clauses first. Do not reuse DeskDyne code.
- [ ] Company tenant → cafeterias → vendors/counters
- [ ] Employee login with company email
- [ ] Company subsidy, employee wallet, payroll deduction
- [ ] Order from desk → queue-free pickup; desk delivery runners
- [ ] Self-order kiosk
- [ ] HR reports, vendor payouts, feedback, wastage tracking

### Phase 8: Customer side (weeks 29–33)
Built last, once the ecosystem is stable and restaurants are paying.
- [ ] Template engine: templates + per-restaurant theme settings (logo, colours, fonts, photos, sections)
- [ ] Theme editor with live preview in the Business panel
- [ ] 10 default templates (start from `templates/modern-cafe`), plus custom templates as a paid add-on
- [ ] Each restaurant's own website: menu, online ordering, table booking
- [ ] Table QR ordering in the browser, straight to KDS and POS
- [ ] Online payments: Razorpay/UPI; pay at counter; cash on delivery
- [ ] Customer order tracking (including live delivery location); WhatsApp/SMS updates
- [ ] Customer app on Android and iOS (from `users/`)
- [ ] Loyalty points, coupons and customer database (CRM)

**Done when:** a restaurant's customers can scan or open its site, order and pay, and the order reaches the kitchen, POS and delivery app.

### Phase 9: B2C marketplace and ONDC (week 34+)
- [ ] Consumer app listing all partner restaurants in a city (small per-order fee)
- [ ] Platform rider pool: nearest rider, auto-assignment, weekly payouts
- [ ] ONDC seller connection (orders from Paytm, PhonePe and other buyer apps)

---

## Pricing (planned)

**At launch (Phases 1–7, business ecosystem only):**

| Plan | Includes | Price |
|---|---|---|
| Setup (one-time) | Onboarding, menu upload, printer setup, staff training | ₹10,000–15,000 |
| Starter | Owner panel + POS billing + KDS | ₹1,499/month |
| Pro | Starter + waiter app + own delivery app + inventory and analytics | ₹2,999/month |
| Chain | Multiple outlets, central menu and reports | ₹4,999+/month per brand |

**After Phase 8 (customer side) adds:**

| Add-on | Includes | Price |
|---|---|---|
| Online ordering | Own website from a template, QR table ordering, online payments | +₹1,000/month, or included in Pro |
| Branded customer app | Restaurant's own app on Play Store / App Store | One-time + yearly store fees |
| Custom template | One-off design for a single restaurant | ₹15,000–40,000 one-time |
| Commission | 0% on every order | — |

Benchmarks: Petpooja about ₹15,000–30,000/year per outlet; custom single-restaurant app ₹2.5–5 lakh; Zomato/Swiggy take 25–35% of each order.

---

## Decisions

| Date | Decision | Notes |
|---|---|---|
| 2026-10-10 | Restaurant mode first; corporate cafeteria mode later | Corporate mode waits on the DeskDyne agreement check |
| 2026-10-10 | Move data to Postgres (Supabase) | Better for POS, GST reports, subsidies and tenant isolation; Firebase kept for push |
| 2026-10-10 | 6 roles: Super Admin, Admin, Owner, Staff, Delivery Person, Customer | Delivery Person is its own role and app |
| 2026-10-10 | 8 platforms from 4 codebases + backend | See the platforms table |
| 2026-10-10 | Each restaurant gets its own template; 10 default templates | Built in Phase 8; custom templates are a paid add-on |
| 2026-10-10 | Separate Sales CRM inside the Super Admin panel (not vernoka-admin) | Leads, pipeline, follow-ups, dealer commissions, one-click convert to a trial restaurant; Phase 2 |
| 2026-10-10 | Own delivery built first (5a); third-party partners added after (5b) | Partners only start once own delivery works at a pilot café |
| 2026-10-10 | Delivery supports own riders and third-party partners | Partners plug into one backend layer; per-outlet rules and fallback; partner list to be verified |
| 2026-10-10 | Business ecosystem first, customer side last | Early phases only add the platform marketing website and restaurant onboarding; customer ordering, websites, QR and the customer app move to Phase 8 |

## Open questions

- [x] Product name and domain: Thaliyo; free subdomains until paid hosting
- [ ] DeskDyne / Yagy Tech agreement: any non-compete or IP clause?
- [ ] Verify the FSSAI e-commerce licence requirement for restaurants selling through their own app
- [ ] Which Firebase project and rules are live today?

---

## Update log

Add newest entries at the top. One entry per working session.

### 2026-10-10 (Business panel: coding standard)
- Done: `apps/business-panel` follows `.agents/rules` outside `src/app/business`: `@` aliases only, the AGENTS.md folder layout (`pages/`, `shared/`, `components/`, `services/`, `constants/`, `types/`, `utils/`), Angular 20+ file names, separate .ts/.html/.css/.spec.ts per component, Signal Forms for login and register, OnPush everywhere, lazy routes, SSR kept. ESLint (flat config, angular-eslint, template accessibility), Prettier, Vitest specs for every component/service/util, Playwright e2e with Supabase and the API stubbed (login, guard redirect, every panel screen).
- Done: deleted the legacy `/main` screens, `src/app/service/*` stubs and the Firebase Hosting/Firestore files.

### 2026-10-10 (Phase 1: backend, Super Admin, Business panel)
- Done: Supabase schema with tenant → outlet, 7 business roles + Super Admin, menu (categories, variants, add-ons, combos, GST rates), tables, orders, bills; isolation by RLS and composite foreign keys, 31 pgTAP tests. Node API in `backend/` restructured to the meal-sehat layout (`config/routes` by audience, router → controller → service → dao, `test/` mirrors `src/`), 50 tests passing. Super Admin Platform screens (overview, restaurants, plans) live in `apps/super-admin` on the shared Supabase login.
- In progress: Business panel screens (dashboard, menu, tables, staff and invites, outlets, settings, setup wizard, invite welcome page) built in `apps/business-panel/src/app/business`; waiting for the Angular 22 upgrade to finish before wiring `/business` and testing in the browser.
- Next: wire and test the Business panel; then Phase 3 tables for the staff app (table status, KOTs, split payments, day open/close, yearly bill numbers).

### 2026-10-10 (Marketing website)
- Done: `apps/marketing-site`, static site with no dependencies: home, features, pricing, book a demo, about, contact, privacy/terms/refund (drafts), 404. The demo form posts to the marketing API and creates a CRM lead (tested end to end). Features are marked "At launch" or "Coming next" so the site doesn't promise what isn't built.
- Also: moved the Sales CRM app from root `console/` to `apps/super-admin`.
- Next: product name and domain, deploy to Cloudflare, legal review, real contact details.

### 2026-10-10 (Phase 0)
- Done: moved `Admin/`, `users/`, `deilvey/` to `apps/business-panel`, `apps/customer`, `apps/delivery` (git mv, history kept); `apps/staff` placeholder; `backend/` Node API (Express 5, TypeScript 6.0, port 4000) with `/health`, `/platform` and `/geocode` (Nominatim: 1 request/second, cached, signed-in users only); root `package.json` scripts and `.nvmrc` (Node 24); local Supabase stack.
- Decisions: Ionic 9 + Capacitor 8 (newer than first planned); PrimeNG removed, Tailwind only; Firebase for push notifications only; geocoding via Nominatim through the backend; device location via `@capacitor/geolocation`; Super Admin (`apps/super-admin`) and Business panel (`apps/business-panel`) are separate apps.
- Done: Angular 17 → 22 upgrade of business-panel, customer and delivery (SSR, zoneless, Tailwind 4, Vitest); Firestore and Firebase Auth replaced by Supabase Auth; data calls stubbed until their Supabase tables are wired.
- Not done: product name and domain; staging and production Supabase projects and deploys.
- Note: Node 25 is not supported by Angular 22; use Node 24 LTS.

### 2026-10-10 (Sales CRM)
- Done: Sales CRM, built by copying vernoka-admin's stack. `backend/marketing` (Python FastAPI, Postgres schema `crm`): leads with qualifying fields, 8-stage pipeline with stage history, activities and follow-ups, CSV import with duplicate check, areas, dealers with commission, sales team with admin/sales roles, reports, and a public demo-request endpoint for the marketing website. `apps/super-admin` (Angular 22): dashboard, pipeline board and list, lead detail with WhatsApp templates, follow-ups, areas, import, dealers, team. 34 API checks pass against a test database.
- Decision: backend split by language. Python for marketing (`backend/marketing`), Node for the restaurant system (`backend/src`).
- Not done: convert lead to restaurant (needs Super Admin login on Supabase tokens, then `POST /platform/v1/tenants`), dealer logins, sales targets, marketing website pages, onboarding wizard.
- Next: point `backend/marketing` at the real database; build the marketing website and wire its form to `/api/v1/public/demo-requests`.

### 2026-10-10
- Started Phase 8 early (no backend needed): `templates/modern-cafe` became the first data-driven template. One JSON per restaurant, zero-dependency build, theme settings, Indian menu marks. Second sample in `templates/modern-cafe/examples/`.
- Split Phase 5: own-rider delivery first (5a, weeks 15–17), third-party partners after (5b, weeks 18–19). Later phases unchanged.
- Added [DELIVERY.md](DELIVERY.md): Phase 5 design (job statuses, data model, own-vs-partner dispatch and fallback, partner adapter layer, partner shortlist checked against public info, rider app changes, COD, build order).
- Added [GO-TO-MARKET.md](GO-TO-MARKET.md) and [REQUIRED-CHANGES.md](REQUIRED-CHANGES.md); linked all docs from the top of this file.
- Added a dedicated Sales CRM to the Super Admin panel (Phase 2, now weeks 5–7; later phases shifted by 1 week).
- Delivery now covers own riders and third-party partners (Phase 5, extended to weeks 15–19; later phases shifted by 2 weeks).
- Added [PROBLEMS-AND-SOLUTIONS.md](PROBLEMS-AND-SOLUTIONS.md): 25 problems with a normal restaurant website, each mapped to our solution and phase.
- Reordered phases: ecosystem first (backend, panels, onboarding, POS/KDS/waiter, delivery), customer side last (Phase 8). Added Phase 2: marketing website + restaurant onboarding. Pilot is now dine-in only.
- Moved the Brew & Leaf café demo into `templates/modern-cafe` as the base of the Modern Café template; added a root `.gitignore` (template build output and videos stay out of git).
- Added templates: each restaurant picks one of 10 default templates and customises it; custom templates as a paid add-on. Scheduled in Phases 3 and 6.
- Created this roadmap from the planning discussion.
- Audited the existing repo: three apps (Admin, users, deilvey), Angular 17 / Ionic 7, Firebase, single restaurant, no payments.
- Market check done: demand is real (aggregator commissions 25–35%, restaurant software market growing about 23% a year); strong competitors Petpooja, DotPe, Thrive, ONDC.
- Next: Phase 0 (upgrade and setup).

<!--
Template for new entries:

### YYYY-MM-DD
- Done:
- In progress:
- Blocked:
- Next:
-->
