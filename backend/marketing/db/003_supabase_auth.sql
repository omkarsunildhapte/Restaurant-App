-- Sign-in moved to Supabase Auth (one login for the CRM and the platform).
-- crm.users is now the CRM's view of a team member: its id IS the Supabase user id
-- (auth.users.id), written on each signed-in request. Passwords live only in Supabase.
--
-- No foreign key to auth.users: this schema must also migrate on a plain Postgres
-- (tests), where the auth schema does not exist.

-- Team members created before the switch had their own ids and passwords; they cannot
-- sign in any more, so they are removed (leads and activities keep their history with
-- the salesperson cleared, through the existing ON DELETE SET NULL).
DELETE FROM users;

ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;

-- The id is the identity now; Supabase already keeps emails unique.
DROP INDEX IF EXISTS users_email_lower_key;
