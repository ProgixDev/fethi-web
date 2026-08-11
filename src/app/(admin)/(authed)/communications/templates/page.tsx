import { Bell, Mail, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Modèles de messages" };

const templates = [
  { id: "welcome", name: "Bienvenue", desc: "Premier message après inscription", channels: ["email", "in-app"], lastEdited: "2026-04-22T10:00:00Z" },
  { id: "listing_published", name: "Annonce publiée", desc: "Confirmation au vendeur", channels: ["push", "email"], lastEdited: "2026-04-30T14:00:00Z" },
  { id: "message_received", name: "Nouveau message", desc: "Acheteur ↔ vendeur", channels: ["push"], lastEdited: "2026-04-15T09:30:00Z" },
  { id: "kyc_verified", name: "KYC validé", desc: "Identité confirmée", channels: ["email", "in-app"], lastEdited: "2026-04-08T11:42:00Z" },
  { id: "payout_completed", name: "Versement effectué", desc: "Notification fonds reçus", channels: ["email", "push"], lastEdited: "2026-05-01T16:14:00Z" },
  { id: "dispute_opened", name: "Litige ouvert", desc: "Alerte aux deux parties", channels: ["email"], lastEdited: "2026-04-19T08:50:00Z" },
  { id: "kyc_pending_reminder", name: "Rappel KYC", desc: "Relance après 48 h", channels: ["email", "in-app"], lastEdited: "2026-04-10T17:00:00Z" },
  { id: "boost_offer", name: "Offre Boost", desc: "Suggestion premium", channels: ["push", "email"], lastEdited: "2026-04-26T13:00:00Z" },
];

const channelIcon: Record<string, React.ReactNode> = {
  email: <Mail className="h-3 w-3" />,
  push: <Smartphone className="h-3 w-3" />,
  "in-app": <Bell className="h-3 w-3" />,
};

const channelLabel: Record<string, string> = {
  email: "E-mail",
  push: "Push",
  "in-app": "In-app",
};

export default function CommunicationsTemplatesPage() {
  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/communications/notifications", label: "Communications" },
          { label: "Modèles" },
        ]}
        title="Modèles de messages"
        description="Bibliothèque de modèles transactionnels et marketing."
        actions={
          <Button variant="primary" disabled title="Édition de modèles pas encore connectée à un backend">
            Nouveau modèle
          </Button>
        }
      />

      <NotConnectedNotice>
        <p className="font-medium">Bibliothèque non connectée à un backend.</p>
        <p className="mt-0.5 text-n-600">
          Ces modèles sont des exemples illustratifs — créer ou modifier un modèle
          n&apos;est pas encore possible depuis l&apos;admin.
        </p>
      </NotConnectedNotice>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border border-n-100 bg-surface p-5 hover:shadow-medium transition-shadow">
            <p className="text-body font-medium text-ink">{t.name}</p>
            <p className="mt-1 text-body-sm text-n-500">{t.desc}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {t.channels.map((c) => (
                <Pill key={c} tone="neutral">
                  {channelIcon[c]} {channelLabel[c]}
                </Pill>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-caption text-n-500">Modifié le {formatDate(t.lastEdited)}</p>
              <Button variant="outline" size="sm" disabled>Modifier</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
