/**
 * Reports repository (WEB-011) — UGC moderation queue over the `reports` table
 * shipped by SCR-005.
 *
 * Service-role ONLY: SCR-005 gives `reports` an insert-own RLS policy and NO
 * client SELECT/UPDATE, so staff reads + status transitions must run through the
 * service-role client (constructed in the admin Route Handler after
 * `gateStaff('moderator')`). Every transition is audited in `staff_audit_log`
 * (SCR-004) in the same path — the report row itself has no reviewer columns, so
 * the "who/when/why" lives in the audit trail. No schema change is required.
 *
 * Target context (the reported listing/user/thread/message) is resolved by the
 * detail screen via the existing `listingsApi` / `publicUsersApi` seams, so this
 * repository only owns the report rows.
 */
import type {
  PageResponse,
  Report,
  ReportFilters,
  ReportStatus,
  ReportTargetType,
} from '@/lib/api';
import type { Database } from '@/lib/database.types';

import { BaseRepository } from './base';
import { AuditRepository } from './audit';

type ReportRow = Database['public']['Tables']['reports']['Row'];

const DEFAULT_SIZE = 25;
const MAX_SIZE = 100;

const STATUSES: ReportStatus[] = ['OPEN', 'REVIEWING', 'ACTIONED', 'DISMISSED'];
const TARGET_TYPES: ReportTargetType[] = ['LISTING', 'USER', 'THREAD', 'MESSAGE'];

/** Map a DB row to the `Report` contract. status/target_type are CHECK-
 * constrained to the enum values in the migration, so the cast is safe. */
function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    targetType: row.target_type as ReportTargetType,
    targetId: row.target_id,
    reason: row.reason,
    details: row.details,
    status: row.status as ReportStatus,
    createdAt: row.created_at,
  };
}

/** Audit action slug for a transition into `next`. */
function actionFor(next: ReportStatus): string {
  switch (next) {
    case 'REVIEWING':
      return 'report.review';
    case 'ACTIONED':
      return 'report.action';
    case 'DISMISSED':
      return 'report.dismiss';
    default:
      return 'report.reopen';
  }
}

export class ReportsRepository extends BaseRepository {
  /** Staff-gated, paginated report queue, newest first. */
  async list(filters: ReportFilters = {}): Promise<PageResponse<Report>> {
    const page = Math.max(0, Number(filters.page ?? 0));
    const size = Math.min(MAX_SIZE, Math.max(1, Number(filters.size ?? DEFAULT_SIZE)));
    const from = page * size;
    const to = from + size - 1;

    let query = this.db.from('reports').select('*', { count: 'exact' });

    if (filters.status && STATUSES.includes(filters.status)) {
      query = query.eq('status', filters.status);
    }
    if (filters.targetType && TARGET_TYPES.includes(filters.targetType)) {
      query = query.eq('target_type', filters.targetType);
    }
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(`reports.list failed: ${error.message}`);

    const content = (data ?? []).map(mapReport);
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

  /** A single report. Throws NOT_FOUND if it doesn't exist. */
  async get(id: string): Promise<Report> {
    const { data, error } = await this.db
      .from('reports')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`reports.get failed: ${error.message}`);
    if (!data) throw new Error('NOT_FOUND: report not found');
    return mapReport(data);
  }

  /**
   * Transition a report's status, auditing who/when/why. Idempotent: re-applying
   * the current status is a no-op (no duplicate audit row).
   */
  async setStatus(args: {
    actorId: string;
    id: string;
    next: ReportStatus;
    moderatorNote?: string | null;
  }): Promise<Report> {
    const { actorId, id, next, moderatorNote } = args;
    if (!STATUSES.includes(next)) {
      throw new Error('INVALID_STATUS: status must be OPEN | REVIEWING | ACTIONED | DISMISSED');
    }

    const { data: current, error: readErr } = await this.db
      .from('reports')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (readErr) throw new Error(`reports.setStatus read failed: ${readErr.message}`);
    if (!current) throw new Error('NOT_FOUND: report not found');

    if (current.status === next) {
      // Idempotent no-op — return as-is, no audit row.
      return mapReport(current);
    }

    const { data: updated, error: updErr } = await this.db
      .from('reports')
      .update({ status: next })
      .eq('id', id)
      .select('*')
      .single();
    if (updErr) throw new Error(`reports.setStatus update failed: ${updErr.message}`);

    await new AuditRepository(this.db).record({
      actorId,
      action: actionFor(next),
      targetType: 'report',
      targetId: id,
      before: { status: current.status },
      after: { status: next },
      reason: moderatorNote ?? null,
    });

    return mapReport(updated);
  }
}
