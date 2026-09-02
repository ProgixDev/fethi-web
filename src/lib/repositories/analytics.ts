/**
 * Analytics repository (WEB-014) — read-only server-side aggregations for the
 * admin analytics dashboards (users, listings, marketplace, engagement, geo,
 * reports).
 *
 * Service-role ONLY: aggregations span ALL users' rows, which RLS on
 * `profiles`/`listings`/`orders`/… deliberately withholds from the browser. The
 * repository is constructed with the service-role client inside the analytics
 * Route Handlers (after `gateStaff()`); service-role keys NEVER reach the
 * client. Every method is read-only — no INSERT/UPDATE/DELETE, no schema change.
 *
 * Date ranges: callers pass an optional `{ from, to }` (ISO date strings,
 * inclusive). When present, counts/trends are scoped to `created_at` within the
 * range; the trend bucket is per-day (UTC). Empty ranges yield zeros/empty
 * arrays rather than throwing.
 *
 * NOTE(WEB-008): the `reviews` table is not shipped yet, so any review metric is
 * sourced from the denormalised `profiles.rating` / `profiles.reviews_count`
 * columns (a coarse but real signal) — we never query a `reviews` table.
 */
import type { Database } from '@/lib/database.types';
import type {
  AnalyticsRange,
  CitySummary,
  DistItem,
  EngagementSummary,
  GeoSummary,
  ListingsSummary,
  MarketplaceSummary,
  ReportsAnalyticsSummary,
  TrendPoint,
  UsersSummary,
} from '@/lib/api';

import { BaseRepository } from './base';

type UserStatus = Database['public']['Enums']['user_status'];
type KycStatus = Database['public']['Enums']['kyc_status'];
type ListingStatus = Database['public']['Enums']['listing_status'];
type ListingType = Database['public']['Enums']['listing_type'];
type OrderStatus = Database['public']['Enums']['order_status'];

const USER_STATUSES: UserStatus[] = ['ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED'];
const KYC_STATUSES: KycStatus[] = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'];
const LISTING_STATUSES: ListingStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'PAUSED',
  'SOLD',
  'ARCHIVED',
];
const LISTING_TYPES: ListingType[] = ['VENTE', 'LOCATION', 'SERVICE'];
const ORDER_STATUSES: OrderStatus[] = [
  'AWAITING_PICKUP',
  'HANDOFF_PENDING',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
  'DISPUTED',
];

const REPORT_STATUSES = ['OPEN', 'REVIEWING', 'ACTIONED', 'DISMISSED'] as const;
const REPORT_TARGET_TYPES = ['LISTING', 'USER', 'THREAD', 'MESSAGE'] as const;

const MAX_TREND_DAYS = 180;

/** Normalise an `{ from, to }` range to inclusive ISO timestamps, or null when
 * the bound is absent. `to` is pushed to the end of its day so the range stays
 * inclusive of rows created at any time on the `to` date. */
function bounds(range: AnalyticsRange | undefined): { fromTs: string | null; toTs: string | null } {
  const fromTs = range?.from ? `${range.from}T00:00:00.000Z` : null;
  const toTs = range?.to ? `${range.to}T23:59:59.999Z` : null;
  return { fromTs, toTs };
}

/** Build the day-bucket scaffold (UTC, inclusive) for a trend, capped so a wild
 * range can't produce an unbounded array. Defaults to the last 30 days. */
function dayScaffold(range: AnalyticsRange | undefined): string[] {
  const end = range?.to ? new Date(`${range.to}T00:00:00.000Z`) : new Date();
  let start: Date;
  if (range?.from) {
    start = new Date(`${range.from}T00:00:00.000Z`);
  } else {
    start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 29);
  }
  const days: string[] = [];
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < MAX_TREND_DAYS) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    guard += 1;
  }
  return days;
}

