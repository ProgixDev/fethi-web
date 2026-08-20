"use client";

import * as React from "react";
import Link from "next/link";
import { Search as SearchIcon, Tag, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { listingsApi, usersApi, type Listing, type AdminUserListItem } from "@/lib/api";

export default function GlobalSearchPage() {
  const [q, setQ] = React.useState("");
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [users, setUsers] = React.useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Pas de recherche orders en V1 — seules les annonces et les utilisateurs
  // sont indexés ici.
  React.useEffect(() => {
    if (!q.trim() || q.trim().length < 2) {
      setListings([]); setUsers([]);
      return;
    }
    let alive = true;
    setLoading(true);
    const debounce = setTimeout(() => {
      Promise.all([
        listingsApi.list({ q: q.trim(), size: 10 }).catch(() => null),
        usersApi.list({ q: q.trim(), size: 10 } as never).catch(() => null),
      ]).then(([l, u]) => {
        if (!alive) return;
        setListings(l?.content ?? []);
        setUsers(u?.content ?? []);
        setLoading(false);
      });
    }, 300);
    return () => { alive = false; clearTimeout(debounce); };
  }, [q]);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Recherche" }]}
        title="Recherche globale"
        description="Cherche dans les annonces et les utilisateurs."
      />
      <Input
        leadingIcon={<SearchIcon className="h-4 w-4" />}
        placeholder="Tape au moins 2 caractères…"
        value={q}
        onChange={(e) => setQ(e.currentTarget.value)}
        className="w-full max-w-2xl"
      />
      {loading ? <p className="text-body text-n-500">Recherche…</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardBody>
            <h3 className="text-h3 font-medium text-ink mb-3 flex items-center gap-2"><Tag className="h-4 w-4" /> Annonces ({listings.length})</h3>
            {listings.length === 0 ? <p className="text-body-sm text-n-500">—</p> : (
              <ul className="space-y-2">
                {listings.map((l) => (
                  <li key={l.id}>
                    <Link href={`/listings/${l.id}`} className="text-body-sm text-ink hover:text-primary truncate block">{l.title}</Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody></Card>
          <Card><CardBody>
            <h3 className="text-h3 font-medium text-ink mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Utilisateurs ({users.length})</h3>
            {users.length === 0 ? <p className="text-body-sm text-n-500">—</p> : (
              <ul className="space-y-2">
                {users.map((u) => (
                  <li key={u.id}>
                    <Link href={`/users/${u.id}`} className="text-body-sm text-ink hover:text-primary">{u.name}</Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody></Card>
        </div>
      )}
    </div>
  );
}
