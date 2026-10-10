-- Sales CRM: selling the platform to restaurants (ROADMAP Phase 2).
--
-- Everything lives in the `crm` schema (the connection's search_path puts it first), so
-- the Node platform API can own `public` without either side colliding.
--
-- Enum-like columns use CHECK constraints rather than PostgreSQL ENUM types: adding a
-- value is a plain constraint swap instead of ALTER TYPE.

-- ---------------------------------------------------------------------------
-- Sales team
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text        NOT NULL,
  password_hash  text        NOT NULL,
  name           text        NOT NULL,
  -- admin: everything, including deletes, dealers and the team. sales: works leads.
  role           text        NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'sales')),
  is_active      boolean     NOT NULL DEFAULT true,
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (lower(email));

-- ---------------------------------------------------------------------------
-- Dealers and partners (billing-machine and printer dealers, referrers)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS dealers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text          NOT NULL,
  company        text,
  phone          text,
  email          text,
  area           text,
  city           text          NOT NULL DEFAULT 'Pune',
  -- Recurring share of each paying restaurant's monthly plan, in percent.
  commission_pct numeric(5,2)  NOT NULL DEFAULT 20 CHECK (commission_pct >= 0 AND commission_pct <= 100),
  is_active      boolean       NOT NULL DEFAULT true,
  notes          text,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Leads: one row per restaurant being sold to
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS leads (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name           text        NOT NULL,
  restaurant_type           text        NOT NULL DEFAULT 'cafe'
                            CHECK (restaurant_type IN ('cafe', 'family_restaurant', 'qsr', 'cloud_kitchen',
                                                       'bakery', 'bar', 'chain', 'other')),
  owner_name                text,
  -- 10-digit Indian mobile numbers, stored without +91 so duplicates match.
  phone                     text,
  whatsapp                  text,
  email                     text,
  area                      text,
  city                      text        NOT NULL DEFAULT 'Pune',
  address                   text,
  maps_url                  text,
  seats                     integer     CHECK (seats >= 0),
  outlets                   integer     NOT NULL DEFAULT 1 CHECK (outlets >= 1),

  -- Qualifying: null means "not asked yet", which is different from "no".
  current_billing           text        NOT NULL DEFAULT 'unknown'
                            CHECK (current_billing IN ('unknown', 'paper', 'petpooja', 'other_software', 'none')),
  billing_software          text,
  on_aggregators            boolean,
  monthly_aggregator_orders integer     CHECK (monthly_aggregator_orders >= 0),
  has_website               boolean,
  has_own_riders            boolean,

  stage                     text        NOT NULL DEFAULT 'new'
                            CHECK (stage IN ('new', 'contacted', 'demo_booked', 'demo_done', 'trial',
                                             'onboarding', 'paying', 'lost')),
  lost_reason               text,
  expected_plan             text        CHECK (expected_plan IN ('starter', 'pro', 'chain')),
  source                    text        NOT NULL DEFAULT 'other'
                            CHECK (source IN ('website', 'walk_in', 'dealer', 'referral', 'instagram',
                                              'google_ads', 'expo', 'import', 'other')),
  dealer_id                 uuid REFERENCES dealers (id) ON DELETE SET NULL,
  assigned_to               uuid REFERENCES users (id)   ON DELETE SET NULL,
  next_follow_up_on         date,
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_stage_idx       ON leads (stage);
CREATE INDEX IF NOT EXISTS leads_area_idx        ON leads (lower(area));
CREATE INDEX IF NOT EXISTS leads_follow_up_idx   ON leads (next_follow_up_on) WHERE next_follow_up_on IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads (assigned_to);
CREATE INDEX IF NOT EXISTS leads_dealer_idx      ON leads (dealer_id);
CREATE INDEX IF NOT EXISTS leads_phone_idx       ON leads (phone);
CREATE INDEX IF NOT EXISTS leads_created_at_idx  ON leads (created_at DESC);

-- Every call, visit, WhatsApp, demo or note, as its own row.
CREATE TABLE IF NOT EXISTS lead_activities (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    uuid        NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  type       text        NOT NULL CHECK (type IN ('call', 'visit', 'whatsapp', 'demo', 'email', 'note')),
  outcome    text        CHECK (outcome IN ('no_answer', 'interested', 'call_back', 'not_interested',
                                            'demo_booked', 'trial_started', 'won', 'lost')),
  note       text,
  created_by uuid        REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_activities_lead_idx ON lead_activities (lead_id, created_at DESC);

-- Every stage a lead has been in, written by trigger so no code path can skip it. The
-- funnel report counts leads that ever reached a stage, not just the ones sitting in it.
CREATE TABLE IF NOT EXISTS lead_stage_history (
  id         bigserial PRIMARY KEY,
  lead_id    uuid        NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  from_stage text,
  to_stage   text        NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_stage_history_lead_idx ON lead_stage_history (lead_id);
CREATE INDEX IF NOT EXISTS lead_stage_history_to_idx   ON lead_stage_history (to_stage);

CREATE OR REPLACE FUNCTION record_lead_stage() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO lead_stage_history (lead_id, from_stage, to_stage) VALUES (NEW.id, NULL, NEW.stage);
  ELSIF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO lead_stage_history (lead_id, from_stage, to_stage) VALUES (NEW.id, OLD.stage, NEW.stage);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_record_stage ON leads;
CREATE TRIGGER leads_record_stage AFTER INSERT OR UPDATE OF stage ON leads
  FOR EACH ROW EXECUTE FUNCTION record_lead_stage();

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['dealers', 'leads']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_set_updated_at ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END;
$$;
