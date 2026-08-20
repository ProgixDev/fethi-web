/**
 * Messages repository (admin) — per-user conversation list over `threads` /
 * `messages` (SCR-003).
 *
 * Service-role ONLY: `threads`/`messages` RLS scopes rows to the buyer/seller
 * participants (`is_thread_participant`), which deliberately withholds
 * cross-user visibility from the browser. Staff need to see a user's threads
 * regardless of role, so this reads via the service-role client inside the
 * admin Route Handler (after `gateStaff()`). Read-only — there is no admin
 * write path onto `messages`/`threads`.
 */
import type { AdminThread } from '@/lib/api';

import { BaseRepository } from './base';

type ThreadRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_unread: number;
  seller_unread: number;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  listings: { title: string } | null;
  buyer: { display_name: string | null } | null;
  seller: { display_name: string | null } | null;
};

export class MessagesRepository extends BaseRepository {
  /** Every thread where `userId` is buyer or seller, most recent activity
   * first. */
  async threadsForUser(userId: string): Promise<AdminThread[]> {
    const { data, error } = await this.db
      .from('threads')
      .select(
        `id, listing_id, buyer_id, seller_id, buyer_unread, seller_unread,
         last_message, last_message_at, created_at,
         listings(title),
         buyer:profiles!threads_buyer_id_fkey(display_name),
         seller:profiles!threads_seller_id_fkey(display_name)`,
      )
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error) throw new Error(`messages.threadsForUser failed: ${error.message}`);

    return ((data ?? []) as unknown as ThreadRow[]).map((r) => {
      const isBuyer = r.buyer_id === userId;
      const other = isBuyer ? r.seller : r.buyer;
      return {
        id: r.id,
        listingId: r.listing_id,
        listingTitle: r.listings?.title ?? null,
        role: isBuyer ? 'buyer' : 'seller',
        otherPartyId: isBuyer ? r.seller_id : r.buyer_id,
        otherPartyName: other?.display_name ?? 'Voisin·e',
        lastMessage: r.last_message,
        lastMessageAt: r.last_message_at,
        unreadCount: isBuyer ? r.buyer_unread : r.seller_unread,
        createdAt: r.created_at,
      };
    });
  }
}
