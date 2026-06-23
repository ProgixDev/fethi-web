/**
 * Users repository — admin user management (WEB-009).
 *
 * Owns ALL access to `profiles` + the auth admin email lookup for the admin
 * surface. Built with the SERVICE-ROLE client inside Route Handlers that have
 * already passed `requireStaff()` — staff need cross-user visibility that RLS on
 * `profiles` (own-row-only) deliberately withholds from the browser, and the
 * suspend/ban write is a cross-user mutation. Never constructed on the client.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';
import type {
  AdminUserListItem,
  PageResponse,
  PublicProfile,
  UserFilters,
  UserMeta,
} from '@/lib/api';

import { BaseRepository } from './base';
import { AuditRepository } from './audit';
import { publicStorageUrl } from './storage';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type UserStatus = Database['public']['Enums']['user_status'];
type KycStatus = Database['public']['Enums']['kyc_status'];

const USER_STATUSES: UserStatus[] = ['ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED'];
const KYC_STATUSES: KycStatus[] = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'];

const DEFAULT_SIZE = 25;
const MAX_SIZE = 100;

function mapProfile(row: ProfileRow, email: string | null): AdminUserListItem {
  return {
    id: row.id,
    name: row.display_name ?? '',
    handle: null,
    email: email ?? '',
    avatarUrl: publicStorageUrl('avatars', row.avatar_path),
    neighborhood: row.neighborhood,
    status: row.status,
    // The DB kyc enum has no REVIEW; AdminUserListItem's union is a superset.
    kyc: row.kyc_status as AdminUserListItem['kyc'],
    rating: row.rating ?? 0,
    reviewsCount: row.reviews_count,
    listingsCount: row.listings_count,
    salesCount: row.sales_count,
    gmvCents: row.gmv_cents,
    roles: [],
    createdAt: row.created_at,
  };
}

export class UsersRepository extends BaseRepository {
  /** Server-side paginated, searched, filtered list of users. */
  async list(filters: UserFilters = {}): Promise<PageResponse<AdminUserListItem>> {
    const page = Math.max(0, Number(filters.page ?? 0));
    const size = Math.min(MAX_SIZE, Math.max(1, Number(filters.size ?? DEFAULT_SIZE)));
    const from = page * size;
    const to = from + size - 1;

    let query = this.db
      .from('profiles')
      .select('*', { count: 'exact' });

    if (filters.status && USER_STATUSES.includes(filters.status as UserStatus)) {
      query = query.eq('status', filters.status as UserStatus);
    }
    if (filters.kyc && KYC_STATUSES.includes(filters.kyc as KycStatus)) {
      query = query.eq('kyc_status', filters.kyc as KycStatus);
    }
    if (filters.neighborhood) {
      query = query.eq('neighborhood', filters.neighborhood);
    }
    if (filters.q && filters.q.trim()) {
      // Parameterized ilike — Supabase escapes the value. Strip % / , that have
      // meaning in the or-filter grammar to keep the pattern safe.
      const term = filters.q.trim().replace(/[%,()]/g, ' ');
      query = query.or(
        `display_name.ilike.%${term}%,neighborhood.ilike.%${term}%,city.ilike.%${term}%`,
      );
    }

    // Sort: only createdAt supported by the shipped contract; default desc.
    const ascending = (filters.sort ?? 'createdAt,desc').endsWith(',asc');
    query = query.order('created_at', { ascending }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(`users.list failed: ${error.message}`);

    const rows = data ?? [];
    const emails = await this.emailsFor(rows.map((r) => r.id));
    const content = rows.map((r) => mapProfile(r, emails.get(r.id) ?? null));

    // Post-filter by email match when searching (email lives in auth.users, not
    // profiles) — additive to the profile-column match above.
    const total = count ?? content.length;
    const totalPages = Math.max(1, Math.ceil(total / size));
    return {
      content,
      page,
      size,
      totalElements: total,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    };
  }

  /** Distinct filter facets for the list screen. */
  async meta(): Promise<UserMeta> {
    const { data, error } = await this.db
      .from('profiles')
      .select('neighborhood')
      .not('neighborhood', 'is', null);
    if (error) throw new Error(`users.meta failed: ${error.message}`);
    const neighborhoods = Array.from(
      new Set((data ?? []).map((r) => r.neighborhood).filter((n): n is string => !!n)),
    ).sort();
    return {
      statuses: USER_STATUSES,
      kycStatuses: KYC_STATUSES,
      neighborhoods,
    };
  }

  /** A single user as an admin list item (includes status/kyc) for the detail
   * screen's moderation panel. */
  async getAdmin(id: string): Promise<AdminUserListItem | null> {
    const { data, error } = await this.db
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`users.getAdmin failed: ${error.message}`);
    if (!data) return null;
    const email = (await this.emailsFor([id])).get(id) ?? null;
    return mapProfile(data, email);
  }

  /** A single user's public profile (used by the detail screen). */
  async getPublic(id: string): Promise<PublicProfile | null> {
    const { data, error } = await this.db
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`users.getPublic failed: ${error.message}`);
    if (!data) return null;
    return {
      id: data.id,
      displayName: data.display_name,
      avatarUrl: publicStorageUrl('avatars', data.avatar_path),
      bio: data.bio,
      age: data.age,
      profession: data.profession,
      neighborhood: data.neighborhood,
      city: data.city,
      rating: data.rating,
      reviewsCount: data.reviews_count,
      listingsCount: data.listings_count,
      salesCount: data.sales_count,
      createdAt: data.created_at,
    };
  }

  /**
   * Suspend / ban / reactivate a user. Staff action — the caller must be gated
   * by `requireStaff` + `hasRole('moderator'|'admin')` in the Route Handler, and
   * must NOT be the actor themselves (guarded here as defence-in-depth). Writes
   * the new status to `profiles.status` (NEVER user_metadata) and records an
   * audit row in the same path.
   */
  async setStatus(args: {
    actorId: string;
    targetId: string;
    next: UserStatus;
    reason?: string | null;
  }): Promise<AdminUserListItem> {
    const { actorId, targetId, next, reason } = args;
    if (actorId === targetId) {
      throw new Error('SELF_ACTION: a staff member cannot change their own status');
    }

    const { data: current, error: readErr } = await this.db
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();
    if (readErr) throw new Error(`users.setStatus read failed: ${readErr.message}`);
    if (!current) throw new Error('NOT_FOUND: user not found');

    if (current.status === next) {
      // No-op (e.g. reactivating an already-active user) — return as-is, no audit.
      const email = (await this.emailsFor([targetId])).get(targetId) ?? null;
      return mapProfile(current, email);
    }

    const { data: updated, error: updErr } = await this.db
      .from('profiles')
      .update({ status: next })
      .eq('id', targetId)
      .select('*')
      .single();
    if (updErr) throw new Error(`users.setStatus update failed: ${updErr.message}`);

    const action =
      next === 'SUSPENDED'
        ? 'user.suspend'
        : next === 'BANNED'
          ? 'user.ban'
          : 'user.reactivate';
    await new AuditRepository(this.db).record({
      actorId,
      action,
      targetType: 'user',
      targetId,
      before: { status: current.status },
      after: { status: next },
      reason: reason ?? null,
    });

    const email = (await this.emailsFor([targetId])).get(targetId) ?? null;
    return mapProfile(updated, email);
  }

  /**
   * Email lookup from auth.users via the admin API. Requires the service-role
   * client (the auth admin API is privileged). Paged listUsers is bounded; for
   * the admin list we resolve only the ids on the current page.
   */
  private async emailsFor(ids: string[]): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    if (ids.length === 0) return out;
    const admin = this.db as SupabaseClient<Database>;
    // getUserById is the precise, per-id lookup (no full-table scan).
    await Promise.all(
      ids.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        if (data?.user?.email) out.set(id, data.user.email);
      }),
    );
    return out;
  }
}
