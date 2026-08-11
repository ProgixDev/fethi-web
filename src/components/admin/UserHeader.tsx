"use client";

import * as React from "react";
import {
  Mail,
  MapPin,
  MoreHorizontal,
  Star,
  Send,
  CheckCircle2,
  Shield,
  Ban,
  KeyRound,
  ShieldOff,
} from "lucide-react";
import { NavTabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { AdminUserListItem } from "@/lib/api";
import { formatDate, initials } from "@/lib/utils/format";

// Same status/kyc enums (and tone convention) as UserModerationActions, which
// reads the same AdminUserListItem from usersApi.get().
const statusTone: Record<AdminUserListItem["status"], React.ComponentProps<typeof Pill>["tone"]> = {
  ACTIVE: "success",
  PENDING: "warning",
  SUSPENDED: "danger",
  BANNED: "danger",
};
const statusLabel: Record<AdminUserListItem["status"], string> = {
  ACTIVE: "Actif",
  PENDING: "En attente",
  SUSPENDED: "Suspendu",
  BANNED: "Banni",
};

const kycLabel: Record<AdminUserListItem["kyc"], string> = {
  VERIFIED: "KYC Vérifié",
  PENDING: "KYC en cours",
  REVIEW: "KYC à examiner",
  UNVERIFIED: "KYC non fait",
  REJECTED: "KYC refusé",
};

type Confirm = {
  title: string;
  body: string;
  variant: "primary" | "danger";
  confirmLabel: string;
};

const confirms: Record<string, Confirm> = {
  suspend: {
    title: "Suspendre ce compte ?",
    body:
      "Le compte sera désactivé temporairement. L’utilisateur ne pourra plus se connecter ni publier, mais ses annonces actives restent visibles 24 h. Réversible.",
    variant: "primary",
    confirmLabel: "Suspendre",
  },
  rekyc: {
    title: "Demander un re-KYC ?",
    body:
      "L’utilisateur recevra un e-mail l’invitant à re-soumettre ses pièces d’identité. Tous les paiements en attente seront mis en pause.",
    variant: "primary",
    confirmLabel: "Demander",
  },
  ban: {
    title: "Bannir définitivement ?",
    body:
      "Le compte sera fermé et ses annonces retirées. Le bannissement est irréversible — utilisez la suspension si vous avez le moindre doute.",
    variant: "danger",
    confirmLabel: "Bannir",
  },
  resetpw: {
    title: "Forcer la réinitialisation du mot de passe ?",
    body:
      "Toutes les sessions actives seront déconnectées et l’utilisateur recevra un lien sécurisé pour choisir un nouveau mot de passe.",
    variant: "primary",
    confirmLabel: "Réinitialiser",
  },
};

export function UserHeader({ user }: { user: AdminUserListItem }) {
  const [messageOpen, setMessageOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState<keyof typeof confirms | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close popover on outside click
  React.useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  function notify(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-5">
        <Avatar initials={initials(user.name)} seed={user.id} size="xl" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h1 font-medium tracking-tight text-ink">{user.name}</h1>
            <Pill tone={statusTone[user.status]} dot>
              {statusLabel[user.status]}
            </Pill>
            <Pill tone={user.kyc === "VERIFIED" ? "accent" : "neutral"}>
              {kycLabel[user.kyc]}
            </Pill>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-n-500">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {user.neighborhood ?? "—"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              {user.rating.toFixed(1).replace(".", ",")}{" "}
              <span className="text-n-400">({user.reviewsCount})</span>
            </span>
            <span>Inscrit {formatDate(user.createdAt)}</span>
          </div>
        </div>

        <div className="relative flex items-center gap-2" ref={menuRef}>
          <Button variant="outline" size="sm" onClick={() => setMessageOpen(true)}>
            Envoyer un message
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Plus d’actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+8px)] z-30 w-60 overflow-hidden rounded-lg border border-n-100 bg-surface shadow-strong"
            >
              <MenuItem
                icon={Shield}
                label="Demander un re-KYC"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirm("rekyc");
                }}
              />
              <MenuItem
                icon={KeyRound}
                label="Réinitialiser le mot de passe"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirm("resetpw");
                }}
              />
              <div className="my-1 border-t border-n-100" />
              <MenuItem
                icon={ShieldOff}
                label="Suspendre"
                tone="warning"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirm("suspend");
                }}
              />
              <MenuItem
                icon={Ban}
                label="Bannir"
                tone="danger"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirm("ban");
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <NavTabs
        items={[
          { href: `/users/${user.id}`, label: "Vue d'ensemble" },
          { href: `/users/${user.id}/listings`, label: "Annonces", count: user.listingsCount },
          // Transactions/reports counts dropped rather than fabricated: no
          // cheap real aggregate is wired in here (those pages fetch and
          // count client-side themselves).
          { href: `/users/${user.id}/transactions`, label: "Transactions" },
          { href: `/users/${user.id}/messages`, label: "Messages" },
          { href: `/users/${user.id}/reports`, label: "Signalements" },
          { href: `/users/${user.id}/activity`, label: "Activité" },
        ]}
      />

      {/* Message drawer */}
      <Drawer
        open={messageOpen}
        onOpenChange={setMessageOpen}
        title={`Message à ${user.name}`}
        description="Envoyé via la messagerie interne MyStreet — l’utilisateur reçoit aussi un e-mail."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setMessageOpen(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setMessageOpen(false);
                notify(`Message envoyé à ${user.name}`);
              }}
            >
              <Send className="h-3.5 w-3.5" />
              Envoyer
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Field label="Modèle">
            <Select defaultValue="custom">
              <option value="custom">Message personnalisé</option>
              <option value="warning">Avertissement modération</option>
              <option value="kyc">Demande de pièces KYC</option>
              <option value="payout-delay">Information délai versement</option>
            </Select>
          </Field>
          <Field label="Sujet" required>
            <Textarea rows={1} placeholder={`À propos de votre compte MyStreet`} />
          </Field>
          <Field label="Message" required>
            <Textarea
              rows={8}
              placeholder={`Bonjour ${user.name.split(" ")[0]},\n\n…`}
            />
          </Field>
        </form>
      </Drawer>

      {/* Confirmation dialog (suspend / ban / re-kyc / reset password) */}
      <Dialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm ? confirms[confirm].title : ""}
        description={confirm ? confirms[confirm].body : ""}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirm(null)}>
              Annuler
            </Button>
            <Button
              size="sm"
              variant={confirm && confirms[confirm].variant === "danger" ? "danger" : "primary"}
              onClick={() => {
                if (!confirm) return;
                notify(`${confirms[confirm].confirmLabel} — action enregistrée`);
                setConfirm(null);
              }}
            >
              {confirm ? confirms[confirm].confirmLabel : "Confirmer"}
            </Button>
          </>
        }
      >
        <div />
      </Dialog>

      {/* Inline toast — bottom-right */}
      {toast ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border border-n-100 bg-surface px-4 py-2 text-body-sm text-ink shadow-strong">
          <CheckCircle2 className="h-4 w-4 text-success" />
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  tone?: "warning" | "danger";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-body-sm hover:bg-n-50 ${
        tone === "danger"
          ? "text-danger"
          : tone === "warning"
            ? "text-warning"
            : "text-n-700"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
