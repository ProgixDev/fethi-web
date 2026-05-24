"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { CheckCircle2, FileBadge, Shield, XCircle } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { publicUsersApi, kycApi, type PublicProfile } from "@/lib/api";
import { initials, formatDate } from "@/lib/utils/format";

export default function KycDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [user, setUser] = React.useState<PublicProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    let alive = true;
    publicUsersApi.get(id)
      .then((p) => { if (alive) setUser(p); })
      .catch(() => alive && setUser(null))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  const updateKyc = async (next: "VERIFIED" | "REJECTED") => {
    if (!id) return;
    setPending(true);
    try {
      await kycApi.setStatus(id, next);
      alert(`Statut mis à jour: ${next}`);
    } catch (err) {
      alert("Échec: " + (err as Error).message);
    } finally {
      setPending(false);
    }
  };

  if (loading) return <div className="container-admin py-8"><p className="text-body text-n-500">Chargement…</p></div>;
  if (!user) notFound();

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/kyc", label: "KYC" },
          { label: user.displayName ?? "—" },
        ]}
        title={`Dossier KYC — ${user.displayName ?? "Voisin·e"}`}
        description={`Quartier : ${user.neighborhood ?? "—"}`}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card><CardBody>
            <div className="flex items-center gap-3">
              <Avatar initials={initials(user.displayName ?? "?")} seed={user.id} size="lg" />
              <div>
                <p className="text-body font-medium text-ink">{user.displayName ?? "Voisin·e"}</p>
                <p className="text-caption text-n-500">{user.neighborhood ?? "—"} · inscrit le {formatDate(user.createdAt)}</p>
              </div>
            </div>
            {user.bio ? <p className="mt-3 text-body-sm text-n-700">{user.bio}</p> : null}
          </CardBody></Card>

          <Card><CardBody>
            <h3 className="text-h3 font-medium text-ink mb-3 flex items-center gap-2">
              <FileBadge className="h-4 w-4" /> Pièces fournies
            </h3>
            <p className="text-body-sm text-n-500">
              L'upload des pièces (CNI, selfie, justificatif) sera disponible quand l'endpoint
              <code className="font-mono"> /me/kyc/upload </code> sera créé côté backend.
            </p>
          </CardBody></Card>

          <Card><CardBody>
            <h3 className="text-h3 font-medium text-ink mb-3">Décision</h3>
            <div className="flex gap-3">
              <Button onClick={() => updateKyc("VERIFIED")} disabled={pending}>
                <CheckCircle2 className="h-4 w-4" /> Approuver
              </Button>
              <Button variant="outline" onClick={() => updateKyc("REJECTED")} disabled={pending}>
                <XCircle className="h-4 w-4" /> Refuser
              </Button>
            </div>
          </CardBody></Card>
        </div>

        <div className="space-y-6">
          <Card><CardBody className="space-y-3">
            <div className="flex justify-between"><span className="text-caption text-n-500">Note</span><span className="text-body-sm text-ink">{user.rating != null ? user.rating.toFixed(1) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-caption text-n-500">Annonces</span><span className="text-body-sm text-ink">{user.listingsCount ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-caption text-n-500">Ventes</span><span className="text-body-sm text-ink">{user.salesCount ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-caption text-n-500">Avis</span><span className="text-body-sm text-ink">{user.reviewsCount ?? 0}</span></div>
            <hr className="border-n-100" />
            <Link href={`/users/${user.id}`} className="text-body-sm text-primary hover:underline">Voir le profil complet →</Link>
          </CardBody></Card>
        </div>
      </div>
    </div>
  );
}
