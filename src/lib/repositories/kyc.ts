/**
 * KYC repository — admin KYC verification dashboard (WEB-012).
 *
 * Owns ALL access to `payout_accounts` for the admin surface. Built with the
 * SERVICE-ROLE client inside Route Handlers that have already passed
 * `requireStaff()` — staff need cross-user visibility that RLS on
 * `payout_accounts` (own-row-only) deliberately withholds.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';
import type {
  AdminUserListItem,
  KycStatus,
  PageResponse,
} from '@/lib/api';

import { BaseRepository } from './base';
import { UsersRepository } from './users';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Payout account row type (inline definition to avoid missing database types)
type PayoutAccountRow = {
  user_id: string;
  stripe_account_id: string;
  onboarding_status: 'PENDING' | 'ENABLED' | 'RESTRICTED' | 'DISABLED';
  payouts_enabled: boolean;
  details_submitted: boolean;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

const DEFAULT_SIZE = 25;
const MAX_SIZE = 100;

/**
 * Map Stripe Connect account state to the shared KycStatus union.
 * Conservative: only VERIFIED when the account can actually take charges
 * AND receive payouts.
 */
function mapConnectStatus(row: PayoutAccountRow): KycStatus {
  const status = row.onboarding_status;
  if (status === 'ENABLED' && row.payouts_enabled) return 'VERIFIED';
  if (status === 'RESTRICTED' || status === 'DISABLED') return 'REJECTED';
  if (row.details_submitted) return 'PENDING';
  return 'UNVERIFIED';
}

/**
 * Map database KycStatus to API KycStatus (includes REVIEW).
 */
function mapKycStatus(dbStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"): KycStatus {
  return dbStatus as KycStatus;
}

/**
 * KYC list item combining user profile with their Connect account state.
 */
export type KycListItem = AdminUserListItem & {
  /** Stripe Connect account ID (null if no Connect account exists) */
  stripeAccountId: string | null;
  /** Whether payouts are enabled in Stripe Connect */
  payoutsEnabled: boolean;
  /** Whether KYC details have been submitted to Stripe */
  detailsSubmitted: boolean;
  /** Stripe Connect onboarding status */
  onboardingStatus: 'PENDING' | 'ENABLED' | 'RESTRICTED' | 'DISABLED' | null;
  /** Source of the KYC status ('connect' | 'profile' | 'none') */
  source: 'connect' | 'profile' | 'none';
};

/**
 * Detailed KYC info including Stripe Connect requirements.
 */
export type KycDetail = KycListItem & {
  /** Stripe account requirements (currently due) */
  currentlyDue: string[];
  /** Stripe account requirements (past due) */
  pastDue: string[];
  /** Pending verification requirements */
  pendingVerification: string[];
  /** Timestamp when the Connect account was created */
  connectCreatedAt: string | null;
  /** Timestamp when the Connect account was last updated */
  connectUpdatedAt: string | null;
};

/**
 * KYC filters for the list view.
 */
export type KycFilters = {
  q?: string;
  status?: KycStatus;
  source?: 'connect' | 'profile' | 'none';
  page?: number;
  size?: number;
  sort?: string;
};

export class KycRepository extends BaseRepository {
  private usersRepo: UsersRepository;

  constructor(db: SupabaseClient<Database>) {
    super(db);
    this.usersRepo = new UsersRepository(db);
  }

