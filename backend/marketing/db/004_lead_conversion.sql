-- A won lead becomes a restaurant on the platform (public.tenants, created through the Node
-- API's POST /platform/v1/tenants). The CRM keeps the link so the pipeline can open the
-- restaurant, and so one lead is never converted twice.
--
-- No foreign key into public: this schema also migrates on plain Postgres for tests.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS tenant_id    uuid,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS leads_tenant_id_key ON leads (tenant_id) WHERE tenant_id IS NOT NULL;
