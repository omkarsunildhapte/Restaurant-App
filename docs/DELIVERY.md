# Delivery: Own Riders and Third-Party Partners

Design for **Phase 5** of the [ROADMAP](ROADMAP.md) (weeks 15–19). **Own delivery is built first (5a, weeks 15–17)**; third-party partners (5b, weeks 18–19) are added only after own delivery works at a pilot café. Checklist items live in the roadmap and in [REQUIRED-CHANGES.md](REQUIRED-CHANGES.md) §5; this file explains how they fit together.

- **Last updated:** 2026-10-10
- **Codebases:** D. Delivery app (from `deilvey/`), A. Web console (Business panel + Super Admin), B. Staff app (POS), Backend
- **Depends on:** Phase 1 (tenants, outlets, roles, orders), Phase 3 (POS creates delivery orders)

---

## 1. Goal

**5a, own delivery first (the normal version):**
- Cashier assigns each delivery order to one of the restaurant's own riders (manual; no auto-offer yet).
- Rider accepts, moves the job through the steps, delivers with OTP or photo, records cash.
- Owner sees live rider locations, settles cash at day close, and gets simple rider reports.
- In 5a only the **Manual** dispatch mode exists, with own riders only. §5's other modes, auto-offer and partner fallback, plus all of §6, belong to 5b.

**5b, partners later:**

Each delivery order goes **to the restaurant's own rider or to a third-party partner rider**, either picked by the cashier or chosen automatically by outlet rules. Both paths use the same statuses, tracking, proof of delivery and reports, so the owner sees one list of deliveries, not two.

Until Phase 8, delivery orders come from the **POS** (phone and walk-in orders). In Phase 8 they also come from the customer website and app, using the same flow.

---

## 2. Main flow

```
POS creates order (type = delivery, address, payment = prepaid / COD)
        │
        ▼
Delivery job created ──► Dispatch rules for the outlet
        │                     │
        │        ┌────────────┴─────────────┐
        │        ▼                          ▼
        │   Own rider free?            Third-party partner
        │   offer to rider(s)          get quotes → book (one tap or auto)
        │        │                          │
        │        ▼                          ▼
        │   accepted / rejected /      partner webhook: assigned →
        │   timed out                  picked up → delivered / cancelled
        │        │                          │
        └────────┴──────── fallback ────────┘
                          │
                          ▼
         Delivered (OTP or photo) → COD recorded → reports
```

---

## 3. Delivery job statuses

One status list for both own and partner riders. The order's own status (new → preparing → ready → delivered) is kept separate. The kitchen moves the order to "ready", and the delivery job moves it to "delivered".

| Status | Meaning | Own rider: set by | Partner: set by |
|---|---|---|---|
| `pending` | Job created, no rider yet | Backend | Backend |
| `offered` | Sent to an own rider, waiting for accept | Backend | — |
| `quoting` | Getting price/ETA from partners | — | Backend |
| `assigned` | A rider is on it | Rider accepts | Partner webhook |
| `at_pickup` | Rider at the restaurant | Rider app | Partner webhook (if sent) |
| `picked_up` | Food handed over | Rider app (cashier confirms) | Partner webhook |
| `at_drop` | Rider at the customer | Rider app | Partner webhook (if sent) |
| `delivered` | Done, proof captured | Rider app (OTP/photo) | Partner webhook |
| `failed` | Customer unreachable, wrong address, refused | Rider app + reason | Partner webhook + reason |
| `cancelled` | Cancelled by restaurant or partner | Cashier / owner | Cashier / partner webhook |

Rules:
- Statuses only move forward. The only backward move is `assigned` → `pending`, when a rider or partner drops the job, and that starts the fallback.
- Every change is stored as a **delivery event** (who, when, location, note), so the timeline and the reports come from one table.
- When a partner does not send `at_pickup` / `at_drop`, those steps are skipped.

---

## 4. Data model (Postgres)

