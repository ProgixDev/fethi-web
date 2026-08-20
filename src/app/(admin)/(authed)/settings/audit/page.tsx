"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { auditApi, type AuditLogEntry, type AuditTargetType } from "@/lib/api";
import { formatDateTime } from "@/lib/utils/format";

const targetTypeLabel: Record<AuditTargetType, string> = {
  user: "Utilisateur",
  listing: "Annonce",
  report: "Signalement",
  category: "Catégorie",
};

/** Best-effort tone from the action verb — the log has no severity column, so
 * this reads the same `action` slugs the repositories actually write
 * (`user.suspend`, `listing.pause`, `report.dismiss`, …). */
function toneFor(action: string): React.ComponentProps<typeof Pill>["tone"] {
  if (/ban|delete|dismiss|reject/.test(action)) return "danger";
  if (/suspend|pause|archive/.test(action)) return "warning";
  if (/create|restore|reactivate|action|approve/.test(action)) return "success";
  return "info";
}

/** Where the target links to, when the admin already has a detail screen for
 * it (user/listing). Reports and categories have no `[id]` detail route. */
function targetHref(entry: AuditLogEntry): string | null {
  if (entry.targetType === "user") return `/users/${entry.targetId}`;
  if (entry.targetType === "listing") return `/listings/${entry.targetId}`;
  return null;
}

export default function SettingsAuditPage() {
  const [targetType, setTargetType] = React.useState<AuditTargetType | "all">("all");
  const [page, setPage] = React.useState(0);
  const [logs, setLogs] = React.useState<AuditLogEntry[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditApi.list({
        targetType: targetType === "all" ? undefined : targetType,
        page,
        size: 25,
      });
      setLogs(res.content);
      setTotal(res.totalElements);
      setTotalPages(res.totalPages);
    } catch {
      setError("Impossible de charger le journal d'audit.");
    } finally {
      setLoading(false);
    }
  }, [targetType, page]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/settings/system", label: "Réglages" },
          { label: "Journal d'audit" },
        ]}
        title="Journal d&apos;audit"
        description={
          loading
            ? "Chargement…"
            : `${total} action${total > 1 ? "s" : ""} enregistrée${total > 1 ? "s" : ""} — trace réelle des mutations admin.`
        }
      />

      <section className="rounded-lg border border-n-100 bg-surface p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Cible">
            <Select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.currentTarget.value as AuditTargetType | "all");
                setPage(0);
              }}
            >
              <option value="all">Toutes</option>
              <option value="user">Utilisateur</option>
              <option value="listing">Annonce</option>
              <option value="report">Signalement</option>
              <option value="category">Catégorie</option>
            </Select>
          </Field>
        </div>
      </section>

      {error ? (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-body-sm text-danger">{error}</div>
      ) : null}

      <section className="rounded-lg border border-n-100 bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead className="bg-paper text-left">
              <tr>
                <th className="px-5 py-3 text-label font-medium text-n-500">Quand</th>
                <th className="px-5 py-3 text-label font-medium text-n-500">Acteur</th>
                <th className="px-5 py-3 text-label font-medium text-n-500">Action</th>
                <th className="px-5 py-3 text-label font-medium text-n-500">Cible</th>
                <th className="px-5 py-3 text-label font-medium text-n-500">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-n-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-n-500">
                    {loading ? "Chargement…" : "Aucune action enregistrée pour ce filtre."}
                  </td>
                </tr>
              ) : (
                logs.map((l) => {
                  const href = targetHref(l);
                  return (
                    <tr key={l.id} className="hover:bg-n-50">
                      <td className="px-5 py-3 text-n-500">{formatDateTime(l.at)}</td>
                      <td className="px-5 py-3 text-ink">{l.actorLabel}</td>
                      <td className="px-5 py-3">
                        <Pill tone={toneFor(l.action)} dot>
                          {l.action}
                        </Pill>
                      </td>
                      <td className="px-5 py-3 text-n-700">
                        {href ? (
                          <Link href={href} className="text-primary hover:text-primary-hover">
                            {targetTypeLabel[l.targetType]} · {l.targetId.slice(0, 8)}
                          </Link>
                        ) : (
                          <span>
                            {targetTypeLabel[l.targetType]} · {l.targetId.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-n-500">{l.reason ?? "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-n-100 bg-paper px-4 py-2.5 text-caption text-n-500">
            <span className="tabular">
              Page {page + 1} sur {totalPages} — {total} résultats
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 hover:bg-n-100 disabled:opacity-30"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 hover:bg-n-100 disabled:opacity-30"
              >
                Suivant
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
