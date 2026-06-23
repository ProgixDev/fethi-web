"use client";

import * as React from "react";
import { ShieldAlert, ShieldCheck, Ban } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { Pill } from "@/components/ui/Pill";
import { usersApi, type AdminUserListItem } from "@/lib/api";

type Action = "SUSPENDED" | "BANNED" | "ACTIVE";

const statusTone: Record<
  AdminUserListItem["status"],
  React.ComponentProps<typeof Pill>["tone"]
> = {
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

const confirmCopy: Record<Action, { title: string; body: string; label: string; danger: boolean }> = {
  SUSPENDED: {
    title: "Suspendre ce compte ?",
    body: "L’utilisateur ne pourra plus publier ni transiger jusqu’à réactivation. Action auditée.",
    label: "Suspendre",
    danger: true,
  },
  BANNED: {
    title: "Bannir ce compte ?",
    body: "Le compte est banni de MyStreet. Action réversible par réactivation, mais auditée.",
    label: "Bannir",
    danger: true,
  },
  ACTIVE: {
    title: "Réactiver ce compte ?",
    body: "Le compte retrouve un accès normal à MyStreet. Action auditée.",
    label: "Réactiver",
    danger: false,
  },
};

/**
 * Staff suspend / ban / reactivate panel on the user-detail screen. Calls
 * `usersApi.setStatus`, which hits the staff-gated route handler (service-role
 * write to `profiles.status` + SCR-004 audit). The button set reflects the
 * current status; reactivating an already-active user is hidden (no-op).
 */
export function UserModerationActions({ userId }: { userId: string }) {
  const [user, setUser] = React.useState<AdminUserListItem | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<Action | null>(null);
  const [confirm, setConfirm] = React.useState<Action | null>(null);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    usersApi
      .get(userId)
      .then(setUser)
      .catch((e: { message?: string }) => setLoadError(e?.message ?? "Erreur"));
  }, [userId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function apply(next: Action) {
    setPending(next);
    setError(null);
    try {
      const updated = await usersApi.setStatus(userId, next, reason || undefined);
      setUser(updated);
      setConfirm(null);
      setReason("");
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Échec de l’action.");
    } finally {
      setPending(null);
    }
  }

  if (loadError) return null;
  if (!user) return null;

  const isActive = user.status === "ACTIVE" || user.status === "PENDING";

  return (
    <div
      data-testid="user-moderation"
      data-user-status={user.status}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-caption text-n-500">Statut :</span>
      <Pill tone={statusTone[user.status]} dot>
        {statusLabel[user.status]}
      </Pill>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {isActive ? (
          <>
            <Button
              size="sm"
              variant="outline"
              data-testid="action-suspend"
              disabled={pending !== null}
              onClick={() => setConfirm("SUSPENDED")}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Suspendre
            </Button>
            <Button
              size="sm"
              variant="danger"
              data-testid="action-ban"
              disabled={pending !== null}
              onClick={() => setConfirm("BANNED")}
            >
              <Ban className="h-3.5 w-3.5" />
              Bannir
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            data-testid="action-reactivate"
            disabled={pending !== null}
            onClick={() => setConfirm("ACTIVE")}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Réactiver
          </Button>
        )}
      </div>

      {error ? (
        <p data-testid="moderation-error" className="w-full text-caption text-danger">
          {error}
        </p>
      ) : null}

      <Dialog
        open={confirm !== null}
        onOpenChange={(o) => {
          if (!o) {
            setConfirm(null);
            setReason("");
          }
        }}
        title={confirm ? confirmCopy[confirm].title : ""}
        description={confirm ? confirmCopy[confirm].body : ""}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirm(null)}>
              Annuler
            </Button>
            <Button
              size="sm"
              variant={confirm && confirmCopy[confirm].danger ? "danger" : "primary"}
              data-testid="confirm-action"
              disabled={pending !== null}
              onClick={() => confirm && apply(confirm)}
            >
              {confirm ? confirmCopy[confirm].label : "Confirmer"}
            </Button>
          </>
        }
      >
        <Field label="Motif (optionnel, audité)">
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            placeholder="Ex. signalements répétés, fraude présumée…"
          />
        </Field>
      </Dialog>
    </div>
  );
}
