/**
 * Audit repository (SCR-004) — staff moderation/admin action trail.
 *
 * Service-role ONLY: `staff_audit_log` has RLS enabled with no anon/authenticated
 * policy, so it is invisible to the browser. The repository is constructed with
 * the service-role client inside admin Route Handlers (after `requireStaff` +
 * `hasRole`), in the same path as the moderation mutation. Mobile never touches
 * this.
 */
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
}
