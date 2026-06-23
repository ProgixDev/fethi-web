"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Logo } from "@/components/shared/Wordmark";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false);
  const [email, setEmail] = React.useState("");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <Logo />
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-body-sm text-n-500 hover:text-n-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la connexion
        </Link>

        {sent ? (
          <div className="space-y-4">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success">
              <Mail className="h-4 w-4" />
            </span>
            <h1 className="text-h1 font-medium tracking-tight text-ink">
              Vérifiez votre boîte mail
            </h1>
            <p className="text-body text-n-500">
              Si un compte existe pour <strong className="text-ink">{email}</strong>,
              un lien de réinitialisation a été envoyé. Pensez à vérifier vos spams.
            </p>
            <p className="text-body-sm text-n-500">
              Pas reçu après 5 minutes ?{" "}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="text-primary hover:underline underline-offset-2"
              >
                Réessayer
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-h1 font-medium tracking-tight text-ink">
                Mot de passe oublié
              </h1>
              <p className="mt-1 text-body text-n-500">
                Entrez votre e-mail. On vous envoie un lien sécurisé.
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const supabase = createClient();
                // Don't reveal whether the address exists — always show "sent".
                await supabase.auth.resetPasswordForEmail(
                  email.trim().toLowerCase(),
                  { redirectTo: `${window.location.origin}/reset-password` },
                );
                setSent(true);
              }}
            >
              <Field label="E-mail professionnel" required>
                <Input
                  type="email"
                  required
                  placeholder="vous@mystreet.fr"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                />
              </Field>
              <Button type="submit" className="w-full">
                Recevoir le lien
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