Every table carries `tenant_id` and `outlet_id`, and row-level security applies, as in the rest of the backend.

> **Built for 5a:** [supabase/migrations/20261010000005_delivery.sql](../supabase/migrations/20261010000005_delivery.sql) (tests: `supabase/tests/delivery.test.sql`). Differences from the table below: no `rider_outlets` table, since a rider is a `delivery` membership and its `outlet_id` decides the outlets (null = all); rider pay fields and `rider_payouts` wait until after the pilot; partner tables are 5b. Orders gain `delivery_address`, `delivery_lat/lng`, `delivery_charge` and `cash_on_delivery`. All writes go through RPCs: `assign_delivery`, `respond_to_delivery`, `advance_delivery`, `complete_delivery`, `fail_delivery`, `cancel_delivery`, `set_rider_online`, `report_rider_location`, `verify_rider`, `cod_due`, `settle_cod`, `my_deliveries`. Firebase is used only for FCM push; login and data are Supabase.

| Table | Key fields | Notes |
|---|---|---|
| `riders` | id, user_id, name, phone, vehicle type/number, licence, ID proof, bank/UPI, `verification_status`, `is_online`, last location | Replaces Firestore `deliveryPatner`. Verified by Super Admin |
| `rider_outlets` | rider_id, outlet_id, role (`own` / `platform`), pay type (per order / per km / salary), rate | One rider can work for several outlets of a brand. `platform` is for the Phase 9 pool |
| `delivery_jobs` | id, order_id, `mode` (`own` / `partner`), rider_id or partner_booking_id, status, pickup/drop lat-lng, distance, quoted cost, final cost, charged to customer, COD amount, OTP hash, proof photo, attempt no. | One order can have several jobs (one per attempt); only the newest is active |
| `delivery_events` | job_id, status, actor (rider / staff / partner / system), lat-lng, reason, raw partner payload, at | Timeline, audit and reports |
| `rider_locations` | rider_id, job_id, lat-lng, speed, at | Only while online. Keep 30 days, then delete |
| `partner_accounts` | outlet_id, partner, `billing` (`own_account` / `platform_account`), encrypted credentials, enabled | Credentials stay in the backend, never in apps |
| `partner_quotes` | job_id, partner, price, pickup ETA, drop ETA, expires_at | Shown to the cashier; reused if booked before expiry |
| `dispatch_rules` | outlet_id, mode, own-rider radius km, max wait for own rider (sec), partner order, max partner price, auto-book on/off | One row per outlet |
| `cod_settlements` | rider_id, outlet_id, business date, cash collected, cash handed in, difference, settled_by, at | Created at day close |
| `rider_payouts` | rider_id, period, orders, km, amount, status | Earnings screen and owner payout list |

---

## 5. Choosing own rider vs third-party

### Dispatch modes (per outlet, set in the Business panel)

| Mode | Behaviour |
|---|---|
| **Manual** (default at launch) | Cashier sees free own riders and partner quotes side by side, then taps one |
| **Own first** | Offer to own riders. If no one accepts within `max wait`, get partner quotes and book (auto or ask cashier) |
| **Distance split** | Own riders up to `own-rider radius`; beyond it, partner |
| **Partner only** | Always third-party (outlets with no riders) |

### Picking an own rider
1. Filter: online, verified, linked to this outlet, carrying fewer than the outlet's max active orders.
2. Sort by distance to the outlet (last known location), then by fewest deliveries today.
3. Offer to the first rider; 45 s to accept (configurable). On reject or timeout, offer to the next one.
4. Cashier can override at any time and assign directly.

### Picking a partner
1. Ask every enabled partner for a quote at the same time (5 s timeout each; drop slow ones).
2. Hide partners that are unserviceable or above `max partner price`.
3. Sort by cost, or by drop ETA if the outlet prefers speed.
4. Auto-book the top one if auto-book is on; otherwise the cashier taps one.

