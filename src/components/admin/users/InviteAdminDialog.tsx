"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { usersApi, ApiError } from "@/lib/api";

type Role = "ADMIN" | "MODERATOR" | "FINANCE" | "SUPPORT";

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin (accès total)",
  MODERATOR: "Modérateur",
  FINANCE: "Finance",
  SUPPORT: "Support",
};

/**
 * Popup pour inviter un membre de l'équipe MyStreet en tant qu'admin.
 * Appelle POST /admin/users-management via usersApi.invite().
 */
export function InviteAdminDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreated?: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [role, setRole] = React.useState<Role>("MODERATOR");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset form chaque fois que la popup s'ouvre
  React.useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setDisplayName("");
      setRole("MODERATOR");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await usersApi.invite({
        email: email.trim().toLowerCase(),
        password,
        displayName: displayName.trim() || undefined,
        roles: [role],
      });
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Création impossible");
      } else {
        setError("Erreur réseau");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Inviter un admin"
      description="Crée un compte interne avec mot de passe initial. Le membre pourra le changer ensuite."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="E-mail professionnel" required>
          <Input
            type="email"
            required
            placeholder="prenom@mystreet.fr"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            autoComplete="off"
          />
        </Field>

        <Field label="Nom affiché">
          <Input
            type="text"
            placeholder="Marie Lambert"
            value={displayName}
            onChange={(e) => setDisplayName(e.currentTarget.value)}
            autoComplete="off"
          />
        </Field>

        <Field
          label="Mot de passe initial"
          required
          hint="Minimum 8 caractères. À transmettre en privé au nouvel admin."
        >
          <Input
            type="text"
            required
            placeholder="ChangeMe123!"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            autoComplete="new-password"
            minLength={8}
          />
        </Field>

        <Field label="Rôle" required>
          <Select
            value={role}
            onChange={(e) => setRole(e.currentTarget.value as Role)}
          >
            {(Object.keys(roleLabels) as Role[]).map((r) => (
              <option key={r} value={r}>
                {roleLabels[r]}
              </option>
            ))}
          </Select>
        </Field>

        {error ? (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-caption text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Création…" : "Créer le compte"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