export class AnalyticsRepository extends BaseRepository {
  // -------------------------------------------------------------------------
  // Shared count helper — a HEAD count with optional created_at range, no rows
  // transferred. Returns 0 on the empty-range / no-match case.
  // -------------------------------------------------------------------------
  private async countRows(
    table: 'profiles' | 'listings' | 'orders' | 'reports' | 'offers' | 'favorites' | 'saved_searches' | 'threads' | 'messages',
    range?: AnalyticsRange,
  ): Promise<number> {
    const { fromTs, toTs } = bounds(range);
    let q = this.db.from(table).select('*', { count: 'exact', head: true });
    if (fromTs) q = q.gte('created_at', fromTs);
    if (toTs) q = q.lte('created_at', toTs);
    const { count, error } = await q;
    if (error) throw new Error(`analytics.count(${table}) failed: ${error.message}`);
    return count ?? 0;
  }

  // -------------------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------------------

  /** Headline user KPIs. Range scopes the new-signup figure (`signupsLast30Days`
   * is kept as a rolling-30d metric regardless of range, for the KPI card). */
  async usersSummary(range?: AnalyticsRange): Promise<UsersSummary> {
    const { data, error } = await this.db
      .from('profiles')
      .select('status, kyc_status, gmv_cents, rating, created_at');
    if (error) throw new Error(`analytics.usersSummary failed: ${error.message}`);
    const rows = data ?? [];

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const { fromTs, toTs } = bounds(range);
    const fromMs = fromTs ? Date.parse(fromTs) : null;
    const toMs = toTs ? Date.parse(toTs) : null;

    let active = 0;
    let pending = 0;
    let suspended = 0;
    let banned = 0;
    let kycVerified = 0;
    let kycPending = 0;
    let gmvTotal = 0;
    let ratingSum = 0;
    let ratingCount = 0;
    let signupsLast30Days = 0;
    let signupsInRange = 0;

    for (const r of rows) {
      if (r.status === 'ACTIVE') active += 1;
      else if (r.status === 'PENDING') pending += 1;
      else if (r.status === 'SUSPENDED') suspended += 1;
      else if (r.status === 'BANNED') banned += 1;
      if (r.kyc_status === 'VERIFIED') kycVerified += 1;
      else if (r.kyc_status === 'PENDING') kycPending += 1;
      gmvTotal += r.gmv_cents ?? 0;
      if (r.rating != null) {
        ratingSum += r.rating;
        ratingCount += 1;
      }
      const created = Date.parse(r.created_at);
      if (created >= thirtyDaysAgo) signupsLast30Days += 1;
      if ((fromMs == null || created >= fromMs) && (toMs == null || created <= toMs)) {
        signupsInRange += 1;
      }
    }

    return {
      total: rows.length,
      active,
      pending,
      suspended,
      banned,
      kycVerified,
      kycPending,
      signupsLast30Days,
      signupsInRange,
      totalGmvCents: gmvTotal,
      averageRating: ratingCount > 0 ? ratingSum / ratingCount : 0,
    };
  }

  /** Distribution of users by account status (range-scoped on signup date). */
  async usersByStatus(range?: AnalyticsRange): Promise<DistItem[]> {
    const counts = await this.distinctCounts('profiles', 'status', range);
    return USER_STATUSES.map((s) => ({ label: s, count: counts.get(s) ?? 0 }));
  }

  /** Distribution of users by KYC status (range-scoped on signup date). */
  async usersByKyc(range?: AnalyticsRange): Promise<DistItem[]> {
    const counts = await this.distinctCounts('profiles', 'kyc_status', range);
    return KYC_STATUSES.map((s) => ({ label: s, count: counts.get(s) ?? 0 }));
  }