### Fallback
- Own rider rejects/times out → next own rider → partner (if the mode allows).
- Partner cancels or no rider is assigned within N minutes → next partner → offer to own riders → alert the cashier.
- After 3 failed attempts, stop and alert the cashier (sound + banner on the POS).
- Each attempt is a new `delivery_jobs` row, so the cost and the reason are kept for each try.

---

## 6. Third-party partner layer

### One interface, one adapter per partner

```ts
interface DeliveryPartner {
  id: string;                                   // 'porter', 'borzo', ...
  quote(req: QuoteRequest): Promise<Quote | Unserviceable>;
  book(req: BookRequest): Promise<Booking>;     // returns partner booking id + tracking URL
  cancel(bookingId: string, reason: string): Promise<CancelResult>;
  track(bookingId: string): Promise<PartnerStatus>; // polling fallback only
  parseWebhook(headers: Headers, body: unknown): PartnerEvent; // verify signature, map to our status
}
```

- Adapters live in the backend only (`backend/delivery/partners/<partner>.ts`).
- `parseWebhook` maps each partner's statuses onto §3. Unknown statuses are stored in `delivery_events` and do not move the job.
- **Webhooks first, polling second.** Poll only when no webhook has arrived for a few minutes, and keep to each partner's rate limit (Porter, for example, allows one track call per order per minute).
- Every call is logged with the request, response and time taken, so disputes with a partner can be checked.
- A **mock partner** adapter is built first, to develop and test the flow without real bookings.

### Who pays the partner

| Option | How it works | Good for |
|---|---|---|
| Restaurant's own account | Restaurant signs up with the partner; credentials stored per outlet; partner bills the restaurant | Restaurants already using Porter/Borzo |
| Platform account | Vernoka's account books the rider; cost (+ optional fee) added to the restaurant's monthly invoice | Small cafés that don't want another account |

Platform-account billing needs care: Vernoka pays partners up front, so it needs a credit limit per restaurant and a GST-correct invoice line.

### Partner shortlist (checked 2026-10-10, confirm before building)

| Partner | What public info shows | Food delivery via API? | Next step |
|---|---|---|---|
| **Porter** | B2B API: Get Quote (fare + unserviceable check), book, Track Order (1 call/min/order), webhooks; credentials via a form. Docs say **only 2-wheeler** bookings via API | Not stated; Porter is mainly goods/parcels | Ask whether cooked food orders are allowed; test quotes for Pune addresses |
| **Borzo** | Business API (docs linked from their India site), dashboard, bulk upload, COD, tracking link; Pune listed. Typical delivery 60–90 min | Possible, but 60–90 min is slow for hot food | Get API docs and sandbox; ask about express/food SLA in Pune |
| **Shadowfax** | Hyperlocal via API; restaurants listed as a segment; serviceability API used by Zomato (2017 blog) | Yes, historically | No public docs; contact sales for volume minimums |
| **Pidge** | Aggregator network (200–500+ partners, 100+ cities) and ONDC logistics participant | Likely, through its partners | Ask for API docs; one integration can cover several carriers |
| **ONDC logistics** (via a provider) | Shiprocket and others are live on ONDC logistics; mainly inter-city/parcel | Unclear for hyperlocal food | Revisit with Phase 9 ONDC work |

**Suggested order:** mock adapter → one aggregator (Pidge or similar, covers several carriers with one integration) → Porter or Borzo directly for cost. Commercial terms and food permission come first, before any adapter code.

