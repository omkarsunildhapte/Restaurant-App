# Staff app: waiter, kitchen display (KDS), POS

The app restaurant staff use during service (ROADMAP Phase 3). One app, three screens; each
person sees the ones their role allows:

| Screen | Who | What |
|---|---|---|
| **Tables** (`/waiter`) | waiter, cashier, manager, owner | Floor map (free / ordering / bill asked). Tap a table, add dishes (sizes, add-ons, kitchen notes), **Send to kitchen** as the next KOT round, **Ask for bill** |
| **Kitchen** (`/kitchen`) | kitchen, manager, owner | Live KOTs in New → Preparing → Ready columns, timers (amber 10 min, red 20 min), one tap to move, chime on new tickets, print a KOT |
| **POS** (`/pos`) | cashier, manager, owner | Open orders, takeaway and phone orders, add items, send KOT (printed for kitchens without a screen), **bill**: discount ₹/%, split payments cash/UPI/card, change for cash, settle and print the GST receipt |
| **Day** (`/day`) | cashier, manager, owner | Open the day with opening cash; close with a cash count: expected vs counted, sales by method, GST, discounts, voids |

```bash
npm install
npm start              # dev server, http://localhost:4500
npm test               # Vitest
npm run build          # production build with SSR
npm run serve:ssr      # SSR server from dist/ (port 4006; PORT to change, NG_ALLOWED_HOSTS for the domain)
```

Stack (same as every app here): Angular 22, standalone, zoneless + signals, SSR (login rendered on
the server, working screens in the browser), Tailwind v4, Vitest, Supabase Auth (one login),
no CommonModule, no zone.js, no Karma/Jasmine.

## How it works

- **Data:** straight to Supabase (`orders`, `order_items`, `kots`, `table_status`, `send_kot`,
  `request_bill`, `settle_bill`, `open_day`, `close_day`; migration `20261010000006_staff_operations.sql`).
  Row-level security decides who may do what; the app only hides what a role can't use.
- **Live:** Supabase Realtime on orders, items and KOTs: a waiter's KOT appears on the kitchen
  screen, and the kitchen's "Ready" appears on the waiter's phone and the counter.
- **Offline mode** (`core/outbox.ts`): every write goes through an outbox. Without internet,
  orders, items, KOTs and bills are applied on the device at once, kept in localStorage, and sent
  in order when the connection returns. Ids are made on the device, so a whole takeaway can be
  taken and billed offline. The receipt prints as "provisional" and gets its invoice number on
  sync. The menu and the floor are cached on the device. Opening and closing the day need the
  internet, and closing waits until nothing is left to sync.
- **GST** (`core/billing.ts`): the same maths as the database (per-line GST, prices with or
  without tax, discount before tax, CGST/SGST split, paisa rounding), so an offline bill adds up to
  exactly what the server computes. Unit-tested.
- **Printing** (`core/printer.ts`): receipts and KOTs go to the browser's print with 58 or 80 mm
  layouts (choose in the menu). Install the thermal printer's driver, make it the default, and
  turn on "open cash drawer" in the driver if a drawer is connected. Run Chrome with
  `--kiosk-printing` to skip the print dialog.

## Test accounts (local Supabase seed)

`waiter.baner@brewleaf.test`, `kitchen.baner@brewleaf.test`, `cashier.baner@brewleaf.test`,
`manager.baner@brewleaf.test`; the password is in `supabase/seed.sql`.

## Not yet

- Direct ESC/POS printing over USB/Bluetooth (no print dialog, no driver), and testing on a real printer.
- Android build with Capacitor (same code); the web app works on Android Chrome today.
- Moving an order to another table, splitting one order into several bills by item (payments can
  already be split any way).
