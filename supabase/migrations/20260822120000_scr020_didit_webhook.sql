-- SCR-020 — Didit webhook support (issue #28).
-- Additive, forward-only. See docs/db/decisions/SCR-020.md.
--
-- Two changes:
--  1. `profiles.kyc_session_id` / `profiles.kyc_decision` — latest Didit
--     session correlation + full decision blob, for staff KYC review depth.
--     `profiles.kyc_status` (SCR-001) already exists and stays the single
--     field the app/admin read for status — these are additive detail, not a
--     new source of truth.
--  2. `didit_webhook_events` — one row per delivery attempt (verified or
--     not), for idempotency (unique on event_id, verified deliveries only)
--     and for debugging signature failures (raw_body always logged).

alter table public.profiles
  add column kyc_session_id uuid,
  add column kyc_decision   jsonb;

comment on column public.profiles.kyc_session_id is
  'Most recent Didit verification session id for this user (issue #28). Null until a Didit webhook has landed.';
comment on column public.profiles.kyc_decision is
  'Most recent Didit decision object (issue #28) — id_verifications/aml_screenings/etc, for staff KYC review. Not read by kyc_status logic; profiles.kyc_status stays the single status field the app reads.';

-- No unique constraint on event_id: Didit's own retry policy re-delivers the
-- SAME event_id up to twice on a 5xx/404, and the spec wants every delivery
-- attempt logged as its own row ("Each delivery attempt is a new WebhookLog
-- row") — a unique constraint would make that impossible. Idempotency is
-- instead a read-before-write check in the Edge Function: skip processing
-- (but still log the attempt) if a prior signature_valid + processed row
-- already exists for this event_id.
create table public.didit_webhook_events (
  id                uuid primary key default gen_random_uuid(),
  -- Didit's event_id — kept even for a signature-invalid delivery, for
  -- debugging.
  event_id          uuid,
  session_id        uuid,
  webhook_type      text,
  status            text,
  signature_method  text,   -- 'v2' | 'raw' | 'simple' | null (verification failed)
  signature_valid   boolean not null,
  raw_body          text not null,
  processed         boolean not null default false,
  error             text,
  created_at        timestamptz not null default now()
);

create index didit_webhook_events_event_idx
  on public.didit_webhook_events (event_id)
  where event_id is not null;

create index didit_webhook_events_session_idx
  on public.didit_webhook_events (session_id)
  where session_id is not null;

-- Service-role only — no RLS policy for authenticated/anon (matches
-- idempotency_keys / rate_limit_hits precedent). The Edge Function is the
-- only writer; nothing client-side ever reads this table.
alter table public.didit_webhook_events enable row level security;
