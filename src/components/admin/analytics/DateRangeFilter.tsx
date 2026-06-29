"use client";

import * as React from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { AnalyticsRange } from "@/lib/api";

/** Default range: the last 30 days, in ISO `YYYY-MM-DD` (UTC). */
export function defaultRange(): Required<AnalyticsRange> {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 29);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

/**
 * Date-range filter for the analytics dashboards. Controlled by the parent page;
 * `onApply` is fired with the chosen `{ from, to }` so the page can re-query the
 * staff-gated analytics route handlers.
 */
export function DateRangeFilter({
  value,
  onApply,
  loading,
}: {
  value: Required<AnalyticsRange>;
  onApply: (range: Required<AnalyticsRange>) => void;
  loading?: boolean;
}) {
  const [from, setFrom] = React.useState(value.from);
  const [to, setTo] = React.useState(value.to);

  return (
    <section className="flex flex-wrap items-end gap-3 rounded-lg border border-n-100 bg-surface p-4">
      <Field label="Du" className="w-40">
        <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
      </Field>
      <Field label="Au" className="w-40">
        <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
      </Field>
      <Button
        variant="primary"
        disabled={loading || !from || !to}
        onClick={() => onApply({ from, to })}
      >
        {loading ? "Chargement…" : "Appliquer"}
      </Button>
    </section>
  );
}
