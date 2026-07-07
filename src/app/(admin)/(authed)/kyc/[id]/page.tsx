"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileCheck,
  RefreshCw,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { kycApi, type KycDetail, type KycStatus } from "@/lib/api";
import { initials, formatDate } from "@/lib/utils/format";

const kycTone: Record<KycStatus, React.ComponentProps<typeof Pill>["tone"]> = {
  VERIFIED: "success",
  PENDING: "warning",
  REVIEW: "info",
  UNVERIFIED: "neutral",
  REJECTED: "danger",
};

const kycLabel: Record<KycStatus, string> = {
  VERIFIED: "Vérifié",
  PENDING: "En cours",
  REVIEW: "À examiner",
  UNVERIFIED: "Non vérifié",
  REJECTED: "Refusé",
};

const kycIcon: Record<KycStatus, React.ReactNode> = {
  VERIFIED: <CheckCircle2 className="h-5 w-5" />,
  PENDING: <Shield className="h-5 w-5" />,
  REVIEW: <AlertTriangle className="h-5 w-5" />,
  UNVERIFIED: <AlertCircle className="h-5 w-5" />,
  REJECTED: <XCircle className="h-5 w-5" />,
};

const requirementLabels: Record<string, string> = {
  "individual.id_number": "Numéro d'identité",
  "individual.id_document": "Document d'identité",
  "individual.email": "Email",
  "individual.phone": "Téléphone",
  "individual.address": "Adresse",
  "individual.dob": "Date de naissance",
  "individual.first_name": "Prénom",
  "individual.last_name": "Nom",
  "business_profile.url": "Site web",
  "business_profile.mcc": "Code MCC",
  "tos_acceptance.date": "Acceptation CGU",
  "company.name": "Nom de l'entreprise",
  "company.tax_id": "Numéro fiscal",
  "relationship.account_opener": "Ouvreur de compte",
};

function formatRequirement(req: string): string {
  return requirementLabels[req] || req.replace(/^individual\./, "").replace(/^company\./, "").replace(/_/g, " ");
}

