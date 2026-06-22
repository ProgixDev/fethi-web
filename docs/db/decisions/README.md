# Schema Change Requests (SCRs)

Every change to the shared Supabase database — schema, RLS, enums, or Edge
Function contracts — gets a numbered SCR here **before** the migration is
written. This is the coordination gate between `fethi-web` (DB owner) and
`fethi-mobile` (consumer). See `../COORDINATION.md` for the full protocol.

## How to add one

1. Copy `../SCR-TEMPLATE.md` to `SCR-NNN.md` (next free number).
2. Fill it in — especially **RLS intent** and **Affected consumers**.
3. Get the DB reviewer to approve (status → `Accepted`).
4. Author the migration, regenerate types, update both sync notes, merge as one PR.
5. Unblock the consuming board tasks.

## Index

| SCR | Title | Status | Unblocks |
| --- | --- | --- | --- |
| SCR-000 | Coordination protocol bootstrap (example) | Accepted | — |

> Keep this index current — one row per SCR.
