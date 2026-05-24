"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  MessageSquare,
  ShieldAlert,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import {
  reportsApi,
  publicUsersApi,
  listingsApi,
  type Report,
  type ReportStatus,
  type ReportTargetType,
  type PublicProfile,
  type Listing,
} from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

const statusTone: Record<ReportStatus, React.ComponentProps<typeof Pill>["tone"]> = {
  OPEN: "warning",
  REVIEWING: "info",
  ACTIONED: "success",
  DISMISSED: "neutral",
};
const statusLabel: Record<ReportStatus, string> = {
  OPEN: "Ouvert",
  REVIEWING: "En cours",
  ACTIONED: "Résolu",
  DISMISSED: "Rejeté",
};

const targetIcon: Record<ReportTargetType, React.ReactNode> = {
  LISTING: <FileText className="h-4 w-4" />,
  USER: <UserIcon className="h-4 w-4" />,
  THREAD: <MessageSquare className="h-4 w-4" />,
  MESSAGE: <MessageSquare className="h-4 w-4" />,
};

const targetLabel: Record<ReportTargetType, string> = {
  LISTING: "Annonce",
  USER: "Utilisateur",
  THREAD: "Conversation",
  MESSAGE: "Message",
};

export default function ModerationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [report, setReport] = React.useState<Report | null>(null);
  const [target, setTarget] = React.useState<PublicProfile | Listing | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [moderatorNote, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    let alive = true;
    reportsApi
      .get(id)
      .then(async (r) => {
        if (!alive) return;
        setReport(r);
        // Charge la cible si user ou listing
        if (r.targetType === "USER") {
          publicUsersApi.get(r.targetId).then((u) => alive && setTarget(u)).catch(() => {});
        } else if (r.targetType === "LISTING") {
          listingsApi.get(r.targetId).then((l) => alive && setTarget(l)).catch(() => {});
        }
      })
      .catch(() => {
        if (alive) setReport(null);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const updateStatus = async (next: ReportStatus) => {
    if (!report) return;
    setPending(true);
    try {
      const updated = await reportsApi.setStatus(report.id, next, moderatorNote || undefined);
      setReport(updated);
    } catch (err) {
      alert("Échec: " + (err as Error).message);
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="container-admin py-8">
        <p className="text-body text-n-500">Chargement…</p>
      </div>
    );
  }
  if (!report) notFound();

  const isUser = report.targetType === "USER" && target !== null;
  const isListing = report.targetType === "LISTING" && target !== null;
  const userTarget = isUser ? (target as PublicProfile) : null;
  const listingTarget = isListing ? (target as Listing) : null;

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/moderation", label: "Modération" },
          { label: `#${report.id.slice(0, 8)}` },
        ]}
        title="Signalement"
        description={`${targetLabel[report.targetType]} · ${report.reason}`}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardBody>
              <h3 className="text-h3 font-medium text-ink">Motif</h3>
              <p className="mt-2 text-body text-n-700">{report.reason}</p>
              {report.details ? (
                <>
                  <h4 className="mt-4 text-label uppercase tracking-wide text-n-500">
                    Détails
                  </h4>
                  <p className="mt-1 text-body text-n-700 whitespace-pre-line">{report.details}</p>
                </>
              ) : null}
            </CardBody>
          </Card>

          {userTarget ? (
            <Card>
              <CardBody>
                <h3 className="text-h3 font-medium text-ink mb-3">Utilisateur signalé</h3>
                <Link href={`/users/${userTarget.id}`} className="text-body-sm text-primary hover:underline">
                  {userTarget.displayName ?? "Voisin·e"}
                </Link>
                <p className="text-caption text-n-500 mt-1">
                  {userTarget.neighborhood ?? "—"} ·{" "}
                  {userTarget.listingsCount ?? 0} annonces · {userTarget.reviewsCount ?? 0} avis
                </p>
              </CardBody>
            </Card>
          ) : null}

          {listingTarget ? (
            <Card>
              <CardBody>
                <h3 className="text-h3 font-medium text-ink mb-3">Annonce signalée</h3>
                <Link href={`/listings/${listingTarget.id}`} className="text-body-sm text-primary hover:underline">
                  {listingTarget.title}
                </Link>
                <p className="text-caption text-n-500 mt-1">
                  {listingTarget.categoryLabel ?? "—"} · {listingTarget.neighborhood ?? "—"} · statut {listingTarget.status}
                </p>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardBody>
              <h3 className="text-h3 font-medium text-ink mb-2">Note de modération</h3>
              <Textarea
                value={moderatorNote}
                onChange={(e) => setNote(e.currentTarget.value)}
                placeholder="Justifie ta décision (visible uniquement par les autres modérateurs)"
                rows={4}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-caption text-n-500">Statut</span>
                <Pill tone={statusTone[report.status]} dot>
                  {statusLabel[report.status]}
                </Pill>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption text-n-500">Cible</span>
                <span className="inline-flex items-center gap-1.5 text-body-sm text-n-700">
                  {targetIcon[report.targetType]} {targetLabel[report.targetType]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption text-n-500">Reçu le</span>
                <span className="text-body-sm text-n-700">{formatDate(report.createdAt)}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              <h3 className="text-h3 font-medium text-ink mb-2">Actions</h3>
              {report.status === "OPEN" ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => updateStatus("REVIEWING")}
                  disabled={pending}
                >
                  Prendre en charge
                </Button>
              ) : null}
              {report.status !== "ACTIONED" ? (
                <Button
                  className="w-full"
                  onClick={() => updateStatus("ACTIONED")}
                  disabled={pending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Marquer comme traité
                </Button>
              ) : null}
              {report.status !== "DISMISSED" ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => updateStatus("DISMISSED")}
                  disabled={pending}
                >
                  <XCircle className="h-4 w-4" />
                  Rejeter
                </Button>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
