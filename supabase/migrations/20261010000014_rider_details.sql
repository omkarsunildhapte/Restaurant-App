-- Rider onboarding details and document photos (Phase 5a). Design: docs/DELIVERY.md.
--
-- 1. rider_details: the personal details the rider app asks for that restaurants do not need to
--    see (user decision 2026-10-10 to keep them all). One row per `riders` row. Readable and
--    writable by that rider only, readable by Super Admin (rider verification); restaurant staff
--    get nothing, unlike `riders`, which cashiers and above read to assign jobs.
-- 2. Storage bucket `rider-documents`: profile photo, driving licence and ID proof, private, under
--    "<tenant_id>/<user_id>/<kind>.<ext>". The rider manages their own folder; Super Admin reads.
--    riders.photo_url / licence_url / id_proof_url hold the object path (no rows used them yet);
--    the app shows them through short-lived signed URLs.

-- ---------------------------------------------------------------------------------------------
-- rider_details
-- ---------------------------------------------------------------------------------------------

create table public.rider_details (
  rider_id uuid primary key,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  date_of_birth date check (date_of_birth >= date '1940-01-01'),             -- age is checked in the app
  address text,
  city text,
  fathers_name text,
  blood_group text check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  national_id text check (national_id is null or length(regexp_replace(national_id, '\s', '', 'g')) between 4 and 20),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, rider_id) references public.riders (tenant_id, id) on delete cascade
);

comment on table public.rider_details is
  'Rider-only personal details (rider app onboarding). Never select these from a staff-facing view or RPC.';
comment on column public.rider_details.national_id is
  'National ID number as typed by the rider (user decision). Possibly Aadhaar: Aadhaar Act limits storing and showing it. '
  'Readable only by the rider and Super Admin (RLS); keep it out of every staff-facing view, RPC and select list; '
  'apps show it masked (last 4 digits).';

create trigger touch before update on public.rider_details for each row execute function private.touch_updated_at();
create trigger keep_tenant before update on public.rider_details for each row execute function private.keep_tenant();

alter table public.rider_details enable row level security;
revoke all on public.rider_details from anon, authenticated;
grant select, insert, update on public.rider_details to authenticated;
grant all on public.rider_details to service_role;

-- The rider's own row: rider_id must be their riders row, in that row's tenant.
create function private.is_own_rider(p_rider uuid, p_tenant uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.riders r where r.id = p_rider and r.tenant_id = p_tenant and r.user_id = auth.uid())
$$;
grant execute on function private.is_own_rider(uuid, uuid) to authenticated;

create policy rider_details_read on public.rider_details for select to authenticated
  using (private.is_own_rider(rider_id, tenant_id) or private.is_super_admin());
create policy rider_details_insert on public.rider_details for insert to authenticated
  with check (private.is_own_rider(rider_id, tenant_id) and private.can(tenant_id, '{delivery}', null, true));
create policy rider_details_update on public.rider_details for update to authenticated
  using (private.is_own_rider(rider_id, tenant_id))
  with check (private.is_own_rider(rider_id, tenant_id) and private.can(tenant_id, '{delivery}', null, true));
-- No delete: details go with the riders row (cascade) or through the service role.

-- ---------------------------------------------------------------------------------------------
-- Document photos
-- ---------------------------------------------------------------------------------------------

comment on column public.riders.photo_url is 'Storage object path in bucket rider-documents (not a URL); shown via a signed URL.';
comment on column public.riders.licence_url is 'Storage object path in bucket rider-documents (not a URL); shown via a signed URL.';
comment on column public.riders.id_proof_url is 'Storage object path in bucket rider-documents (not a URL); shown via a signed URL.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rider-documents', 'rider-documents', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- "<tenant_id>/<user_id>/...": the second folder is the signed-in rider, and they ride for the
-- tenant in the first folder (active delivery membership). Writing also needs the business open
-- for writing; reading does not, so a rider keeps seeing their photos when a trial runs out.
create function private.is_own_rider_document(p_name text, p_write boolean default false) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((storage.foldername(p_name))[2] = auth.uid()::text, false)
     and private.can(private.path_tenant(p_name), '{delivery}', null, p_write)
$$;
grant execute on function private.is_own_rider_document(text, boolean) to authenticated;

create policy rider_documents_read on storage.objects for select to authenticated
  using (bucket_id = 'rider-documents' and (private.is_own_rider_document(name, false) or private.is_super_admin()));
create policy rider_documents_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'rider-documents' and private.is_own_rider_document(name, true));
-- Re-uploading a photo (upsert) updates the object.
create policy rider_documents_update on storage.objects for update to authenticated
  using (bucket_id = 'rider-documents' and private.is_own_rider_document(name, true))
  with check (bucket_id = 'rider-documents' and private.is_own_rider_document(name, true));