Sources: [Porter API integrations](https://porter.in/api-integrations) · [Borzo India](https://borzodelivery.com/in/porter-alternatives-india) · [Shadowfax hyperlocal](https://shadowfax.in/hyperlocal) · [Shadowfax serviceability API](https://www.shadowfax.in/blog/enabling-real-time-serviceability-for-online-marketplaces-for-hyperlocal-delivery) · [Pidge joins ONDC](https://cargoconnect.co.in/?p=16863) · [Shiprocket on ONDC](https://www.maritimegateway.com/shiprocket-enables-inter-city-logistics-for-small-merchants-on-ondc/)

---

## 7. Own-rider app (`deilvey/` → `apps/delivery/`)

### What exists today and what changes

| Today | Change |
|---|---|
| Sign-up with personal, document, vehicle, bank pages | Keep the screens; save to `riders` via the API; add "pending verification" state |
| `OrderService.getOrder()` reads **all** Firestore `orders` | Read only jobs offered to / assigned to this rider |
| `deliveryPatner` collection (spelling) | Replaced by `riders` table |
| `track-map` page with a fixed sample address | Real pickup/drop from the job (stored lat/lng); a button hands off to the phone's maps app for turn-by-turn navigation (a plain `geo:` link, no maps API) |
| No statuses, no proof, no cash | Added below |

### Screens
1. **Home:** online/offline switch, today's deliveries, cash in hand, earnings today.
2. **New job offer** (full-screen, sound, countdown): outlet, drop area, distance, pay, COD amount → Accept / Reject.
3. **Active job:** big status button (Reached restaurant → Picked up → Reached customer → Deliver), call customer (masked number later), navigate.
4. **Deliver:** enter the customer's 4-digit OTP, **or** take a photo if the OTP is not available (outlet setting decides if photo is allowed); confirm cash collected for COD.
5. **Failed delivery:** reason list + photo; the job returns to the outlet.
6. **Earnings:** per day/week, orders, km, payouts.
7. **Cash:** COD collected today, handed in, balance.

### Location
- Position comes from the device (user rule): `@capacitor/geolocation` in the native rider app, `navigator.geolocation.getCurrentPosition` in a browser. Read on a timer while **online**: every 10 s on a job, every 60 s idle (`enableHighAccuracy: true`, `timeout: 10000`, `maximumAge: 5000`).
- Fallbacks:
  - **Permission denied:** the rider cannot go online; show a screen explaining why, with a button to open app settings.
  - **Timeout or no fix:** keep the last known point, retry on the next tick, and show "location weak" to the rider. After 2 minutes without a fix, flag the rider on the owner's map as "location stale" (from `riders.last_seen_at`).
  - **Location services off:** prompt to turn them on, and stay offline until they are.
- Sent with `report_rider_location()`. The Business panel map and customer tracking read the latest point; history goes to `rider_locations`.
- Clear consent screen; going offline stops tracking. Needed for Play Store background-location review.

### Geocoding and maps (user rule: OpenStreetMap Nominatim, not Google)
- Address → lat/lng (and reverse) uses **Nominatim**, called **only from the Node backend** through the one shared endpoint that ea is building in `backend/src/geocode/` (`GET /geocode/search?q=`, `GET /geocode/reverse?lat=&lng=`, sign-in required). Delivery calls that endpoint and does not build its own.
- One throttled queue for the whole platform: at most **1 request per second**, with an identifying `User-Agent` on every call.
- **No search-as-you-type.** The cashier types the full address and presses Find once.
- **Cache everything:** the result is stored on the row (`orders.delivery_lat/lng` today, saved customer addresses later), and the same address is never geocoded twice.
- Show **"© OpenStreetMap contributors"** wherever results appear on a map.
- Base URL in env (`NOMINATIM_URL`). Launch on the public server; for production volume, self-host Nominatim or use a paid host behind the same backend call.
- Map tiles are a separate decision. OSM's own tile servers have a strict usage policy too, so pick a tile provider before the live map is built (week 16).

### Notifications
- Firebase Cloud Messaging (push only, as decided) for job offers and cancellations; high-priority channel with sound.

---

## 8. POS and Business panel

**POS (Staff app)**
- Delivery order form: customer phone, saved addresses, address typed in full then **Find** (one geocode call, no autocomplete), pin can be dragged to correct it, delivery charge, payment (prepaid / COD).
- "Dispatch" panel: free own riders with distance + partner quotes with price and ETA; one tap to assign/book.
- Delivery board: all active jobs by status, with timers; late jobs in red.
- Proof and timeline on each order.

**Business panel**
- Riders: invite by phone, link to outlets, pay type and rate, block/unblock.
- Dispatch rules per outlet (§5).
- Partner accounts per outlet (§6).
- Live map: own riders + active jobs (partner jobs show their tracking link).
- COD settlement at day close: expected cash per rider vs handed in, difference noted.
- Reports: deliveries per rider, average time (ready → delivered), failed/cancelled with reasons, own vs partner cost, and **saved vs aggregator commission** (order value × 25–35% minus actual delivery cost).

**Super Admin**
- Rider verification queue (documents, approve/reject with reason).
- Partner adapter health: error rate, webhook delays, per partner.

---

## 9. Proof of delivery and OTP

- A 4-digit OTP is created when the job is assigned and sent to the customer by SMS/WhatsApp (Phase 8 adds it to the tracking page). Only a hash is stored.
- Before Phase 8 (POS orders), the cashier can read the OTP to the customer on the phone, or the outlet can allow photo-only proof.
- Partners use their own proof; we store whatever the webhook sends (photo URL, OTP flag).

---

## 10. Cash on delivery

1. COD amount is fixed when the job is created and shown to the rider.
2. On delivery, the rider confirms the amount collected (or enters a different amount + reason).
3. At day close, the cashier sees each rider's expected cash and records what was handed in; the difference is saved in `cod_settlements`.
4. For partner deliveries with COD, the partner's remittance is matched against their report each week (manual at first).

---

## 11. Build order inside Phase 5

**5a: own delivery first**

| Week | Work |
|---|---|
| 15 | Tables (`riders`, `rider_outlets`, `delivery_jobs`, `delivery_events`, `rider_locations`, `cod_settlements`), statuses, delivery job API; move `deilvey/` → `apps/delivery/` (see [REPO-LAYOUT.md](REPO-LAYOUT.md)); rider sign-up on the new backend; Super Admin verification |
| 16 | Rider app: online/offline, job list, accept/reject, status steps, location; POS manual assign; delivery board; Business panel live map |
| 17 | OTP/photo proof, failed delivery, COD settlement at day close, rider earnings, own-rider reports; run at the pilot café |

**5a done when:** a café delivers all its phone orders with its own riders, from assign to cash settled, for one week without paper.

**5b: partners (only after 5a works)**

| Week | Work |
|---|---|
| 18 | `partner_accounts`, `partner_quotes`; partner layer + mock adapter; first real partner adapter; quotes on the POS; webhooks |
| 19 | Dispatch modes beyond Manual, auto-offer to own riders, fallback, own vs partner vs aggregator report |

Partner talks (§6) can still start in **Phase 4**, but no partner code is written until 5a is done.

**5b done when:** the same café books a third-party rider in one tap when its own riders are busy.

---

## 12. Open questions

- [ ] Which partners allow cooked-food deliveries through their API in Pune, and at what price per km?
- [ ] Platform account: do we take a margin on partner deliveries, or pass the cost through?
- [ ] Rider pay: does the platform calculate payouts only, or also pay riders (needs a payout provider)?
- [ ] Customer phone masking for riders: needed at launch or later?
- [ ] Insurance and liability for own riders: restaurant's responsibility, stated in the terms?

---

## Update log

### 2026-10-10
- Own delivery first: Phase 5 split into 5a (own riders, weeks 15–17, manual assign only) and 5b (partners, dispatch rules, auto-offer, weeks 18–19).
- Created this design: unified job statuses, data model, dispatch modes and fallback, partner adapter interface, partner shortlist with public API info, rider app changes from the current `deilvey/` code, POS/panel screens, COD and proof of delivery, week-by-week build order.
