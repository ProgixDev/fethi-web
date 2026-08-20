/**
 * Audit repository (SCR-004) — staff moderation/admin action trail.
 *
 * Service-role ONLY: `staff_audit_log` has RLS enabled with no anon/authenticated
 * policy, so it is invisible to the browser. The repository is constructed with
 * the service-role client inside admin Route Handlers (after `requireStaff` +
 * `hasRole`), in the same path as the moderation mutation. Mobile never touches
 * this.
 */
import type { AuditFilters, AuditLogEntry, AuditTargetType, PageResponse } from '@/lib/api';

import { BaseRepository } from './base';

export type AuditEntry = {
  actorId: string;
  action: string;
  targetType: 'user' | 'listing' | 'report' | 'category';
  targetId: string;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
};

const DEFAULT_SIZE = 25;
const MAX_SIZE = 100;
const TARGET_TYPES: AuditTargetType[] = ['user', 'listing', 'report', 'category'];

export class AuditRepository extends BaseRepository {
  /** Append one audit row. Throws if the insert fails (the caller treats an
   * unrecorded action as a failed action — moderation must be auditable). */
  async record(entry: AuditEntry): Promise<void> {
    const { error } = await this.db.from('staff_audit_log').insert({
      actor_id: entry.actorId,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      before: (entry.before ?? null) as never,
      after: (entry.after ?? null) as never,
      reason: entry.reason ?? null,
    });
    if (error) throw new Error(`audit insert failed: ${error.message}`);
  }

  /**
   * Staff-gated, paginated read of the audit trail, newest first
   * (`settings/audit`). Every row here was written by a real moderation
   * mutation (`record()` above, called from users/listings/reports/categories
   * repositories) — nothing here is fabricated.
   */
  async list(filters: AuditFilters = {}): Promise<PageResponse<AuditLogEntry>> {
    const page = Math.max(0, Number(filters.page ?? 0));
    const size = Math.min(MAX_SIZE, Math.max(1, Number(filters.size ?? DEFAULT_SIZE)));
    const from = page * size;
    const to = from + size - 1;

    let query = this.db.from('staff_audit_log').select('*', { count: 'exact' });
    if (filters.targetType && TARGET_TYPES.includes(filters.targetType)) {
      query = query.eq('target_type', filters.targetType);
    }
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(`audit.list failed: ${error.message}`);
    const rows = data ?? [];

    const actorNames = await this.resolveActorNames([...new Set(rows.map((r) => r.actor_id))]);

    const content: AuditLogEntry[] = rows.map((r) => ({
      id: r.id,
      at: r.created_at,
      actorId: r.actor_id,
      actorLabel: actorNames.get(r.actor_id) ?? `Staff ${r.actor_id.slice(0, 8)}`,
      action: r.action,
      targetType: r.target_type as AuditTargetType,
      targetId: r.target_id,
      reason: r.reason,
    }));

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

  /**
   * Best-effort actor display name via `profiles.display_name` — staff members
   * who are also marketplace users resolve to a real name. `staff_audit_log`
   * has no FK relationship declared (service-role-only table), so this is a
   * manual batch lookup rather than a PostgREST embed; anyone unresolved falls
   * back to a short id in `list()`.
   */
  private async resolveActorNames(actorIds: string[]): Promise<Map<string, string>> {
    if (actorIds.length === 0) return new Map();
    const { data, error } = await this.db
      .from('profiles')
      .select('id, display_name')
      .in('id', actorIds);
    if (error) return new Map();
    const map = new Map<string, string>();
    for (const r of data ?? []) {
      if (r.display_name) map.set(r.id, r.display_name);
    }
    return map;
  }
}
