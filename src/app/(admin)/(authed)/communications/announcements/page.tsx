"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";
import { formatDate } from "@/lib/utils/format";

const past = [
  {
    title: "Maintenance programmée le 8 mai",
    body: "Coupure d'environ 30 min entre 02 h et 02 h 30. Aucun impact sur les paiements en cours.",
    severity: "warning" as const,
    audience: "Tous",
    publishedAt: "2026-05-01T09:00:00Z",
    until: "2026-05-08T03:00:00Z",
  },
  {
    title: "Nouveau cycle de versements à J+2",
    body: "Les vendeurs reçoivent désormais leurs fonds 2 jours après confirmation de réception.",
    severity: "info" as const,
    audience: "Vendeurs",
    publishedAt: "2026-04-22T10:00:00Z",
    until: "2026-05-22T00:00:00Z",
  },
  {
    title: "Bienvenue à Wazemmes ouvert",
    body: "Le quartier Wazemmes accueille désormais les annonces — déjà 712 voisins inscrits.",
    severity: "info" as const,
    audience: "Tous",
    publishedAt: "2026-04-04T08:00:00Z",
    until: "2026-04-30T00:00:00Z",
  },
];

const sevTone: Record<string, "info" | "warning" | "danger"> = {
  info: "info",
  warning: "warning",
  critical: "danger",
};
const sevLabel: Record<string, string> = {
  info: "Info",
  warning: "Avertissement",
  critical: "Critique",
};

export default function CommunicationsAnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState("info");

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/communications/notifications", label: "Communications" },
          { label: "Annonces" },
        ]}
        title="Annonces globales"
        description="Bandeaux affichés à l'ensemble de l'application — à utiliser avec parcimonie."
      />

      <NotConnectedNotice>
        <p className="font-medium">Formulaire non connecté à un backend.</p>
        <p className="mt-0.5 text-n-600">
          Publier une annonce n&apos;envoie encore rien — le formulaire est désactivé pour
          éviter de laisser croire qu&apos;une bannière serait réellement diffusée. La liste
          ci-dessous est un exemple illustratif, pas l&apos;historique réel.
        </p>
      </NotConnectedNotice>

      <fieldset disabled className="rounded-lg border border-n-100 bg-surface p-5 opacity-60">
        <p className="text-h3 font-medium text-ink">Nouvelle annonce</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Titre" className="md:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Maintenance programmée…" />
          </Field>
          <Field label="Corps du message" className="md:col-span-2">
            <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <Field label="Sévérité">
            <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="info">Info</option>
              <option value="warning">Avertissement</option>
              <option value="critical">Critique</option>
            </Select>
          </Field>
          <Field label="Audience">
            <Select defaultValue="all">
              <option value="all">Tous les utilisateurs</option>
              <option>Vendeurs</option>
              <option>Acheteurs</option>
            </Select>
          </Field>
          <Field label="Publier dès">
            <Input type="datetime-local" defaultValue="2026-05-04T18:00" />
          </Field>
          <Field label="Jusqu&apos;au">
            <Input type="datetime-local" defaultValue="2026-05-11T00:00" />
          </Field>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <Button variant="primary" disabled>Publier</Button>
          <Button variant="outline" disabled>Aperçu</Button>
        </div>
      </fieldset>

      <section className="rounded-lg border border-n-100 bg-surface">
        <header className="border-b border-n-100 px-5 py-4">
          <p className="text-h3 font-medium text-ink">Annonces récentes</p>
        </header>
        <ul className="divide-y divide-n-100">
          {past.map((p) => (
            <li key={p.title} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <Pill tone={sevTone[p.severity]} dot>{sevLabel[p.severity]}</Pill>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-ink">{p.title}</p>
                  <p className="mt-1 text-body-sm text-n-700">{p.body}</p>
                  <p className="mt-2 text-caption text-n-500">
                    {p.audience} · publié le {formatDate(p.publishedAt)} · expire {formatDate(p.until)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