export default function KycDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [detail, setDetail] = React.useState<KycDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [onboardingUrl, setOnboardingUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const loadDetail = React.useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const data = await kycApi.get(id);
      setDetail(data);
    } catch (err) {
      setError((err as Error).message);
      setDetail(null);
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    loadDetail().then(() => {
      if (!alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [loadDetail]);

  const handleRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const data = await kycApi.refresh(id);
      setDetail(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleResendOnboarding = async () => {
    if (!id) return;
    setResending(true);
    try {
      const data = await kycApi.resendOnboarding(id);
      if (data.url) {
        setOnboardingUrl(data.url);
      } else {
        setError("Le compte est déjà activé, aucun lien d&apos;onboarding nécessaire.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setResending(false);
    }
  };

  const copyToClipboard = () => {
    if (onboardingUrl) {
      navigator.clipboard.writeText(onboardingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="container-admin py-8">
        <p className="text-body text-n-500">Chargement…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="container-admin py-8 space-y-6">
        <PageHeader
          crumbs={[
            { href: "/dashboard", label: "Tableau de bord" },
            { href: "/kyc", label: "KYC" },
            { label: "Erreur" },
          ]}
          title="Erreur"
        />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="text-body-sm">{error || "Utilisateur non trouvé"}</p>
        </div>
      </div>
    );
  }

  const hasRequirements =
    detail.currentlyDue.length > 0 ||
    detail.pastDue.length > 0 ||
    detail.pendingVerification.length > 0;

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/kyc", label: "KYC" },
          { label: detail.name },
        ]}
        title={`Dossier KYC — ${detail.name}`}
        description={`Quartier : ${detail.neighborhood ?? "—"}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
            {(detail.kyc === "UNVERIFIED" || detail.kyc === "PENDING") && (
              <Button
                size="sm"
                onClick={handleResendOnboarding}
                disabled={resending}
              >
                {resending ? "Génération..." : "Renvoyer lien onboarding"}
              </Button>
            )}
          </div>
        }
      />

      {/* Onboarding link popup */}
      {onboardingUrl && (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-body font-medium text-ink">
                  Lien d&apos;onboarding généré
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOnboardingUrl(null)}>
                Fermer
              </Button>
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value={onboardingUrl}
                className="flex-1 rounded-md border border-n-200 bg-n-50 px-3 py-2 text-body-sm text-n-600"
              />
              <Button size="sm" onClick={copyToClipboard}>
                {copied ? (
                  "Copié !"
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copier
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(onboardingUrl, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* User info */}
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <Avatar initials={initials(detail.name)} seed={detail.id} size="lg" />
                <div className="flex-1">
                  <p className="text-body font-medium text-ink">{detail.name}</p>
                  <p className="text-caption text-n-500">{detail.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-caption text-n-500">Membre depuis</p>
                  <p className="text-body-sm text-n-700">{formatDate(detail.createdAt)}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* KYC status */}
          <Card>
            <CardBody className="space-y-4">
              <h3 className="text-h3 font-medium text-ink flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Statut KYC
              </h3>

              <div className="flex items-center justify-between rounded-lg border border-n-100 bg-paper p-4">
                <div className="flex items-center gap-3">
                  {kycIcon[detail.kyc]}
                  <Pill tone={kycTone[detail.kyc]}>{kycLabel[detail.kyc]}</Pill>
                </div>
                <div className="text-right">
                  <p className="text-caption text-n-500">Source</p>
                  <p className="text-body-sm text-n-700">
                    {detail.source === "connect"
                      ? "Stripe Connect"
                      : detail.source === "profile"
                        ? "Profil"
                        : "Aucun"}
                  </p>
                </div>
              </div>

              {detail.source === "connect" && (
                <div className="rounded-lg border border-n-100 bg-paper p-4 space-y-3">
                  <h4 className="text-label text-body-sm font-medium text-n-700">
                    Stripe Connect
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-caption text-n-500">Account ID</p>
                      <p className="text-body-sm font-mono text-n-700">
                        {detail.stripeAccountId
                          ? `${detail.stripeAccountId.slice(0, 8)}...`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-caption text-n-500">Statut</p>
                      <p className="text-body-sm text-n-700">
                        {detail.onboardingStatus ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-caption text-n-500">Payouts activés</p>
                      <p
                        className={`text-body-sm font-medium ${
                          detail.payoutsEnabled ? "text-green-600" : "text-n-700"
                        }`}
                      >
                        {detail.payoutsEnabled ? "Oui" : "Non"}
                      </p>
                    </div>
                    <div>
                      <p className="text-caption text-n-500">Détails soumis</p>
                      <p className="text-body-sm text-n-700">
                        {detail.detailsSubmitted ? "Oui" : "Non"}
                      </p>
                    </div>
                    {detail.connectUpdatedAt && (
                      <div className="col-span-2">
                        <p className="text-caption text-n-500">Dernière mise à jour</p>
                        <p className="text-body-sm text-n-700">
                          {formatDate(detail.connectUpdatedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Requirements */}
          {hasRequirements && (
            <Card>
              <CardBody className="space-y-4">
                <h3 className="text-h3 font-medium text-ink flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Exigences Stripe
                </h3>

                {detail.pastDue.length > 0 && (
                  <div>
                    <p className="text-label text-body-sm font-medium text-red-600 mb-2">
                      En retard (action requise)
                    </p>
                    <ul className="space-y-1">
                      {detail.pastDue.map((req) => (
                        <li
                          key={req}
                          className="flex items-center gap-2 text-body-sm text-n-700"
                        >
                          <XCircle className="h-3.5 w-3.5 text-red-500" />
                          {formatRequirement(req)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detail.currentlyDue.length > 0 && (
                  <div>
                    <p className="text-label text-body-sm font-medium text-amber-600 mb-2">
                      À compléter
                    </p>
                    <ul className="space-y-1">
                      {detail.currentlyDue.map((req) => (
                        <li
                          key={req}
                          className="flex items-center gap-2 text-body-sm text-n-700"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          {formatRequirement(req)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detail.pendingVerification.length > 0 && (
                  <div>
                    <p className="text-label text-body-sm font-medium text-blue-600 mb-2">
                      En cours de vérification
                    </p>
                    <ul className="space-y-1">
                      {detail.pendingVerification.map((req) => (
                        <li
                          key={req}
                          className="flex items-center gap-2 text-body-sm text-n-700"
                        >
                          <Shield className="h-3.5 w-3.5 text-blue-500" />
                          {formatRequirement(req)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {!hasRequirements && detail.kyc === "VERIFIED" && (
            <Card>
              <CardBody>
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-body font-medium">
                    Tous les documents ont été vérifiés et les paiements sont activés.
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Quick stats */}
          <Card>
            <CardBody className="space-y-3">
              <h4 className="text-label text-body-sm font-medium text-n-700">
                Statistiques vendeur
              </h4>
              <div className="flex justify-between">
                <span className="text-caption text-n-500">Note</span>
                <span className="text-body-sm text-ink">
                  {detail.rating != null ? detail.rating.toFixed(1) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-caption text-n-500">Annonces</span>
                <span className="text-body-sm text-ink">{detail.listingsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-caption text-n-500">Ventes</span>
                <span className="text-body-sm text-ink">{detail.salesCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-caption text-n-500">Avis</span>
                <span className="text-body-sm text-ink">{detail.reviewsCount}</span>
              </div>
              <hr className="border-n-100" />
              <Link
                href={`/users/${detail.id}`}
                className="text-body-sm text-primary hover:underline"
              >
                Voir le profil complet →
              </Link>
            </CardBody>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardBody className="space-y-3">
              <h4 className="text-label text-body-sm font-medium text-n-700">
                Actions rapides
              </h4>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser depuis Stripe
              </Button>
              {(detail.kyc === "UNVERIFIED" || detail.kyc === "PENDING") && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleResendOnboarding}
                  disabled={resending}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Renvoyer lien onboarding
                </Button>
              )}
              <Link href={`/users/${detail.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Gérer l&apos;utilisateur
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
