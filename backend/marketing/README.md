# Marketing API (Python)

Sales CRM for selling the platform to restaurants, plus the marketing website's
"Book a demo" form. ROADMAP Phase 2. The restaurant system itself (tenants, menu, POS,
KDS, delivery) is the Node API in `backend/src`.

- **Stack:** FastAPI + PostgreSQL (psycopg 3), same patterns as vernoka-admin's backend.
- **Database:** the same Postgres as the Node API, but every table lives in the `crm`
  schema (`crm.users`, `crm.leads`, `crm.lead_activities`, `crm.lead_stage_history`,
  `crm.dealers`). "Today" is always the Indian date (+05:30), whatever the server's zone.
- **Port:** 4100. The Super Admin app (`apps/super-admin`, port 4300) calls it.

## Run it

Sign-in is **Supabase Auth**: one login for this API and the Node platform API. This API
never sees a password; it checks the Supabase access token against the project's public
keys (JWKS).

```bash
cd backend/marketing
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
cp .env.example .env                 # DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (see `supabase status`)
.venv/Scripts/python scripts/migrate.py
.venv/Scripts/python -m uvicorn app.main:app --reload --port 4100
```

Who gets in:
- A platform **Super Admin** (`public.profiles.is_super_admin`) is a CRM **admin** automatically.
- Anyone else needs `app_metadata.crm_role` = `admin` or `sales`, which only the service-role key can set.
  Admins add people from the Team page (creates the Supabase account with a starting password),
  or with `scripts/create_user.py email password "Name" sales`.
- Public sign-up stays off (`supabase/config.toml`). Switching someone off on the Team page blocks
  them at once, even before their current token expires.

## Endpoints (`/api/v1`)

| Endpoint | Who | What |
|---|---|---|
| `GET /auth/me` | signed in (Supabase token) | Who the token belongs to in the CRM: id, name, role, isSuperAdmin |
| `POST /public/demo-requests` | public, 5 per 15 min per IP | Website form → new lead, source `website`, follow-up today. `website` is a honeypot field |
| `GET /leads` | signed in | Filters: `stage, source, area, assignedTo, dealerId, followUp=overdue\|today\|upcoming\|none, search` |
| `POST /leads`, `GET/PATCH /leads/{id}` | signed in | Phones are stored as 10 digits (`+91 98220-12345` → `9822012345`) |
| `DELETE /leads/{id}` | admin | |
| `POST /leads/import` | signed in | `{rows: [...], source}`; skips duplicates (same phone, or same name + area) and returns why |
| `GET /leads/areas` | signed in | Open / paying / due counts per area |
| `GET/POST /leads/{id}/activities`, `DELETE …/{activityId}` | signed in | Logging can also set `stage`, `lostReason`, `nextFollowUpOn` in one call |
| `GET /reports/summary` | signed in | Stage counts, funnel (leads that ever reached each stage), sources, lost reasons, follow-ups, MRR estimate, churn |
| `GET /users`, `POST /users`, `PATCH /users/{id}` | list: signed in; change: admin | Sales team with per-person results. `POST` creates the Supabase account with `crm_role` |
| `GET /dealers`, `POST/PATCH /dealers/{id}` | list: signed in; change: admin | Dealers with leads, paying and commission owed |

Pipeline stages: `new → contacted → demo_booked → demo_done → trial → onboarding → paying`, or `lost` (reason required).

**Location.** A lead can carry `latitude`, `longitude` and `locationAccuracyM`, sent together. The Super Admin app
fills them from the browser's Geolocation API (`navigator.geolocation.getCurrentPosition`) when a salesperson taps
"Use my current location" at the restaurant. Maps open on OpenStreetMap. Turning a location into an address goes
through the Node backend's Nominatim endpoint (`/geocode/reverse`), never Google Maps and never from this API directly,
so the whole platform stays within Nominatim's 1 request/second limit.

## Not built yet

- **Convert to restaurant:** call the Node API's `POST /platform/v1/tenants` with the same Supabase token (now possible).
- **Real billing numbers:** MRR and dealer commission are estimated from each lead's expected plan at list price, until subscription billing exists (Phase 4).
- **Sales targets** per person.
- **Area from location:** fill `area`/`address` from the saved location via `/geocode/reverse` (now possible: the app signs in with Supabase).
