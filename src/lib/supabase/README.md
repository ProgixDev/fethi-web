# Admin Supabase clients + the data-access seam

Three clients, by execution context — pick by **where the code runs** and **whose
access it needs**:

| File | Key | Where | RLS | Use for |
| --- | --- | --- | --- | --- |
| `client.ts` | publishable (`NEXT_PUBLIC_*`) | Client Components | enforced | browser-side, current user's session |
| `server.ts` | publishable (`NEXT_PUBLIC_*`) | Server Components, Route Handlers, Server Actions | enforced | server reads/writes as the signed-in user (cookie session) |
| `admin.ts` | **secret** (`SUPABASE_SECRET_KEY`) | **server only** | **bypassed** | staff/admin elevation (KYC, moderation, finance) |

**Next 16:** `cookies()` is async — `server.ts` is an async factory, always
`await createClient()`.

## The seam

```
admin page / route handler
        │  (never touches the supabase client or table names directly)
        ▼
repository layer  ──────────────►  supabase client (client / server / admin)
 (src/lib/repositories)
        ▲
        └── src/lib/api.ts stays the stable boundary during the migration
```

Screens call repositories (and the legacy `src/lib/api.ts` for not-yet-migrated
areas). Repositories own all table access, so a schema change ripples through one
file. Concrete repositories (`users`, `listings`, …) land with **WEB-003** when
the schema + generated types exist.

## Secret-key safety

`SUPABASE_SECRET_KEY` is read only in `admin.ts` from a non-`NEXT_PUBLIC_*` var,
so it can't be inlined into client JS; `admin.ts` also throws if imported in the
browser. Never re-export it through a client module.
