import { Info } from "lucide-react";

/**
 * Shared "not wired to a backend yet" notice for admin shells that were built
 * as visual mockups before their data layer existed (WEB-020).
 *
 * Mirrors the warning-box pattern already used in settings/api-keys (border +
 * soft background + icon), but with the neutral `info` tone since this isn't
 * warning about a risk — it's disclosing that the page is read-only / inert.
 *
 * Pair this with the native `disabled` attribute (or `<fieldset disabled>`)
 * on every control the page renders — a labelled-but-still-clickable control
 * that discards its input is exactly the failure mode this exists to avoid.
 */
export function NotConnectedNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-info/30 bg-info-soft px-5 py-4">
      <div className="flex items-start gap-3">
        <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
        <div className="text-body-sm text-n-700">{children}</div>
      </div>
    </div>
  );
}
