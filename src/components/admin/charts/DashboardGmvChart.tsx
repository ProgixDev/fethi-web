"use client";

import { AreaChart } from "./Chart";
import { colors } from "@/lib/tokens";
import type { TrendPoint } from "@/lib/api";

// GMV/signups per-day trend from the real analytics read models (WEB-014):
// `analyticsApi.marketplace().gmvTrend` (cents, converted to euros below) and
// `analyticsApi.signupsTrend()` (headcount). Both default to the last 30 days
// when the caller passes no range, so they line up date-for-date; merged by
// date rather than by index to stay correct if that ever changes.
export function DashboardGmvChart({
  gmvTrend,
  signupsTrend,
}: {
  gmvTrend: TrendPoint[];
  signupsTrend: TrendPoint[];
}) {
  const signupsByDate = new Map(signupsTrend.map((p) => [p.date, p.count]));
  const data = gmvTrend.map((d) => ({
    date: d.date.slice(5),
    gmv: d.count / 100,
    signups: signupsByDate.get(d.date) ?? 0,
  }));
  return (
    <AreaChart
      height={260}
      data={data}
      series={[
        { key: "gmv", label: "GMV", color: colors.primary },
        { key: "signups", label: "Inscriptions", color: colors.accent },
      ]}
      formatY={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
    />
  );
}
