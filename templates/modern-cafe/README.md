# Modern Café template

Template #2 of the 10 default restaurant templates (see `docs/ROADMAP.md`, Phase 8).
One restaurant = one JSON file. The build turns it into a static website: Home, Menu,
About, Contact, Book a table and 404.

```
node build.mjs                                         # restaurant.json -> dist/
node build.mjs examples/chai-corner.json --out out/chai-corner
```

Node 18+ and no dependencies. Bad data stops the build with a list of what to fix
(unknown colour, wrong diet value, duplicate dish id, missing hours and so on).
The output folder is not emptied, so `dist/videos/`, `dist/videos.html` and
`dist/_headers` (demo deployment only) stay where they are.

```
modern-cafe/
├── restaurant.json      sample restaurant (Brew & Leaf Café, Baner - fictional)
├── examples/            same template, other restaurants (different colours, fonts, sections)
├── build.mjs            reads the JSON, checks it, writes the pages
├── src/
│   ├── lib.mjs          escaping, ₹ formatting, WhatsApp/maps links, opening hours
│   ├── icons.mjs        inline SVG icons (names usable in the JSON)
│   ├── layout.mjs       <head>, announcement bar, header, footer, mobile action bar
│   ├── parts.mjs        images, veg/egg/non-veg marks, food cards, CTA band
│   └── pages/           home, menu, about, contact, book, notfound
├── css/style.css        template styles; :root holds the default theme
├── js/main.js           open-now status, menu tabs/search/filters, booking flow
└── assets/              shared images and icons
```

## What a restaurant can change (restaurant.json)

| Key | What it controls |
|---|---|
| `restaurant` | Name, phone, WhatsApp, email, FSSAI licence no., address, map, opening hours, social links, currency |
| `restaurant.googlePlaceId` | Google Place ID of this site's outlet (`outlets.google_place_id`, 10-300 characters; the QR is left out above ~160). Adds "Review us on Google" in the footer, on the home reviews section and on the contact page (with a scan-to-review QR for desktop visitors, drawn by `src/qr.mjs`, no dependencies). Leave it out and all review buttons hide. One site = one outlet; a chain builds one site per outlet |
| `theme` | Colours, fonts and logo in the shared format of [../THEME.md](../THEME.md); the customer app uses the same theme. `primary`, `dark` and `background` are usually enough |
| `home.sections` | Which home sections show, in which order: `hero, info, categories, ribbon, welcome, popular, values, reviews, gallery, faq, events, cta` |
| `menu.categories[].items[]` | `id`, `name`, `description`, `price` (number, in rupees), `diet` (`veg` / `egg` / `nonveg`), `tags` (`vegan`, `jain`, `gf`), `popular`, `image` |
| `delivery` | Swiggy / Zomato (or other) listing links, shown in the announcement bar and order bands |
| `booking` | Max party size online, notice period, last slot before closing, seating, occasions, rules |
| `about`, `contact`, `faq`, `footer`, `announcement`, `seo` | Page text |
| `poweredBy` | Small "Powered by Thaliyo" in the footer (on by default). `{ "show": false }` hides it; `url` links it once Thaliyo's site is live. Uses `brand/thaliyo-logo-on-dark-160.webp` when that file exists, plain text until then |

Derived from the data, never typed twice: footer and contact opening hours, "Open now",
booking days and time slots, JSON-LD (Restaurant + FAQ), menu legend and filters (only the
marks and tags actually used), popular-dish cards (items with `popular` and an `image`),
the home category strip (categories with an `image`), and `site.webmanifest`.

Menu marks follow FSSAI style: green dot = veg, brown triangle = non-veg, plus an egg mark.
The "Veg only" filter hides egg dishes.

## Placeholder content in the sample

`restaurant.json` is a demo. Before a real launch, replace:

- **Phone and WhatsApp** (`+91 20 0000 0000` / `910000000000`) and the FSSAI number: placeholders that don't work
- **Reviews** (`home.reviews.sample: true`, shown with a "Sample reviews" note) and **events** (`home.events.sample: true`): use real ones or remove `reviews` / `events` from `home.sections`
- Instagram/Facebook links, Swiggy/Zomato links (they go to the apps' home pages), domain in `seo.url`
- Photos in `assets/img/` (Unsplash licence, free for commercial use) with the restaurant's own

## Still to do (Phase 8)

- Ordering and booking go out as WhatsApp messages; connect them to the backend (orders to KDS/POS, online payments) once it exists
- Business panel theme editor with live preview that writes this JSON
- Image upload and resizing (today `large` / `smallWidth` are filled in by hand)

## Demo deployment

Live demo: https://brew-and-leaf-demo.dhapteomkar38.workers.dev (Cloudflare Worker
`brew-and-leaf-demo`). Run `node build.mjs`, then `npx wrangler deploy` from this folder.
`worker.js` only serves `/videos/*` with byte ranges, so the walkthrough videos play on iPhone.
