"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { marketingApi, ApiError, type WaitlistSource } from "@/lib/api";
import { cn } from "@/lib/utils/cn";

type Status = "idle" | "submitting" | "duplicate" | "error";

type WaitlistFormProps = {
  /** Marketing surface the signup came from — kept for attribution. */
  source?: WaitlistSource;
  /** Optional referral code captured from a `/r/[code]` invite link. */
  referralCode?: string;
  /** Submit button label. */
  cta?: string;
  /** `dark` matches the always-ink CTA panel; `light` matches the hero. */
  tone?: "light" | "dark";
  className?: string;
};

export function WaitlistForm({
  source = "homepage",
  referralCode,
  cta = "Rejoindre la liste",
  tone = "light",
  className,
}: WaitlistFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const submitting = status === "submitting";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setStatus("submitting");
    setMessage(null);

    try {
      const res = await marketingApi.joinWaitlist({ email, referralCode, source });
      if (res.duplicate) {
        // Friendly already-registered state — no double lead, no error.
        setStatus("duplicate");
        setMessage("Vous êtes déjà sur la liste — on vous écrit dès l'ouverture.");
        return;
      }
      router.push("/waitlist/confirmed");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue. Réessayez dans un instant.",
      );
    }
  }

  const inputClass =
    tone === "dark"
      ? "h-11 w-full rounded-full border border-white/15 bg-white/5 px-5 text-body text-[#FBF8F4] placeholder:text-[#FBF8F4]/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
      : "h-11 w-full rounded-full border border-n-200 bg-surface px-5 text-body text-ink placeholder:text-n-400 shadow-input-glass focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60";

  const helpClass = tone === "dark" ? "text-[#FBF8F4]/70" : "text-n-600";
  const errorClass = tone === "dark" ? "text-[#FBF8F4]" : "text-danger";

  if (status === "duplicate") {
    return (
      <div className={cn("max-w-xl", className)}>
        <p className={cn("inline-flex items-center gap-2 text-body-sm", helpClass)} role="status">
          <Check className="h-4 w-4 shrink-0 text-primary" />
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("max-w-xl", className)}>
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit} noValidate>
        <input
          type="email"
          required
          name="email"
          autoComplete="email"
          aria-label="Adresse e-mail"
          placeholder="vous@quartier.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          className={inputClass}
        />
        <Button type="submit" size="md" className="shrink-0" disabled={submitting}>
          <span>{submitting ? "Un instant…" : cta}</span>
          {!submitting && (
            <ArrowRight className="h-[1em] w-[1em] shrink-0" strokeWidth={2.25} />
          )}
        </Button>
      </form>
      {status === "error" && message && (
        <p className={cn("mt-2 text-caption", errorClass)} role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
