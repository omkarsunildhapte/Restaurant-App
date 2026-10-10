# Required Changes to the Existing Code

What must change in the current repo (`Admin/`, `users/`, `deilvey/`, `templates/modern-cafe`) to reach the platform in [ROADMAP.md](ROADMAP.md). Tick items as they are done.

- **Last updated:** 2026-10-10

---

## 1. Whole project (Phase 0–1)
- [ ] Upgrade Angular 17 / Ionic 7 / Capacitor 6 → Angular 22 / Ionic 8 / Capacitor 7
- [ ] Restructure into 4 apps + backend: web console, staff app, customer app, delivery app
- [ ] Backend API; move data from Firestore to Postgres (Supabase); Firebase only for push
- [ ] Security: check which Firestore rules are live (repo rules deny all), then role-based access
- [ ] Dev, staging and production environments; secrets out of code

## 2. Data, multi-restaurant (Phase 1)
- [x] Tenant (brand) → outlet structure
- [x] Every food, table, booking, order, bill and delivery tagged with its restaurant (bookings arrive with the customer side)
- [x] Roles: Super Admin, Admin, Owner, Staff (manager, cashier, waiter, kitchen), Delivery Person, Customer (Customer arrives with the customer side)
- [ ] Plans and subscriptions (trial, Starter, Pro, Chain) *(plans, trial and status done; subscription history, invoices and payments in Phase 4)*

## 3. `Admin/` → Super Admin + Business panel (Phases 1–2)
- [x] Split into Super Admin panel (tenants, plans, riders, Sales CRM, platform reports) and Business panel (`apps/super-admin`, `apps/business-panel`)
- [ ] Per-restaurant menu: categories, variants, add-ons, GST rates (foods, beverages, combos) *(built; wiring and browser test pending)*
- [ ] Per-outlet table setup *(built; wiring and browser test pending)*
- [ ] Order statuses (new → preparing → ready → served/delivered) and filters
- [ ] Chats page: build or remove (currently empty)
- [ ] Dashboard with real sales, best sellers, peak hours per outlet *(built; wiring and browser test pending)*
- [ ] Staff management (invite, role, outlet) *(built; wiring and browser test pending)*
- [ ] Onboarding setup wizard *(built; wiring and browser test pending)*
- [ ] Sales CRM (see ROADMAP Phase 2)

## 4. New: Staff app, POS + KDS + Waiter (Phase 3)
- [ ] Waiter: table → items → send KOT
- [ ] KDS: live kitchen screen with sound and status
- [ ] POS: GST bills, discounts, split bills, thermal printer, cash/UPI/card, day close, offline mode

## 5. `deilvey/` → Delivery app (Phase 5)
- [ ] Move folder `deilvey/` → `apps/delivery/`
**First (5a): own delivery**
- [ ] Link riders to a restaurant (own riders); platform pool later
- [ ] Online/offline, accept/reject, pickup → on the way → delivered
- [ ] Proof of delivery (OTP or photo), live location, COD settlement, earnings
- [ ] Super Admin rider verification

**After (5b): partners**
- [ ] Third-party delivery-partner layer (book, track, status, cost) and own-vs-partner rules

## 6. `users/` → Customer app + website + QR (Phase 8, built last)
- [ ] Restaurant chosen from QR code or link; menu of that restaurant
- [ ] QR table ordering in the browser
- [ ] Payments: Razorpay/UPI, pay at counter, COD (payment-methods page is a placeholder today)
- [ ] Order tracking and table booking on real order statuses; WhatsApp/SMS updates
- [ ] Reads the restaurant's template and theme

## 7. `templates/modern-cafe` (Phase 8)
- [x] Replace fixed demo content (name, phone, menu, US$ prices) with each restaurant's data
- [x] ₹ pricing and Indian veg / non-veg marks instead of V / VG / GF
- [x] Colours, fonts and logo as theme settings
- [ ] Booking and ordering connected to the backend instead of WhatsApp links
- [ ] Build the other 9 templates on the same structure

## 8. Before launch
- [ ] Product name and domain
- [ ] DeskDyne / Yagy Tech agreement check (before corporate mode)
- [ ] Verify the FSSAI e-commerce licence rule for restaurants with their own ordering
- [ ] Privacy, terms and refund pages for the platform and each restaurant site

---

## Update log

### 2026-10-10 (Phase 1)
- Ticked sections 2 and 3 where done (data model, roles, Super Admin/Business split). Business panel menu, tables, staff, dashboard and wizard are built and marked pending until they are wired and browser-tested.

### 2026-10-10 (later)
- `templates/modern-cafe` is now data-driven: `restaurant.json` + `node build.mjs` → static site. ₹ prices, FSSAI-style veg/egg/non-veg marks, Vegan/Jain/GF tags, theme colours/fonts/logo, home sections on/off and order. Booking and ordering still go through WhatsApp.

### 2026-10-10
- Created from the code audit: 8 groups of changes mapped to roadmap phases.
