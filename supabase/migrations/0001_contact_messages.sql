-- Table for website contact-form submissions.
-- Inserts happen only from the "contact" Edge Function using the service role,
-- which bypasses RLS. RLS is enabled with no public policies, so the anon key
-- cannot read or write this table directly.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  interest text,
  message text not null
);

alter table public.contact_messages enable row level security;

-- (No policies on purpose: only the service role, used by the Edge Function,
--  can insert. Read submissions in the Supabase dashboard / Table Editor.)
