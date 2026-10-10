# Pilot Plan: Phases 0–4 to 100%

Everything left before the dine-in pilot (ROADMAP Phases 0–4), who does it, and in what order.
Owners are the Claude sessions in [REPO-LAYOUT.md](REPO-LAYOUT.md); **You** = the user (things software can't do).

- **Goal:** a real Pune café runs a full dine-in service (waiter → kitchen → bill) on the system, and 2 cafés agree to pay.
- **Created:** 2026-10-10 by restaurant-app-ef. Each owner ticks their own lines.

---

## Order of work

1. **Database for operations** (blocks everything in Phase 3): menu, tables, orders, KOTs, bills, payments, day close.
2. **Business panel** on Supabase (owner sets up menu, tables, staff): Phase 1's "done when".
3. **Staff app**: waiter → KDS → POS → printer → offline. This is the product the pilot uses.
4. **Onboarding + convert lead** (Phase 2) and **subscription billing** (Phase 4), in parallel with 3.
5. **Pilot kit**: demo café, brochure, training sheets, setup checklist.
6. **You:** cloud setup, name, cafés, on-site visits.

## Phase 0: Setup and upgrade

| Item | Owner | Status |
|---|---|---|
| Angular 22 in business-panel, customer, delivery | ea | In progress: delivery done (Angular 22.2 / Ionic 9 / Capacitor 8, all builds pass); business-panel on 22, final checks; customer on 22, Ionic 9 / Capacitor 8 next |
| Product name and domain | **You** | Done: **Thaliyo**; free subdomains for now (`*.pages.dev`, `*.supabase.co`), buy `thaliyo.com` when paid hosting starts |
| Supabase cloud projects (staging + production), Cloudflare account access | **You** (account creation is yours) | Open |
| Staging/production env configs filled in, deploy scripts for every app | ea (apps/backend), ef (super-admin, marketing) | After the cloud projects exist |

## Phase 1: Backend, Super Admin, Business panel

| Item | Owner | Status |
|---|---|---|
| Schema: tenants, outlets, users, roles, isolation (RLS) | 0f | Done |
| Schema: menu, categories, variants, add-ons, GST rates, tables, orders, bills, taxes | 0f | Done: migrations 0002–0004, 0010 (purchases, salaries, cash out) and 0012, with peers' 0005–0011; pgTAP 183/183 |
| One login for all roles (Supabase), role-based screens | ef (super-admin), 0f (business panel), ea (staff) | Super Admin done; business-panel and customer/delivery sign-in moved to Supabase Auth in the upgrade |
| Super Admin: tenants, plans, trial, feature switches, platform dashboard | 6e (was 0f) | Done: switches set per restaurant in Super Admin, followed by the staff app (c7) and enforced by the database (migration 0015: pos, kds, waiter_app, and delivery for riders; pgTAP 211/211); outlet limit enforced since 0001 |
| Business panel: outlets, menu, combos, tables, staff invites, GST settings, basic reports | 0f (screens in `src/app/pages/`); ea retired the old pages | Done and browser-tested (also orders, purchases, salaries, plan & billing, dashboard). Rebuild to the `.agents/` rules in progress (data layer done; screens being rebuilt) |

## Phase 2: Marketing site, onboarding, Sales CRM

| Item | Owner | Status |
|---|---|---|
| Sales CRM | ef | Done (dealer logins, targets later) |
| Marketing website | ef | Built with the Thaliyo brand; deploy to `*.pages.dev` waits on the Cloudflare account (**You**) |
| Convert won lead → restaurant (calls `POST /platform/v1/tenants`) | ef | Done: tested end to end (lead → tenant + owner invite → Trial + check-in) |
| Assisted onboarding from Super Admin | ef + 0f | Done: Super Admin lead → "Create restaurant" (tenant, outlet, trial, owner invite) → owner sets the password → Business panel setup wizard (business, menu, tables, team, printer); on-site steps in `docs/pilot-kit/setup-checklist.html` |
| ~~Self sign-up~~ → **Invite-only access** (user decision 2026-10-10: no register pages for Super Admin, admins or owners) | ef (site, Super Admin) + 0f (API, DB) + ea (Business panel) | Done: website has "Book a free demo" and "Sign in" only; Super Admin Team sends invites, `/welcome` sets the password, "Forgot password?" (ef, tested 20 checks); `/public/v1/signups` and the signup DB objects removed (0f, migration 0012); Business panel `/register` removed (ea). Owners are invited by "Create restaurant" on a won lead |
| Setup wizard in Business panel: menu CSV, tables, taxes, staff, printer checklist | 0f (user decision: same owner as the business screens) | Done: Your business, Your menu (spreadsheet or Import from Petpooja), Tables, Your team, Printer and devices |
| Welcome email / WhatsApp with login links | 0f (send) + ef (templates) | Invite emails are sent by Supabase (owner, staff, team). WhatsApp texts done (ef): owner welcome in Super Admin lead templates; owner and staff welcome in `docs/pilot-kit/sales-playbook.html` |

## Phase 3: Restaurant operations (staff app, `apps/staff`, owned by ef since 2026-10-10)

| Item | Owner | Status |
|---|---|---|
| Waiter app: table → items → send KOT | ef | Done (tested end to end) |
| KDS: live orders with sound, preparing → ready → served (Supabase Realtime) | ef | Done (tested end to end) |
| POS: dine-in, takeaway, phone bills; GST invoice; discounts; split bill | ef | Done, incl. item-wise split (By items, split a line, pay the rest; 0009, by 74) |
| Thermal printer 58/80 mm + cash drawer (ESC/POS) | ef | Done: direct ESC/POS over USB (WebUSB) and serial/Bluetooth (Web Serial), cut + drawer kick on cash, driver fallback (74). Real-printer test open (**You**) |
| Cash / UPI static QR / card recorded; day open/close; cash reconciliation | ef (app) + 0f (tables, drafted by ef) | Done: open/close, split payments, cash pay-outs (purchases, staff) subtracted at close (0010); tested short 7 |
| Offline POS with sync | ef | Done: outbox + installable PWA that reloads offline (tested both) |
| Pilot essentials (easy daily use, easy switch from paper/old POS) | ef (app) + 0011 | Done, tested end to end (16 checks): round-off to the rupee (on by default), packaging charge on takeaway, sold-out switch from counter and kitchen (waiter can't add it), move / merge tables, customer name and phone on the bill, Bills page (find, reprint, manager void, bill again), day summary to the owner on WhatsApp, Help on WhatsApp (needs `supportWhatsApp`, **You**) |

## Phase 4: Pilot and launch

| Item | Owner | Status |
|---|---|---|
| Subscription billing in Super Admin: subscriptions, monthly invoices, record UPI/bank payments, reminders, trial expiry | ef (screens) + 0f (tables) | Done: monthly GST invoices, payments, founding prices, overdue/suspend rules, nightly run (ef draft 0008 + screens, 0f review; tested) |
| Sales kit: demo café account, brochure (print/PDF), pitch message, demo script | ef | Done: `docs/pilot-kit/` brochure (2 pages, A4), sales playbook (demo café setup, what to carry, 10-minute demo script, objections, WhatsApp messages). Contact blanks to fill (**You**) |
| Training sheets for waiter, cook, cashier, owner; on-site setup checklist | ef | Done: `docs/pilot-kit/training-sheets.html` (one A4 per role, the app's own button names) and `setup-checklist.html` (before visit, setup, devices, test run, training plan, go-live, 14-day follow-up). Hindi/Marathi versions after a native speaker reviews the app text |
| Google review by scan: QR on bills (ef, staff app: ESC/POS QR + print dialog; tested, QR decodes to the review link), table card + Place ID field (0f/6e, migration 0016), "Review us on Google" on restaurant websites (53/ec) | ef + 6e + ec | Done |
| Reply to Google reviews from Thaliyo (Google Business Profile API) | later | After the pilot. Needs Google to approve Business Profile API access for Thaliyo's Google Cloud project (**You**: apply; approval can take weeks), then each owner connects their Google account |
| Sign 2–3 pilot cafés, on-site setup, printer setup, staff training | **You** | Open |
| Fix real-world issues from the pilot | everyone | After go-live |
| 2 cafés agree to pay | **You** | Go/no-go |
