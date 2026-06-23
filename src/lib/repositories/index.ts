/**
 * Repository aggregate factory.
 *
 * Given a Supabase client (server session client from `../supabase/server`, or
 * the service-role client from `../supabase/admin` for elevated staff ops),
 * returns the admin repositories. Populated as schema lands (WEB-003+):
 *
 *   return {
 *     users: new UsersRepository(db),
 *     listings: new ListingsRepository(db),
 *   } as const;
 *
 * Until then this proves the seam wiring with zero concrete tables.
 */
import type { DbClient } from './base';

export function createRepositories(db: DbClient) {
  // `db` is intentionally unused until the first concrete repository (WEB-003).
  void db;
  return {} as const;
}

export type Repositories = ReturnType<typeof createRepositories>;

export { BaseRepository } from './base';
export type { DbClient } from './base';
