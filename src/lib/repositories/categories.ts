/**
 * Categories repository — taxonomy admin (WEB-013 categories seam) over the
 * `categories` table shipped by SCR-001.
 *
 * Service-role: `categories` has a public SELECT policy (`categories_select_public`)
 * but no client write policy ("writes service-role only" per the migration
 * comment), so create/update/delete run through the service-role client inside
 * a staff-gated Route Handler, same as every other admin mutation.
 *
 * The table has no `active`/`label_en` columns — those were part of a stale
 * pre-Supabase (Spring backend) contract in `src/lib/api.ts` that never matched
 * this schema. `isLeaf` isn't a column either; it's derived per request from
 * whether any other category has this row as `parent_id`.
 */
import type {
  Category,
  CategoryFilters,
  CreateCategoryRequest,
  ListingType,
  PageResponse,
  UpdateCategoryRequest,
} from '@/lib/api';
import type { Database } from '@/lib/database.types';

import { BaseRepository } from './base';
import { AuditRepository } from './audit';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

const DEFAULT_SIZE = 25;
const MAX_SIZE = 200;

function mapCategory(row: CategoryRow, childParentIds: Set<string>): Category {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    subtitle: row.subtitle,
    parentId: row.parent_id,
    type: row.type as ListingType,
    glyph: row.glyph,
    sortOrder: row.sort_order,
    isLeaf: !childParentIds.has(row.id),
  };
}

export class CategoriesRepository extends BaseRepository {
  /** Staff-gated, paginated taxonomy list, ordered by `sort_order`. */
  async list(filters: CategoryFilters = {}): Promise<PageResponse<Category>> {
    const page = Math.max(0, Number(filters.page ?? 0));
    const size = Math.min(MAX_SIZE, Math.max(1, Number(filters.size ?? DEFAULT_SIZE)));
    const from = page * size;
    const to = from + size - 1;

    let query = this.db.from('categories').select('*', { count: 'exact' });
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.label) query = query.ilike('label', `%${filters.label}%`);
    query = query.order('sort_order', { ascending: true }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(`categories.list failed: ${error.message}`);

    // `isLeaf` depends on the full parent_id set, not just this page, so this
    // is a second small query rather than derivable from `data` alone.
    const { data: parentRows, error: parentErr } = await this.db
      .from('categories')
      .select('parent_id')
      .not('parent_id', 'is', null);
    if (parentErr) {
      throw new Error(`categories.list (parents) failed: ${parentErr.message}`);
    }
    const childParentIds = new Set(
      (parentRows ?? []).map((r) => r.parent_id as string),
    );

    const content = (data ?? []).map((r) => mapCategory(r, childParentIds));
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

  private async isLeafOf(id: string): Promise<boolean> {
    const { count, error } = await this.db
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', id);
    if (error) throw new Error(`categories.isLeafOf failed: ${error.message}`);
    return (count ?? 0) === 0;
  }

  async create(args: {
    actorId: string;
    req: CreateCategoryRequest;
  }): Promise<Category> {
    const { actorId, req } = args;
    const { data, error } = await this.db
      .from('categories')
      .insert({
        slug: req.slug,
        label: req.label,
        subtitle: req.subtitle ?? null,
        parent_id: req.parentId ?? null,
        type: req.type,
        glyph: req.glyph ?? null,
        sort_order: req.sortOrder ?? 0,
      })
      .select('*')
      .single();
    if (error) throw new Error(`categories.create failed: ${error.message}`);

    await new AuditRepository(this.db).record({
      actorId,
      action: 'category.create',
      targetType: 'category',
      targetId: data.id,
      after: { slug: data.slug, label: data.label, type: data.type },
    });

    return mapCategory(data, new Set());
  }

  async update(args: {
    actorId: string;
    id: string;
    req: UpdateCategoryRequest;
  }): Promise<Category> {
    const { actorId, id, req } = args;

    const { data: current, error: readErr } = await this.db
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (readErr) throw new Error(`categories.update read failed: ${readErr.message}`);
    if (!current) throw new Error('NOT_FOUND: category not found');

    const patch: Database['public']['Tables']['categories']['Update'] = {};
    if (req.label !== undefined) patch.label = req.label;
    if (req.subtitle !== undefined) patch.subtitle = req.subtitle ?? null;
    if (req.parentId !== undefined) patch.parent_id = req.parentId ?? null;
    if (req.glyph !== undefined) patch.glyph = req.glyph ?? null;
    if (req.sortOrder !== undefined) patch.sort_order = req.sortOrder;

    const { data: updated, error: updErr } = await this.db
      .from('categories')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (updErr) throw new Error(`categories.update failed: ${updErr.message}`);

    await new AuditRepository(this.db).record({
      actorId,
      action: 'category.update',
      targetType: 'category',
      targetId: id,
      before: current,
      after: updated,
    });

    const isLeaf = await this.isLeafOf(id);
    return mapCategory(updated, isLeaf ? new Set() : new Set([id]));
  }

  /**
   * Delete a category. Blocked (not a soft-deactivate — the schema has no
   * `active` column) when it has subcategories or listings still reference it,
   * since `parent_id` cascades on delete and `listings.category_id` would be
   * silently nulled otherwise.
   */
  async remove(args: { actorId: string; id: string }): Promise<void> {
    const { actorId, id } = args;

    const { data: current, error: readErr } = await this.db
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (readErr) throw new Error(`categories.remove read failed: ${readErr.message}`);
    if (!current) throw new Error('NOT_FOUND: category not found');

    const hasChildren = !(await this.isLeafOf(id));
    if (hasChildren) {
      throw new Error(
        'IN_USE: category has subcategories — move or delete them first',
      );
    }

    const { count: listingCount, error: listingErr } = await this.db
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);
    if (listingErr) {
      throw new Error(`categories.remove (listings check) failed: ${listingErr.message}`);
    }
    if ((listingCount ?? 0) > 0) {
      throw new Error(
        'IN_USE: category still has listings — reassign them before deleting',
      );
    }

    const { error: delErr } = await this.db.from('categories').delete().eq('id', id);
    if (delErr) throw new Error(`categories.remove failed: ${delErr.message}`);

    await new AuditRepository(this.db).record({
      actorId,
      action: 'category.delete',
      targetType: 'category',
      targetId: id,
      before: current,
    });
  }
}
