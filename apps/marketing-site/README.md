# Marketing website

The platform's **own** website, for restaurant owners: why use us, features, pricing, and a
"Book a free demo" form. ROADMAP Phase 2.

Not to be confused with `templates/`, which builds **each restaurant's** website for its
customers (menu, booking). This site sells the platform; templates are part of the product.

```bash
npm run build        # site.json + src/ -> dist/   (Node 18+, no dependencies)
npm start            # build, then serve dist/ on http://localhost:4400
npm run deploy       # build, then deploy dist/ to Cloudflare (wrangler.jsonc)
```

## Pages

| Page | File |
|---|---|
| Home | `index.html`: hero, how it works, features, who it's for, what's ready vs coming next, founding offer, FAQ |
| Features | `features.html`: every feature group, each marked **At launch** or **Coming next** |
| Pricing | `pricing.html`: plans, founding prices, setup fee, aggregator comparison, full FAQ |
| Book a demo | `demo.html`: the demo / free-trial form |
| About, Contact | `about.html`, `contact.html` (contact has the same form, as a call-back request) |
| Legal | `privacy.html`, `terms.html`, `refund.html`: **drafts**, marked as such on the page |
| 404 | `404.html` |

## What to change in `site.json`

| Key | What |
|---|---|
| `brand` | Product name, company, tagline: change once the product name is chosen |
| `url` | The real domain, e.g. `https://example.in`. Empty = no canonical links, no sitemap, and `robots.txt` blocks search engines (for previews) |
| `contact` | Phone, WhatsApp (12 digits with 91), email, hours. Empty values are hidden |
| `demoApiUrl` | The marketing API's `/api/v1/public/demo-requests` (backend/marketing). Its `CORS_ORIGINS` must include this site's domain |
| `pricing` | Plans, founding prices and spots, setup fee, trial length |

## The demo form

`js/main.js` checks the fields, then posts JSON to `demoApiUrl`. The marketing API creates a
lead in the Sales CRM (source "website", follow-up today), which shows up in
`apps/super-admin` under Follow-ups. A hidden "website" field catches bots, and the API allows
5 requests per IP per 15 minutes.

## Before going live

- Choose the product name and domain; set `brand`, `url` and `contact`.
- Point `demoApiUrl` at the deployed marketing API.
- Have a lawyer review the privacy, terms and refund pages, then remove the draft note in `src/pages/legal.mjs`.
- Confirm prices (taken from `docs/ROADMAP.md` and `docs/GO-TO-MARKET.md`), and whether they include GST.
