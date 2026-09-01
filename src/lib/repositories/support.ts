/**
 * Support inbox repository (WEB-022) — staff queue over `support_tickets` /
 * `support_ticket_messages` (SCR-028).
 *
 * Service-role ONLY: SCR-028 gives `support_tickets` no client `UPDATE`
 * policy for staff (staff read/write goes through here, gated by
 * `gateStaff('support')` in the Route Handler), and admin needs cross-user
 * visibility RLS deliberately withholds from a plain user session. Replies
 * insert into `support_ticket_messages`; the DB trigger
 * (`sync_ticket_on_message`) maintains the parent ticket's
 * `last_message*`/unread counters/`status` — this repository never hand-rolls
 * that.
 */
import type {
  SupportTicket,
  SupportTicketFilters,
  SupportTicketMessage,
  SupportTicketStatus,
  PageResponse,
} from '@/lib/api';
import type { Database } from '@/lib/database.types';

import { BaseRepository } from './base';

type TicketRow = Database['public']['Tables']['support_tickets']['Row'] & {
  user: { display_name: string | null } | null;
};
type MessageRow = Database['public']['Tables']['support_ticket_messages']['Row'];

const DEFAULT_SIZE = 25;
const MAX_SIZE = 100;

const STATUSES: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const TICKET_SELECT =
  'id, user_id, subject, status, last_message, last_message_at, last_sender_role, ' +
  'unread_by_user, unread_by_staff, created_at, updated_at, ' +
  'user:profiles!support_tickets_user_id_fkey(display_name)';

function mapTicket(row: TicketRow): SupportTicket {
  return {
    id: row.id,
    userId: row.user_id,
    requesterName: row.user?.display_name ?? 'Utilisateur',
    subject: row.subject,
    status: row.status as SupportTicketStatus,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    lastSenderRole: row.last_sender_role as SupportTicketMessage['senderRole'] | null,
    unreadByStaff: row.unread_by_staff,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: MessageRow): SupportTicketMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    senderId: row.sender_id,
    senderRole: row.sender_role as SupportTicketMessage['senderRole'],
    body: row.body,
    createdAt: row.created_at,
  };
}

export class SupportRepository extends BaseRepository {
  /** Staff-gated, paginated ticket queue — most recently active first. */
  async list(filters: SupportTicketFilters = {}): Promise<PageResponse<SupportTicket>> {
    const page = Math.max(0, Number(filters.page ?? 0));
    const size = Math.min(MAX_SIZE, Math.max(1, Number(filters.size ?? DEFAULT_SIZE)));
    const from = page * size;
    const to = from + size - 1;

    let query = this.db.from('support_tickets').select(TICKET_SELECT, { count: 'exact' });

    if (filters.status && STATUSES.includes(filters.status)) {
      query = query.eq('status', filters.status);
    }
    query = query.order('updated_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(`support.list failed: ${error.message}`);

    const content = ((data ?? []) as unknown as TicketRow[]).map(mapTicket);
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

  /** A single ticket. Throws NOT_FOUND if it doesn't exist. */
  async get(id: string): Promise<SupportTicket> {
    const { data, error } = await this.db
      .from('support_tickets')
      .select(TICKET_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`support.get failed: ${error.message}`);
    if (!data) throw new Error('NOT_FOUND: support ticket not found');
    return mapTicket(data as unknown as TicketRow);
  }

  async listMessages(ticketId: string): Promise<SupportTicketMessage[]> {
    const { data, error } = await this.db
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(`support.listMessages failed: ${error.message}`);
    return (data ?? []).map(mapMessage);
  }

  /** Staff reply. The `sync_ticket_on_message` trigger updates the parent
   * ticket's last_message/unread/status fields — do not duplicate that here. */
  async reply(args: {
    ticketId: string;
    staffUserId: string;
    body: string;
  }): Promise<SupportTicketMessage> {
    const { ticketId, staffUserId, body } = args;
    const { data, error } = await this.db
      .from('support_ticket_messages')
      .insert({ ticket_id: ticketId, sender_id: staffUserId, sender_role: 'STAFF', body })
      .select('*')
      .single();
    if (error) throw new Error(`support.reply failed: ${error.message}`);
    return mapMessage(data);
  }

  /** Idempotent status transition (no-op on re-applying the current status). */
  async setStatus(args: { id: string; next: SupportTicketStatus }): Promise<SupportTicket> {
    const { id, next } = args;
    if (!STATUSES.includes(next)) {
      throw new Error('INVALID_STATUS: status must be OPEN | IN_PROGRESS | RESOLVED | CLOSED');
    }

    const { data: current, error: readErr } = await this.db
      .from('support_tickets')
      .select(TICKET_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (readErr) throw new Error(`support.setStatus read failed: ${readErr.message}`);
    if (!current) throw new Error('NOT_FOUND: support ticket not found');
    const currentRow = current as unknown as TicketRow;
    if (currentRow.status === next) return mapTicket(currentRow);

    const { data: updated, error: updErr } = await this.db
      .from('support_tickets')
      .update({ status: next })
      .eq('id', id)
      .select(TICKET_SELECT)
      .single();
    if (updErr) throw new Error(`support.setStatus update failed: ${updErr.message}`);
    return mapTicket(updated as unknown as TicketRow);
  }

  /** Clears the staff-side unread counter — call when a staff member opens a
   * ticket's detail view. Best-effort: callers should not fail the request
   * if this fails. */
  async markReadByStaff(id: string): Promise<void> {
    const { error } = await this.db
      .from('support_tickets')
      .update({ unread_by_staff: 0 })
      .eq('id', id);
    if (error) throw new Error(`support.markReadByStaff failed: ${error.message}`);
  }
}