  /** Top neighborhoods by user count (range-scoped on signup date). */
  async usersByNeighborhood(range?: AnalyticsRange): Promise<DistItem[]> {
    const { fromTs, toTs } = bounds(range);
    let q = this.db.from('profiles').select('neighborhood').not('neighborhood', 'is', null);
    if (fromTs) q = q.gte('created_at', fromTs);
    if (toTs) q = q.lte('created_at', toTs);
    const { data, error } = await q;
    if (error) throw new Error(`analytics.usersByNeighborhood failed: ${error.message}`);
    const counts = new Map<string, number>();
    for (const r of data ?? []) {
      const k = r.neighborhood;
      if (!k) continue;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }

  /** Per-day signup trend across the range (defaults to the last 30 days). */
  async signupsTrend(range?: AnalyticsRange): Promise<TrendPoint[]> {
    return this.dailyTrend('profiles', range);
  }

  // -------------------------------------------------------------------------
  // LISTINGS
  // -------------------------------------------------------------------------

  async listingsSummary(range?: AnalyticsRange): Promise<ListingsSummary> {
    const { fromTs, toTs } = bounds(range);
    let q = this.db
      .from('listings')
      .select('listing_type, status, category_id, view_count, favorites_count, created_at, categories(label)');
    if (fromTs) q = q.gte('created_at', fromTs);
    if (toTs) q = q.lte('created_at', toTs);
    const { data, error } = await q;
    if (error) throw new Error(`analytics.listingsSummary failed: ${error.message}`);
    const rows = (data ?? []) as Array<{
      listing_type: ListingType;
      status: ListingStatus;
      category_id: string | null;
      view_count: number | null;
      favorites_count: number | null;
      categories: { label: string } | null;
    }>;

    const byType: Record<ListingType, number> = { VENTE: 0, LOCATION: 0, SERVICE: 0 };
    const byStatus: Record<ListingStatus, number> = {
      DRAFT: 0,
      PENDING_REVIEW: 0,
      ACTIVE: 0,
      PAUSED: 0,
      SOLD: 0,
      ARCHIVED: 0,
    };
    const categoryCounts = new Map<string, number>();
    let totalViews = 0;
    let totalFavorites = 0;

    for (const r of rows) {
      if (LISTING_TYPES.includes(r.listing_type)) byType[r.listing_type] += 1;
      if (LISTING_STATUSES.includes(r.status)) byStatus[r.status] += 1;
      const label = r.categories?.label ?? '—';
      categoryCounts.set(label, (categoryCounts.get(label) ?? 0) + 1);
      totalViews += r.view_count ?? 0;
      totalFavorites += r.favorites_count ?? 0;
    }

    const topCategories: DistItem[] = [...categoryCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: rows.length,
      byType: LISTING_TYPES.map((t) => ({ label: t, count: byType[t] })),
      byStatus: LISTING_STATUSES.map((s) => ({ label: s, count: byStatus[s] })),
      topCategories,
      totalViews,
      totalFavorites,
    };
  }

  // -------------------------------------------------------------------------
  // MARKETPLACE
  // -------------------------------------------------------------------------

  async marketplaceSummary(range?: AnalyticsRange): Promise<MarketplaceSummary> {
    const { fromTs, toTs } = bounds(range);
    let q = this.db.from('orders').select('status, amount_cents, fee_cents, created_at');
    if (fromTs) q = q.gte('created_at', fromTs);
    if (toTs) q = q.lte('created_at', toTs);
    const { data, error } = await q;
    if (error) throw new Error(`analytics.marketplaceSummary failed: ${error.message}`);
    const rows = (data ?? []) as Array<{
      status: OrderStatus;
      amount_cents: number;
      fee_cents: number;
      created_at: string;
    }>;

    const byStatus: Record<OrderStatus, number> = {
      AWAITING_PICKUP: 0,
      HANDOFF_PENDING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
      DISPUTED: 0,
    };
    let gmvCents = 0;
    let feesCents = 0;
    const gmvByDay = new Map<string, number>();

    for (const r of rows) {
      if (ORDER_STATUSES.includes(r.status)) byStatus[r.status] += 1;
      if (r.status === 'COMPLETED') {
        gmvCents += r.amount_cents ?? 0;
        feesCents += r.fee_cents ?? 0;
        const day = r.created_at.slice(0, 10);
        gmvByDay.set(day, (gmvByDay.get(day) ?? 0) + (r.amount_cents ?? 0));
      }
    }

    // Headline platform totals (range-independent) for the marketplace KPIs.
    const [totalUsers, activeUsers, totalListings] = await Promise.all([
      this.countRows('profiles'),
      this.countActiveUsers(),
      this.countRows('listings'),
    ]);

    const scaffold = dayScaffold(range);
    const gmvTrend: TrendPoint[] = scaffold.map((date) => ({
      date,
      count: gmvByDay.get(date) ?? 0,
    }));

    return {
      totalUsers,
      activeUsers,
      totalListings,
      totalOrders: rows.length,
      completedOrders: byStatus.COMPLETED,
      gmvCents,
      feesCents,
      ordersByStatus: ORDER_STATUSES.map((s) => ({ label: s, count: byStatus[s] })),
      gmvTrend,
    };
  }

  // -------------------------------------------------------------------------
  // ENGAGEMENT
  // -------------------------------------------------------------------------

  async engagementSummary(range?: AnalyticsRange): Promise<EngagementSummary> {
    const [messages, threads, offers, favorites, savedSearches, signups] = await Promise.all([
      this.countRows('messages', range),
      this.countRows('threads', range),
      this.countRows('offers', range),
      this.countRows('favorites', range),
      this.countRows('saved_searches', range),
      this.signupsTrend(range),
    ]);
    const messagesTrend = await this.dailyTrend('messages', range);
    return {
      messages,
      threads,
      offers,
      favorites,
      savedSearches,
      signupsTrend: signups,
      messagesTrend,
    };
  }

  // -------------------------------------------------------------------------
  // GEO
  // -------------------------------------------------------------------------

  async geoSummary(range?: AnalyticsRange): Promise<GeoSummary> {
    const { fromTs, toTs } = bounds(range);
    let lq = this.db.from('listings').select('neighborhood').not('neighborhood', 'is', null);
    if (fromTs) lq = lq.gte('created_at', fromTs);
    if (toTs) lq = lq.lte('created_at', toTs);
    const [usersByNeighborhood, { data: listingRows, error }] = await Promise.all([
      this.usersByNeighborhood(range),
      lq,
    ]);
    if (error) throw new Error(`analytics.geoSummary failed: ${error.message}`);
    const listingCounts = new Map<string, number>();
    for (const r of listingRows ?? []) {
      const k = r.neighborhood;
      if (!k) continue;
      listingCounts.set(k, (listingCounts.get(k) ?? 0) + 1);
    }
    const listingsByNeighborhood: DistItem[] = [...listingCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
    return { usersByNeighborhood, listingsByNeighborhood };
  }

  // -------------------------------------------------------------------------
  // CITIES
  // -------------------------------------------------------------------------

  /**
   * Cities MyStreet actually has signups in, grouped from real
   * `profiles.city` / `profiles.neighborhood` values — there is no `cities`
   * table. Any city not represented in `profiles` (roadmap/expansion cities)
   * simply doesn't appear here; the page renders those as a separate static
   * roadmap, not live data.
   */
  async citiesSummary(): Promise<CitySummary[]> {
    const { data, error } = await this.db
      .from('profiles')
      .select('city, neighborhood')
      .not('city', 'is', null);
    if (error) throw new Error(`analytics.citiesSummary failed: ${error.message}`);

    const byCity = new Map<string, { users: number; neighborhoods: Set<string> }>();
    for (const r of data ?? []) {
      const city = r.city;
      if (!city) continue;
      const entry = byCity.get(city) ?? { users: 0, neighborhoods: new Set<string>() };
      entry.users += 1;
      if (r.neighborhood) entry.neighborhoods.add(r.neighborhood);
      byCity.set(city, entry);
    }

    return [...byCity.entries()]
      .map(([name, v]) => ({ name, neighborhoods: v.neighborhoods.size, users: v.users }))
      .sort((a, b) => b.users - a.users);
  }

  // -------------------------------------------------------------------------
  // REPORTS
  // -------------------------------------------------------------------------

  async reportsSummary(range?: AnalyticsRange): Promise<ReportsAnalyticsSummary> {
    const { fromTs, toTs } = bounds(range);
    let q = this.db.from('reports').select('status, target_type, created_at');
    if (fromTs) q = q.gte('created_at', fromTs);
    if (toTs) q = q.lte('created_at', toTs);
    const { data, error } = await q;
    if (error) throw new Error(`analytics.reportsSummary failed: ${error.message}`);
    const rows = data ?? [];

    const statusCounts = new Map<string, number>();
    const targetCounts = new Map<string, number>();
    const byDay = new Map<string, number>();
    for (const r of rows) {
      statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
      targetCounts.set(r.target_type, (targetCounts.get(r.target_type) ?? 0) + 1);
      const day = r.created_at.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }

    const scaffold = dayScaffold(range);
    const trend: TrendPoint[] = scaffold.map((date) => ({ date, count: byDay.get(date) ?? 0 }));

    return {
      total: rows.length,
      open: statusCounts.get('OPEN') ?? 0,
      byStatus: REPORT_STATUSES.map((s) => ({ label: s, count: statusCounts.get(s) ?? 0 })),
      byTargetType: REPORT_TARGET_TYPES.map((t) => ({ label: t, count: targetCounts.get(t) ?? 0 })),
      trend,
    };
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /** Count occurrences of each value of a single enum-ish column, range-scoped
   * on `created_at`. Pulls only the one column (no `*`), aggregates in memory. */
  private async distinctCounts(
    table: 'profiles',
    column: 'status' | 'kyc_status',
    range?: AnalyticsRange,
  ): Promise<Map<string, number>> {
    const { fromTs, toTs } = bounds(range);
    let q = this.db.from(table).select(column);
    if (fromTs) q = q.gte('created_at', fromTs);
    if (toTs) q = q.lte('created_at', toTs);
    const { data, error } = await q;
    if (error) throw new Error(`analytics.distinctCounts(${table}.${column}) failed: ${error.message}`);
    const counts = new Map<string, number>();
    for (const r of (data ?? []) as Array<Record<string, string>>) {
      const v = r[column];
      if (v == null) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return counts;
  }

  /** Generic per-day `created_at` trend over the scaffolded range. */
  private async dailyTrend(
    table: 'profiles' | 'messages',
    range?: AnalyticsRange,
  ): Promise<TrendPoint[]> {
    const { fromTs, toTs } = bounds(range);
    // When no explicit range, scope to the scaffold window (last 30d) so we don't
    // scan all-time rows just to bucket the recent ones.
    const scaffold = dayScaffold(range);
    const windowFrom = fromTs ?? `${scaffold[0]}T00:00:00.000Z`;
    const windowTo = toTs ?? `${scaffold[scaffold.length - 1]}T23:59:59.999Z`;
    const { data, error } = await this.db
      .from(table)
      .select('created_at')
      .gte('created_at', windowFrom)
      .lte('created_at', windowTo);
    if (error) throw new Error(`analytics.dailyTrend(${table}) failed: ${error.message}`);
    const byDay = new Map<string, number>();
    for (const r of data ?? []) {
      const day = (r.created_at as string).slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    return scaffold.map((date) => ({ date, count: byDay.get(date) ?? 0 }));
  }

  /** Active-user count (status = ACTIVE), range-independent. */
  private async countActiveUsers(): Promise<number> {
    const { count, error } = await this.db
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE');
    if (error) throw new Error(`analytics.countActiveUsers failed: ${error.message}`);
    return count ?? 0;
  }
}
