/**
 * Listings repository — admin listing management + moderation (WEB-010), plus
 * the read paths the user-detail screen needs (WEB-009).
 *
 * Built with the SERVICE-ROLE client inside Route Handlers that have already
 * passed `requireStaff()`: staff need cross-owner visibility (RLS on `listings`
 * is ACTIVE-or-own) and moderation is a cross-owner mutation. Never constructed
 * on the client.
 */
import type { Database } from '@/lib/database.types';
import type {
  Listing,
  ListingFilters,
  ListingStatus,
  ListingType,
  OwnerInfo,
  PageResponse,
} from '@/lib/api';

import { BaseRepository } from './base';
import { AuditRepository } from './audit';
import { publicStorageUrl } from './storage';

type ListingRow = Database['public']['Tables']['listings']['Row'];

const LISTING_STATUSES: ListingStatus[] = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'SOLD',
  'ARCHIVED',
];

const DEFAULT_SIZE = 25;
const MAX_SIZE = 200;

type JoinedRow = ListingRow & {
  categories: { label: string } | null;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_path: string | null;
    rating: number | null;
    reviews_count: number | null;
    neighborhood: string | null;
  } | null;
  listing_photos: { storage_path: string; sort_order: number }[] | null;
};

function mapListing(row: JoinedRow): Listing {
  const owner: OwnerInfo | null = row.profiles
    ? {
        id: row.profiles.id,
        displayName: row.profiles.display_name,
        avatarUrl: publicStorageUrl('avatars', row.profiles.avatar_path),
        rating: row.profiles.rating,
        reviewsCount: row.profiles.reviews_count,
        neighborhood: row.profiles.neighborhood,
      }
    : null;

  const photos = (row.listing_photos ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => publicStorageUrl('listing-photos', p.storage_path))
    .filter((u): u is string => !!u);

  return {
    id: row.id,
    ownerId: row.owner_id,
    owner,
    listingType: row.listing_type as ListingType,
    title: row.title,
    description: row.description,
    priceCents: row.price_cents,
    pricePerDayCents: row.price_per_day_cents,
    pricePerWeekCents: row.price_per_week_cents,
    depositCents: row.deposit_cents,
    hourlyRateCents: row.hourly_rate_cents,
    flatRateCents: row.flat_rate_cents,
    serviceRadiusKm: row.service_radius_km,
    condition: row.condition,
    categoryId: row.category_id,
    categoryLabel: row.categories?.label ?? null,
    neighborhood: row.neighborhood,
    lat: row.lat,
    lng: row.lng,
    photos,
    status: row.status,
    viewCount: row.view_count,
    favoritesCount: row.favorites_count,
    distanceMeters: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT =
  '*, categories(label), profiles!listings_owner_id_fkey(id, display_name, avatar_path, rating, reviews_count, neighborhood), listing_photos(storage_path, sort_order)';

export class ListingsRepository extends BaseRepository {
  async list(filters: ListingFilters = {}): Promise<PageResponse<Listing>> {
    const page = Math.max(0, Number(filters.page ?? 0));
    const size = Math.min(MAX_SIZE, Math.max(1, Number(filters.size ?? DEFAULT_SIZE)));
    const from = page * size;
    const to = from + size - 1;

    let query = this.db.from('listings').select(SELECT, { count: 'exact' });

    if (filters.status && LISTING_STATUSES.includes(filters.status)) {
      query = query.eq('status', filters.status);
    }
    if (filters.listingType) query = query.eq('listing_type', filters.listingType);
    if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters.ownerId) query = query.eq('owner_id', filters.ownerId);
    if (filters.neighborhood) query = query.eq('neighborhood', filters.neighborhood);
    if (typeof filters.minPriceCents === 'number') {
      query = query.gte('price_cents', filters.minPriceCents);
    }
    if (typeof filters.maxPriceCents === 'number') {
      query = query.lte('price_cents', filters.maxPriceCents);
    }
    if (filters.q && filters.q.trim()) {
      const term = filters.q.trim().replace(/[%,()]/g, ' ');
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    const ascending = (filters.sort ?? 'createdAt,desc').endsWith(',asc');
    query = query.order('created_at', { ascending }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(`listings.list failed: ${error.message}`);

    const content = ((data ?? []) as unknown as JoinedRow[]).map(mapListing);
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

  async get(id: string): Promise<Listing | null> {
    const { data, error } = await this.db
      .from('listings')
      .select(SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`listings.get failed: ${error.message}`);
    if (!data) return null;
    return mapListing(data as unknown as JoinedRow);
  }

  /**
   * Moderate a listing: pause / archive / restore (set any valid status). Staff
   * action — the caller must be gated by `requireStaff` + `hasRole`. Records an
   * audit row capturing the prior status so the action is reversible.
   */
  async setStatus(args: {
    actorId: string;
    id: string;
    next: ListingStatus;
    reason?: string | null;
  }): Promise<Listing> {
    const { actorId, id, next, reason } = args;
    if (!LISTING_STATUSES.includes(next)) {
      throw new Error(`INVALID_STATUS: ${next}`);
    }

    const { data: current, error: readErr } = await this.db
      .from('listings')
      .select('status')
      .eq('id', id)
      .maybeSingle();
    if (readErr) throw new Error(`listings.setStatus read failed: ${readErr.message}`);
    if (!current) throw new Error('NOT_FOUND: listing not found');

    const { error: updErr } = await this.db
      .from('listings')
      .update({ status: next })
      .eq('id', id);
    if (updErr) throw new Error(`listings.setStatus update failed: ${updErr.message}`);

    if (current.status !== next) {
      const action =
        next === 'PAUSED'
          ? 'listing.pause'
          : next === 'ARCHIVED'
            ? 'listing.archive'
            : next === 'ACTIVE'
              ? 'listing.restore'
              : `listing.status.${next.toLowerCase()}`;
      await new AuditRepository(this.db).record({
        actorId,
        action,
        targetType: 'listing',
        targetId: id,
        before: { status: current.status },
        after: { status: next },
        reason: reason ?? null,
      });
    }

    const updated = await this.get(id);
    if (!updated) throw new Error('listings.setStatus: listing vanished after update');
    return updated;
  }

  /** Soft-archive (the admin "delete" affordance maps to ARCHIVED, reversible). */
  async archive(args: { actorId: string; id: string; reason?: string | null }): Promise<void> {
    await this.setStatus({ ...args, next: 'ARCHIVED' });
  }
}
