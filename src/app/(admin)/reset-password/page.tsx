"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Logo } from "@/components/shared/Wordmark";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const strength = scorePassword(pwd);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <Logo />
        <div>
          <h1 className="text-h1 font-medium tracking-tight text-ink">
            Définir un nouveau mot de passe
          </h1>
          <p className="mt-1 text-body text-n-500">
            Au moins 12 caractères, avec une majuscule, un chiffre et un symbole.
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pwd !== pwd2) {
              setError("Les deux mots de passe ne correspondent pas.");
              return;
            }
            if (strength < 3) {
              setError("Mot de passe trop faible.");
              return;
            }
            setError(null);
            // The recovery link established a session; update the password on it.
            const supabase = createClient();
            const { error: updateError } = await supabase.auth.updateUser({
              password: pwd,
            });
            if (updateError) {
              setError(
                "Lien expiré ou invalide. Redemandez un e-mail de réinitialisation.",
              );
              return;
            }
            await supabase.auth.signOut();
            router.push("/login");
          }}
        >
          <Field label="Nouveau mot de passe" required>
            <Input
              type="password"
              required
              placeholder="••••••••••••"
              value={pwd}
              onChange={(e) => setPwd(e.currentTarget.value)}
              leadingIcon={<Lock className="h-4 w-4" />}
            />
          </Field>
          <div className="flex h-1 overflow-hidden rounded bg-n-100">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`flex-1 ${
                  i <= strength
                    ? strength <= 1
                      ? "bg-danger"
                      : strength === 2
                        ? "bg-warning"
                        : "bg-success"
                    : ""
                }`}
              />
            ))}
          </div>
          <Field label="Confirmer le mot de passe" required error={error ?? undefined}>
            <Input
              type="password"
              required
              placeholder="••••••••••••"
              value={pwd2}
              onChange={(e) => setPwd2(e.currentTarget.value)}
              invalid={Boolean(error)}
              leadingIcon={<Lock className="h-4 w-4" />}
            />
          </Field>
          <Button type="submit" className="w-full">
            Mettre à jour
          </Button>
        </form>
      </div>
    </div>
  );
}

function scorePassword(p: string): number {
  let s = 0;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
