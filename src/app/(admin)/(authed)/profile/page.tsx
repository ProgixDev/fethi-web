"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Tabs } from "@/components/ui/Tabs";
import { Toggle } from "@/components/ui/Toggle";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";
import { staffApi, type StaffProfile } from "@/lib/api";
import type { StaffRole } from "@/lib/staff-roles";

type Tab = "general" | "security" | "preferences" | "sessions";

const roleLabel: Record<StaffRole, string> = {
  admin: "Administrateur",
  moderator: "Modérateur",
  finance: "Finance",
  support: "Support",
};

function initialsFrom(email: string | null): string {
  if (!email) return "??";
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("general");
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    staffApi
      .me()
      .then((res) => {
        if (alive) setStaff(res);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const email = staff?.email ?? null;
  const primaryRole: StaffRole | null = staff?.roles.includes("admin")
    ? "admin"
    : (staff?.roles[0] ?? null);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { label: "Profil" },
        ]}
        title="Profil"
        description="Informations du compte admin."
      />

      <section className="rounded-lg border border-n-100 bg-surface p-5">
        <div className="flex items-center gap-4">
          <Avatar initials={initialsFrom(email)} seed={email ?? "staff"} size="xl" />
          <div className="flex-1 min-w-0">
            <p className="text-h2 font-medium text-ink">
              {loading ? "Chargement…" : (email ?? "—")}
            </p>
            <p className="text-body-sm text-n-500">Identité vérifiée via la session Supabase.</p>
            <div className="mt-2 flex items-center gap-2">
              {primaryRole ? (
                <Pill tone="primary" dot>{roleLabel[primaryRole]}</Pill>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "general", label: "Général" },
          { value: "security", label: "Sécurité" },
          { value: "preferences", label: "Préférences" },
          { value: "sessions", label: "Sessions" },
        ]}
      />

      {tab === "general" ? (
        <section className="rounded-lg border border-n-100 bg-surface p-5 space-y-4">
          <p className="text-h3 font-medium text-ink">Informations</p>
          <NotConnectedNotice>
            <p className="font-medium">Seuls l&apos;e-mail et le rôle sont réels (session Supabase / `staff_members`).</p>
            <p className="mt-0.5 text-n-600">
              Il n&apos;existe pas de colonne nom/téléphone/fuseau/langue pour les comptes staff — ces
              champs ne sont pas encore modifiables depuis l&apos;admin.
            </p>
          </NotConnectedNotice>
          <fieldset disabled className="grid gap-4 md:grid-cols-2">
            <Field label="E-mail">
              <Input type="email" value={email ?? ""} readOnly />
            </Field>
            <Field label="Rôle" hint="Attribué par l'équipe via staff_members">
              <Input value={primaryRole ? roleLabel[primaryRole] : ""} readOnly />
            </Field>
            <Field label="Fuseau horaire">
              <Select defaultValue="Europe/Paris">
                <option>Europe/Paris</option>
              </Select>
            </Field>
            <Field label="Langue">
              <Select defaultValue="fr">
                <option value="fr">Français</option>
              </Select>
            </Field>
          </fieldset>
          <div className="flex items-center gap-2">
            <Button variant="primary" disabled title="Édition du profil pas encore connectée à un backend">
              Enregistrer
            </Button>
          </div>
        </section>
      ) : null}

      {tab === "security" ? (
        <section className="rounded-lg border border-n-100 bg-surface p-5 space-y-5">
          <NotConnectedNotice>
            <p className="font-medium">Sécurité du compte pas encore connectée à un backend.</p>
            <p className="mt-0.5 text-n-600">
              2FA et changement de mot de passe pour les comptes staff ne sont pas encore gérés
              depuis l&apos;admin (ils passent par Supabase Auth directement).
            </p>
          </NotConnectedNotice>
          <fieldset disabled className="space-y-5">
            <div>
              <p className="text-h3 font-medium text-ink">Authentification à 2 facteurs</p>
              <p className="mt-1 text-body-sm text-n-500">App authenticator (Google Authenticator, 1Password)</p>
              <div className="mt-3">
                <Toggle checked={false} onChange={() => {}} label="2FA désactivé" disabled />
              </div>
            </div>
            <div className="border-t border-n-100 pt-5">
              <p className="text-h3 font-medium text-ink">Mot de passe</p>
              <div className="mt-3">
                <Button variant="outline" size="sm" disabled>Changer le mot de passe</Button>
              </div>
            </div>
          </fieldset>
        </section>
      ) : null}

      {tab === "preferences" ? (
        <section className="rounded-lg border border-n-100 bg-surface p-5 space-y-4">
          <NotConnectedNotice>
            <p className="font-medium">Préférences pas encore connectées à un backend.</p>
            <p className="mt-0.5 text-n-600">
              Aucune table ne stocke de préférences de notification par membre du staff pour
              l&apos;instant.
            </p>
          </NotConnectedNotice>
          <fieldset disabled className="space-y-3">
            <Toggle checked={false} onChange={() => {}} label="E-mails de digest hebdomadaire" disabled />
            <Toggle checked={false} onChange={() => {}} label="Alertes critiques (litiges, KYC)" disabled />
            <Toggle checked={false} onChange={() => {}} label="Alertes commerciales (boost, abonnements)" disabled />
            <Toggle checked={false} onChange={() => {}} label="Mode dense (tables compactes)" disabled />
          </fieldset>
        </section>
      ) : null}

      {tab === "sessions" ? (
        <section className="rounded-lg border border-n-100 bg-surface p-5">
          <NotConnectedNotice>
            <p className="font-medium">Suivi des sessions actives pas encore connecté à un backend.</p>
            <p className="mt-0.5 text-n-600">
              Il n&apos;existe pas de table de suivi des sessions/appareils staff — impossible
              d&apos;afficher ou de révoquer des sessions depuis l&apos;admin pour l&apos;instant.
            </p>
          </NotConnectedNotice>
        </section>
      ) : null}
    </div>
  );
}
