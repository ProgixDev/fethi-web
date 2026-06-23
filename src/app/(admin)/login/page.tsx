"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { Mark } from "@/components/shared/Wordmark";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PixelField } from "@/components/ui/PixelField";
import { useTheme } from "@/components/providers/ThemeProvider";
import { createClient } from "@/lib/supabase/client";

// Cursor-halftone tones invert with the theme:
//   • Light mode: bg is brand terracotta, pixels are a deep warm-black.
//   • Dark mode: bg is deep warm-black, pixels are brand terracotta.
const TONE_LIGHT_PIXEL: [number, number, number] = [14, 12, 10];
const TONE_DARK_PIXEL: [number, number, number] = [200, 85, 61];

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [submitting, setSubmitting] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const pixelTone = theme === "dark" ? TONE_DARK_PIXEL : TONE_LIGHT_PIXEL;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Brand pane — terracotta in light, deep ink in dark. The cursor-reactive
          halftone field paints the OPPOSITE tone over each surface. */}
      <aside className="relative hidden overflow-hidden bg-primary dark:bg-[#0E0C0A] lg:flex lg:items-center lg:justify-center lg:p-10">
        <PixelField tone={pixelTone} />

        {/* Manifesto, centered both vertically and horizontally over the field. */}
        <div className="relative z-10 max-w-sm space-y-4 text-center">
          <p className="font-serif text-display italic leading-[1.1] text-[#FBF8F4]">
            Quinze rues,
            <br />
            mille voisins,
            <br />
            pas une livraison.
          </p>
          <p className="text-body text-[#FBF8F4]/75">
            L&apos;administration MyStreet — pour ceux qui veillent à ce que la
            confiance reste entre voisins.
          </p>
        </div>

        {/* Date line stays at the bottom-left corner of the pane. */}
        <p className="absolute bottom-10 left-10 z-10 text-caption text-[#FBF8F4]/60">
          MyStreet · Lille, septembre 2026
        </p>
      </aside>

      <main className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Mark size={56} />
            <div>
              <h1 className="text-h1 font-medium tracking-tight text-ink">
                Connexion admin
              </h1>
              <p className="mt-1 text-body text-n-500">
                Espace réservé à l&apos;équipe MyStreet.
              </p>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              setError(null);
              const supabase = createClient();
              const { data, error: signInError } =
                await supabase.auth.signInWithPassword({
                  email: email.trim().toLowerCase(),
                  password,
                });
              if (signInError || !data.user) {
                setError("E-mail ou mot de passe incorrect.");
                setSubmitting(false);
                return;
              }
              // Authorize: only staff members may enter the admin.
              const { data: staff } = await supabase
                .from("staff_members")
                .select("roles")
                .eq("user_id", data.user.id)
                .maybeSingle();
              if (!staff) {
                await supabase.auth.signOut();
                setError("Ce compte n'a pas d'accès à l'administration.");
                setSubmitting(false);
                return;
              }
              router.push("/dashboard");
              router.refresh();
            }}
          >
            <Field label="E-mail professionnel" required>
              <Input
                type="email"
                required
                placeholder="vous@mystreet.fr"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                autoComplete="email"
              />
            </Field>
            <Field
              label="Mot de passe"
              required
              hint={
                <span>
                  <Link
                    href="/forgot-password"
                    className="text-primary hover:underline underline-offset-2"
                  >
                    Mot de passe oublié ?
                  </Link>
                </span>
              }
            >
              <Input
                type="password"
                required
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                autoComplete="current-password"
                leadingIcon={<Lock className="h-4 w-4" />}
              />
            </Field>

            {error ? (
              <p className="rounded-md bg-danger/10 px-3 py-2 text-caption text-danger">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Connexion en cours…" : "Se connecter"}
              {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
            </Button>

            {/* SSO Google Workspace : retire tant que l'OAuth backend
                n'est pas branche. On le reactive quand /admin/auth/oauth/google
                existera cote Spring. */}
          </form>

          <p className="text-caption text-n-400">
            Cette page est destinée à l&apos;administration. Vous cherchez l&apos;app ?
            <Link href="/" className="ml-1 text-primary hover:underline underline-offset-2">
              Retour au site
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
