"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import {
  categoriesApi,
  Category,
  ListingType,
  ApiError,
} from "@/lib/api";
import { CategoryDialog } from "@/components/admin/categories/CategoryDialog";

const typeLabels: Record<ListingType, string> = {
  VENTE: "Vente",
  LOCATION: "Location",
  SERVICE: "Service",
};

const PAGE_SIZE = 20;

export default function SettingsCategoriesPage() {
  // -- filtres ---------------------------------------------------------------
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [type, setType] = React.useState<string>("all");
  const [activeFilter, setActiveFilter] = React.useState<string>("active");
  const [page, setPage] = React.useState(0);

  // -- données ---------------------------------------------------------------
  const [rows, setRows] = React.useState<Category[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // -- dialog ----------------------------------------------------------------
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);

  // Debounce recherche
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Reset page sur changement de filtre
  React.useEffect(() => {
    setPage(0);
  }, [type, activeFilter]);

  // Chargement
  const loadCategories = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoriesApi.list({
        label: debouncedQuery || undefined,
        type: type === "all" ? undefined : (type as ListingType),
        active:
          activeFilter === "all"
            ? undefined
            : activeFilter === "active",
        page,
        size: PAGE_SIZE,
        sort: "sortOrder,asc",
      });
      setRows(res.content);
      setTotal(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les catégories.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, type, activeFilter, page]);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setDialogOpen(true);
  }

  async function handleDeactivate(cat: Category) {
    const ok = window.confirm(
      `Désactiver la catégorie "${cat.label}" ? Les annonces existantes resteront mais aucune nouvelle ne pourra y être publiée.`,
    );
    if (!ok) return;
    try {
      await categoriesApi.deactivate(cat.id);
      loadCategories();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message || "Désactivation impossible");
      } else {
        alert("Erreur réseau");
      }
    }
  }

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/settings/system", label: "Réglages" },
          { label: "Catégories" },
        ]}
        title="Catégories"
        description={
          loading
            ? "Chargement…"
            : `${total} catégorie${total > 1 ? "s" : ""} — taxonomie produit.`
        }
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </Button>
        }
      />

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Rechercher par libellé…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          leadingIcon={<Search className="h-4 w-4" />}
          className="w-80"
        />
        <Select
          value={type}
          onChange={(e) => setType(e.currentTarget.value)}
          className="w-44"
        >
          <option value="all">Tous univers</option>
          {(Object.keys(typeLabels) as ListingType[]).map((t) => (
            <option key={t} value={t}>
              {typeLabels[t]}
            </option>
          ))}
        </Select>
        <Select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.currentTarget.value)}
          className="w-44"
        >
          <option value="active">Actives</option>
          <option value="inactive">Désactivées</option>
          <option value="all">Toutes</option>
        </Select>
      </div>

      {error ? (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-body-sm text-danger">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg border border-n-100 bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead className="bg-paper text-left">
              <tr>
                <th className="px-5 py-3 text-label font-medium text-n-500">
                  Libellé
                </th>
                <th className="px-5 py-3 text-label font-medium text-n-500">
                  Slug
                </th>
                <th className="px-5 py-3 text-label font-medium text-n-500">
                  Univers
                </th>
                <th className="px-5 py-3 text-label font-medium text-n-500">
                  Type
                </th>
                <th className="px-5 py-3 text-label font-medium text-n-500 tabular">
                  Ordre
                </th>
                <th className="px-5 py-3 text-label font-medium text-n-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-n-100">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-n-500"
                  >
                    {loading
                      ? "Chargement…"
                      : "Aucune catégorie ne correspond aux filtres."}
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="hover:bg-n-50">
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="text-ink font-medium">{c.label}</span>
                        {c.subtitle ? (
                          <span className="text-caption text-n-500">
                            {c.subtitle}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-caption text-n-500">
                      {c.slug}
                    </td>
                    <td className="px-5 py-3">
                      <Pill tone="neutral">{typeLabels[c.type]}</Pill>
                    </td>
                    <td className="px-5 py-3">
                      {c.isLeaf ? (
                        <Pill tone="success">Feuille</Pill>
                      ) : (
                        <Pill tone="info">Section</Pill>
                      )}
                    </td>
                    <td className="px-5 py-3 tabular text-n-700">
                      {c.sortOrder}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={page >= totalPages - 1 || loading}
                className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 hover:bg-n-100 disabled:opacity-30"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        onSaved={loadCategories}
      />
    </div>
  );
}
