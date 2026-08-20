-- SCR-017 — Marketing waitlist persistence.
--
-- POST /api/marketing/waitlist (src/app/api/marketing/waitlist/route.ts) has
-- validated, deduped (in-process only — reset on every redeploy/cold start),
-- and thrown away every waitlist signup since it shipped. This table gives it
-- somewhere real to write. See docs/db/decisions/SCR-017.md for the full
-- writeup.
--
-- Additive only: new table, no existing object touched.

create table if not exists public.waitlist (
  id                        uuid primary key default gen_random_uuid(),
  email                     text not null,
  -- The referral code this signup entered, if any (attribution — see the
  -- self-referral guard in the route handler for why this can be null even
  -- when a code was submitted).
  referral_code             text,
  -- Where the signup came from: 'homepage' | 'footer' | 'referral' | 'app' |
  -- free text — matches WaitlistSource in src/lib/api.ts. Not a DB enum: the
  -- route handler already caps/free-forms this value, and a new marketing
  -- surface shouldn't need a migration just to add a source label.
  source                    text not null default 'homepage',
  created_at                timestamptz not null default now()
);

-- One row per email — mirrors the route handler's existing dedup intent, now
-- enforced by the database instead of an in-process Set.
create unique index if not exists waitlist_email_key on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

-- No RLS policies. Unlike `categories` (public reference data, read by every
-- visitor), a waitlist row has no legitimate anon-read use case, and an
-- anon-INSERT policy would let anyone holding the public publishable key
-- write directly via PostgREST — bypassing the route handler's validation,
-- spam guards, and self-referral check entirely. The Next.js route handler
-- (server-side only) is the sole writer, via the service-role client;
-- service-role bypasses RLS regardless of what policies exist here.
