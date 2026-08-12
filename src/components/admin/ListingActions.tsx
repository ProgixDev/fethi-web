"use client";

import * as React from "react";
import {
  CheckCircle2,
  MoreHorizontal,
  PencilLine,
  ShieldAlert,
  Star,
  Trash2,
  ExternalLink,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Drawer } from "@/components/ui/Drawer";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { Listing } from "@/lib/api";

// NOTE(WEB-020): not currently rendered by any page — listings/[id]/page.tsx
// has its own inline status actions. Kept typed against the real `Listing`
// (was on the fixture type) so it doesn't bit-rot if it's wired up later.
type Confirm = {
  title: string;
  body: string;
  variant: "primary" | "danger";
  label: string;
};

const confirms: Record<string, Confirm> = {
  publish: {
    title: "Publier cette annonce ?",
    body:
      "Elle deviendra immédiatement visible dans la carte des voisins et indexée dans les recherches.",
    variant: "primary",
    label: "Publier",
  },
  feature: {
    title: "Mettre cette annonce À la une ?",
    body:
      "Elle sera affichée en tête de la carte du quartier pendant 7 jours, en plus des badges habituels.",
    variant: "primary",
    label: "Mettre à la une",
  },
  reject: {
    title: "Rejeter cette annonce ?",
    body:
      "Elle sera retirée de la marketplace et son auteur recevra une notification expliquant le motif.",
    variant: "danger",
    label: "Rejeter",
  },
  remove: {
    title: "Supprimer définitivement ?",
    body:
      "L’annonce et son historique de vues / messages seront effacés. Préférez « Rejeter » si vous voulez conserver l’audit.",
    variant: "danger",
    label: "Supprimer",
  },
};

export function ListingActions({ listing }: { listing: Listing }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [moderateOpen, setModerateOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState<keyof typeof confirms | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  function notify(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }

  return (
    <div className="relative flex items-center gap-2" ref={ref}>
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

      <Button variant="outline" size="sm" onClick={() => setModerateOpen(true)}>
        <ShieldAlert className="h-3.5 w-3.5" />
        Modérer
      </Button>

      <Button size="sm" onClick={() => setEditOpen(true)}>
        <PencilLine className="h-3.5 w-3.5" />
        Modifier
      </Button>

      {listing.status === "DRAFT" ? (
        <Button size="sm" onClick={() => setConfirm("publish")}>
          Publier
        </Button>
      ) : null}

      {menuOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-60 overflow-hidden rounded-lg border border-n-100 bg-surface shadow-strong"
        >
          <Item
            icon={ExternalLink}
            label="Ouvrir dans l’app"
            onClick={() => {
              setMenuOpen(false);
              notify("Lien deep-link copié");
            }}
          />
          {/* No `featured` column on `listings` — "vedette" ranking is
              derived (favorites/views, see listings/featured/page.tsx), not
              a togglable flag, so this can't reflect current state. */}
          <Item
            icon={Star}
            label="Mettre à la une"
            onClick={() => {
              setMenuOpen(false);
              setConfirm("feature");
            }}
          />
          <Item
            icon={Send}
            label="Notifier l’auteur"
            onClick={() => {
              setMenuOpen(false);
              notify("Notification envoyée à l’auteur");
            }}
          />
          <div className="my-1 border-t border-n-100" />
          <Item
            icon={ShieldAlert}
            label="Rejeter (modération)"
            tone="warning"
            onClick={() => {
              setMenuOpen(false);
              setConfirm("reject");
            }}
          />
          <Item
            icon={Trash2}
            label="Supprimer"
            tone="danger"
            onClick={() => {
              setMenuOpen(false);
              setConfirm("remove");
            }}
          />
        </div>
      ) : null}

      {/* Edit drawer */}
      <Drawer
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Modifier l’annonce"
        description={listing.title}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditOpen(false);
                notify("Annonce mise à jour");
              }}
            >
              Enregistrer
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Field label="Titre">
            <Input defaultValue={listing.title} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix (€)">
              <Input
                type="number"
                defaultValue={listing.priceCents != null ? listing.priceCents / 100 : 0}
              />
            </Field>
            <Field label="Catégorie">
              <Select defaultValue={listing.categoryLabel ?? ""}>
                {[
                  "vélo",
                  "mode",
                  "maison",
                  "high-tech",
                  "jardinage",
                  "loisirs",
                  "livres",
                  "enfant",
                  "services",
                  "location",
                ].map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="URL de la photo">
            <Input defaultValue={listing.photos?.[0] ?? ""} placeholder="https://images.unsplash.com/…" />
          </Field>
          <Field label="Description">
            <Textarea rows={6} defaultValue={listing.description ?? ""} />
          </Field>
        </form>
      </Drawer>

      {/* Moderation drawer */}
      <Drawer
        open={moderateOpen}
        onOpenChange={setModerateOpen}
        title="Décision de modération"
        description="Choisissez l’issue et notez la justification (visible uniquement par l’équipe)."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setModerateOpen(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setModerateOpen(false);
                notify("Décision enregistrée — auteur notifié");
              }}
            >
              Confirmer
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Field label="Issue">
            <Select defaultValue="approve">
              <option value="approve">Approuver — laisser en ligne</option>
              <option value="warn">Avertir l’auteur (1ère infraction)</option>
              <option value="hide">Masquer temporairement</option>
              <option value="reject">Rejeter définitivement</option>
            </Select>
          </Field>
          <Field label="Catégorie de motif">
            <Select defaultValue="other">
              <option value="counterfeit">Contrefaçon</option>
              <option value="prohibited">Objet interdit</option>
              <option value="misleading">Annonce trompeuse</option>
              <option value="duplicate">Doublon</option>
              <option value="other">Autre</option>
            </Select>
          </Field>
          <Field label="Note interne">
            <Textarea rows={5} placeholder="Ce qui a motivé la décision (visible admin uniquement)." />
          </Field>
        </form>
      </Drawer>

      {/* Confirmation dialog */}
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
                notify(`${confirms[confirm].label} — action enregistrée`);
                setConfirm(null);
              }}
            >
              {confirm ? confirms[confirm].label : "Confirmer"}
            </Button>
          </>
        }
      >
        <div />
      </Dialog>

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border border-n-100 bg-surface px-4 py-2 text-body-sm text-ink shadow-strong">
          <CheckCircle2 className="h-4 w-4 text-success" />
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function Item({
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
