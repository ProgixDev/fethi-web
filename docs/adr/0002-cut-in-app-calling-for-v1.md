# ADR-0002 — Cut in-app calling for v1

Status: Accepted (2026-07-25)

## Context
The mobile app shipped a full in-app calling surface (`callsApi`, `app/call/[id].tsx`,
a Jitsi embed, an incoming-call poll) that talked to the retired HTTP backend. There
is no `calls` table in any migration, no SCR proposing one, and no Edge Function — the
feature was entirely non-functional and was missed by the Supabase migration sweep.

## Decision
**Cut calling for v1.** Messaging already covers buyer↔seller contact, and a real
implementation is multi-day cross-repo work for a non-core feature: a `calls` table
with participant-scoped RLS, a status enum, an Edge Function for
initiate/transition, Supabase Realtime for incoming-call delivery (replacing the
old poll), plus a media layer (self-hosted Jitsi vs a hosted provider — another
vendor + cost line) and CallKit/ConnectionService for push-notified incoming calls.

## Consequences
- Mobile removed the calling surface (TASK-021): call screen, Jitsi embed, `callsApi`,
  and both entry points. Reversible via git.
- If revived, build it on **Supabase Realtime** (not polling) and file an SCR for the
  `calls` schema at that time. This ADR is the record; re-scoping reopens it as fresh work.
- No backend/schema change for v1.
