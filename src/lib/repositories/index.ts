/**
 * Repository aggregate factory.
 *
 * Given a Supabase client (the server session client from `../supabase/server`,
 * or the service-role client from `../supabase/admin` for elevated staff ops),
 * returns the admin repositories. Admin pages, Route Handlers, and Server Actions
 * depend on these methods — never on the raw client or table names — keeping
 * `src/lib/api.ts` as the stable seam.
 *
 * Admin cross-user reads/writes (users list, listing moderation) require the
 * SERVICE-ROLE client because RLS deliberately scopes `profiles`/`listings` to
 * the owner; the Route Handler builds that client only after `requireStaff()`.
 */
import { createAdminClient } from '@/lib/supabase/admin';

import type { DbClient } from './base';
import { AnalyticsRepository } from './analytics';
import { AuditRepository } from './audit';
import { BillingRepository } from './billing';
import { CategoriesRepository } from './categories';
import { KycRepository } from './kyc';
import { ListingsRepository } from './listings';
import { MessagesRepository } from './messages';
import { OrdersRepository } from './orders';
import { ReportsRepository } from './reports';
import { UsersRepository } from './users';

export function createRepositories(db: DbClient) {
  return {
    users: new UsersRepository(db),
    listings: new ListingsRepository(db),
    reports: new ReportsRepository(db),
    analytics: new AnalyticsRepository(db),
    audit: new AuditRepository(db),
    kyc: new KycRepository(db),
    orders: new OrdersRepository(db),
    categories: new CategoriesRepository(db),
    messages: new MessagesRepository(db),
    billing: new BillingRepository(db),
  } as const;
}

/**
 * Repositories backed by the service-role client — SERVER ONLY, and only after a
 * staff guard. Use inside admin Route Handlers that have called `requireStaff()`.
 */
export function createAdminRepositories() {
  return createRepositories(createAdminClient() as unknown as DbClient);
}

export type Repositories = ReturnType<typeof createRepositories>;

export { BaseRepository } from './base';
export { AnalyticsRepository } from './analytics';
export { AuditRepository } from './audit';
export { BillingRepository } from './billing';
export { CategoriesRepository } from './categories';
export { KycRepository } from './kyc';
export { ListingsRepository } from './listings';
export { MessagesRepository } from './messages';
export { OrdersRepository } from './orders';
export { ReportsRepository } from './reports';
export { UsersRepository } from './users';
export type { DbClient } from './base';
export type { KycListItem, KycDetail, KycFilters } from './kyc';
