-- SCR-029 — Pre-publish listing moderation gate: `PENDING_REVIEW` status.
-- See docs/db/decisions/SCR-029.md. Closes ProgixDev/fethi-mobile#68 (web side).
--
-- ALTER TYPE ... ADD VALUE cannot be used in the same transaction that later
-- reads/writes the new value, so this migration does nothing but add the enum
-- value. Every consumer (repositories, route handlers, admin UI) is plain
-- application code deployed separately from this migration, so there is no
-- same-transaction hazard to work around beyond keeping this file minimal.
alter type public.listing_status add value 'PENDING_REVIEW' after 'DRAFT';
