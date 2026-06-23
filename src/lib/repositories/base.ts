/**
 * Repository layer — the data-access boundary for the admin app.
 *
 * A repository owns ALL Supabase table access for one domain area (users,
 * listings, reports, …). Admin pages, Route Handlers, and Server Actions depend
 * on a repository's methods — never on the raw Supabase client or table names.
 * This keeps `src/lib/api.ts` as the stable seam while the backend migrates to
 * Supabase, and means a schema change only ripples through one repository.
 *
 * Concrete repositories arrive with WEB-003, once the schema + generated types
 * exist. Today this establishes the pattern and proves the wiring end to end.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';

/** A Supabase client typed against the shared generated contract. */
export type DbClient = SupabaseClient<Database>;

export abstract class BaseRepository {
  protected readonly db: DbClient;

  constructor(db: DbClient) {
    this.db = db;
  }
}