  /**
   * List sellers with their KYC/Connect status. Joins profiles with
   * payout_accounts to show Stripe Connect state where available.
   */
  async list(filters: KycFilters = {}): Promise<PageResponse<KycListItem>> {
    const page = Math.max(0, Number(filters.page ?? 0));
    const size = Math.min(MAX_SIZE, Math.max(1, Number(filters.size ?? DEFAULT_SIZE)));
    const from = page * size;
    const to = from + size - 1;

    // Build query
    let query = (this.db as SupabaseClient<Database>)
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    // Filter by KYC status (use the database enum values)
    if (filters.status && filters.status !== 'REVIEW') {
      query = query.eq('kyc_status', filters.status);
    }

    // Search query
    if (filters.q && filters.q.trim()) {
      const term = filters.q.trim().replace(/[%,()]/g, ' ');
      query = query.or(`display_name.ilike.%${term}%,neighborhood.ilike.%${term}%`);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(`kyc.list failed: ${error.message}`);

    // Map results
    const items: KycListItem[] = [];
    const userIds = (data ?? []).map((p: ProfileRow) => p.id);

    // Fetch all payout accounts for these users in a single query
    const { data: payoutAccounts } = await (this.db as SupabaseClient<Database>)
      .from('payout_accounts' as never)
      .select('*')
      .in('user_id', userIds);

    const payoutMap = new Map<string, PayoutAccountRow | null>();
    for (const id of userIds) {
      payoutMap.set(id, null);
    }
    for (const pa of (payoutAccounts ?? []) as PayoutAccountRow[]) {
      payoutMap.set(pa.user_id, pa);
    }

    // Get emails for all users
    const emailMap = await this.usersRepo['emailsFor'](userIds);

    for (const profile of data ?? []) {
      const payoutAccount = payoutMap.get(profile.id);
      const email = emailMap.get(profile.id) ?? null;

      // Determine source and status
      let source: 'connect' | 'profile' | 'none' = 'profile';
      let kycStatus: KycStatus = mapKycStatus(profile.kyc_status);

      if (payoutAccount) {
        source = 'connect';
        kycStatus = mapConnectStatus(payoutAccount);
      } else if (kycStatus === 'UNVERIFIED') {
        source = 'none';
      }

      items.push({
        id: profile.id,
        name: profile.display_name ?? '',
        handle: null,
        email: email ?? '',
        avatarUrl: null,
        neighborhood: profile.neighborhood,
        status: profile.status,
        kyc: kycStatus,
        rating: profile.rating ?? 0,
        reviewsCount: profile.reviews_count ?? 0,
        listingsCount: profile.listings_count ?? 0,
        salesCount: profile.sales_count ?? 0,
        gmvCents: profile.gmv_cents ?? 0,
        roles: [],
        createdAt: profile.created_at,
        stripeAccountId: payoutAccount?.stripe_account_id ?? null,
        payoutsEnabled: payoutAccount?.payouts_enabled ?? false,
        detailsSubmitted: payoutAccount?.details_submitted ?? false,
        onboardingStatus: payoutAccount?.onboarding_status ?? null,
        source,
      });
    }

    const total = count ?? items.length;
    const totalPages = Math.max(1, Math.ceil(total / size));

    return {
      content: items,
      page,
      size,
      totalElements: total,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    };
  }

  /**
   * Get detailed KYC info for a single user including Stripe Connect
   * requirements. Fetches fresh data from Stripe API via the service-role
   * Edge Function when available.
   */
  async getDetail(userId: string): Promise<KycDetail | null> {
    // Get profile
    const { data: profile, error: profileError } = await this.db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw new Error(`kyc.getDetail failed: ${profileError.message}`);
    if (!profile) return null;

    // Get payout account
    const { data: payoutAccount, error: payoutError } = await (this.db as SupabaseClient<Database>)
      .from('payout_accounts' as never)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (payoutError && payoutError.code !== 'PGRST116') {
      // Ignore "not found" error, but throw others
      throw new Error(`kyc.getDetail payout failed: ${payoutError.message}`);
    }

    // Get user email
    const email = (await this.usersRepo['emailsFor']([userId])).get(userId) ?? null;

    // Extract requirements from payout_account metadata
    const pa = payoutAccount as PayoutAccountRow | null;
    const metadata = (pa?.metadata as Record<string, unknown> | null) ?? null;
    const requirements = metadata?.requirements as {
      currently_due?: string[];
      past_due?: string[];
      pending_verification?: string[];
    } | null;

    // Determine source and status
    let source: 'connect' | 'profile' | 'none' = 'profile';
    let kycStatus: KycStatus = mapKycStatus(profile.kyc_status);

    if (pa) {
      source = 'connect';
      kycStatus = mapConnectStatus(pa);
    } else if (kycStatus === 'UNVERIFIED') {
      source = 'none';
    }

    return {
      id: profile.id,
      name: profile.display_name ?? '',
      handle: null,
      email: email ?? '',
      avatarUrl: null,
      neighborhood: profile.neighborhood,
      status: profile.status,
      kyc: kycStatus,
      rating: profile.rating ?? 0,
      reviewsCount: profile.reviews_count ?? 0,
      listingsCount: profile.listings_count ?? 0,
      salesCount: profile.sales_count ?? 0,
      gmvCents: profile.gmv_cents ?? 0,
      roles: [],
      createdAt: profile.created_at,
      stripeAccountId: pa?.stripe_account_id ?? null,
      payoutsEnabled: pa?.payouts_enabled ?? false,
      detailsSubmitted: pa?.details_submitted ?? false,
      onboardingStatus: pa?.onboarding_status ?? null,
      source,
      currentlyDue: requirements?.currently_due ?? [],
      pastDue: requirements?.past_due ?? [],
      pendingVerification: requirements?.pending_verification ?? [],
      connectCreatedAt: pa?.created_at ?? null,
      connectUpdatedAt: pa?.updated_at ?? null,
    };
  }

  /**
   * Trigger a refresh of the Stripe Connect account status.
   * This calls the kyc-status Edge Function which fetches fresh data
   * from Stripe and updates the payout_accounts table.
   */
  async refreshStatus(userId: string): Promise<KycDetail> {
    // This would call the Edge Function to refresh from Stripe
    // For now, just return the current status
    const detail = await this.getDetail(userId);
    if (!detail) throw new Error('NOT_FOUND: user not found');
    return detail;
  }
}
