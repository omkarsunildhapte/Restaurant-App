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
| Product name and domain | **You** | Open |
| Supabase cloud projects (staging + production), Cloudflare account access | **You** (account creation is yours) | Open |
| Staging/production env configs filled in, deploy scripts for every app | ea (apps/backend), ef (super-admin, marketing) | After the cloud projects exist |

## Phase 1: Backend, Super Admin, Business panel

| Item | Owner | Status |
|---|---|---|
| Schema: tenants, outlets, users, roles, isolation (RLS) | 0f | Done |
| Schema: menu, categories, variants, add-ons, GST rates, tables, orders, bills, taxes | 0f | Open |
| One login for all roles (Supabase), role-based screens | ef (super-admin), 0f (business panel), ea (staff) | Super Admin done; business-panel and customer/delivery sign-in moved to Supabase Auth in the upgrade |
| Super Admin: tenants, plans, trial, feature switches, platform dashboard | 0f | Screens done; feature switches open |
| Business panel: outlets, menu, combos, tables, staff invites, GST settings, basic reports | 0f (new screens in `src/app/business/`); ea retires the old pages after | In progress |

## Phase 2: Marketing site, onboarding, Sales CRM

| Item | Owner | Status |
|---|---|---|
| Sales CRM | ef | Done (dealer logins, targets later) |
| Marketing website | ef | Built; deploy waits on name/domain |
| Convert won lead → restaurant (calls `POST /platform/v1/tenants`) | ef | Done: tested end to end (lead → tenant + owner invite → Trial + check-in) |
| Assisted onboarding from Super Admin | ef + 0f | Open |
| Self sign-up: website → verify phone/email → business details → outlet → trial | 0f (API, auth) + ef (site pages) | Done: website form → email → set password → wizard → trial (0f API + ef page, tested). Bot check (Turnstile) before going live (**You**: Cloudflare) |
| Setup wizard in Business panel: menu CSV, tables, taxes, staff, printer checklist | 0f (user decision: same owner as the business screens) | Open |
| Welcome email / WhatsApp with login links | 0f (send) + ef (templates) | Open |

## Phase 3: Restaurant operations (staff app, `apps/staff`, owned by ef since 2026-10-10)

| Item | Owner | Status |
|---|---|---|
| Waiter app: table → items → send KOT | ef | Done (tested end to end) |
| KDS: live orders with sound, preparing → ready → served (Supabase Realtime) | ef | Done (tested end to end) |
| POS: dine-in, takeaway, phone bills; GST invoice; discounts; split bill | ef | Done, incl. item-wise split (By items, split a line, pay the rest; 0009, by 74) |
| Thermal printer 58/80 mm + cash drawer (ESC/POS) | ef | Done: direct ESC/POS over USB (WebUSB) and serial/Bluetooth (Web Serial), cut + drawer kick on cash, driver fallback (74). Real-printer test open (**You**) |
| Cash / UPI static QR / card recorded; day open/close; cash reconciliation | ef (app) + 0f (tables, drafted by ef) | Done: open/close, split payments, cash pay-outs (purchases, staff) subtracted at close (0010); tested short 7 |
| Offline POS with sync | ef | Done: outbox + installable PWA that reloads offline (tested both) |

## Phase 4: Pilot and launch

| Item | Owner | Status |
|---|---|---|
| Subscription billing in Super Admin: subscriptions, monthly invoices, record UPI/bank payments, reminders, trial expiry | ef (screens) + 0f (tables) | Done: monthly GST invoices, payments, founding prices, overdue/suspend rules, nightly run (ef draft 0008 + screens, 0f review; tested) |
| Sales kit: demo café account, brochure (print/PDF), pitch message, demo script | ef | Open |
| Training sheets for waiter, cook, cashier, owner; on-site setup checklist | ef | Open |
| Sign 2–3 pilot cafés, on-site setup, printer setup, staff training | **You** | Open |
| Fix real-world issues from the pilot | everyone | After go-live |
| 2 cafés agree to pay | **You** | Go/no-go |
