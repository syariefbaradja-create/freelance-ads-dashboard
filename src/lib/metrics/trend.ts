import type { MetricRow } from "./summary";
import type { MetricFieldKey, Objective } from "./objective";

// The single most representative metric to chart alongside Spend for each
// objective (there isn't room to chart every raw field at once).
export const OBJECTIVE_PRIMARY_FIELD: Record<Objective, MetricFieldKey> = {
  awareness: "reach",
  traffic: "clicks",
  engagement: "postEngagements",
  leads: "leads",
  sales: "conversions",
  meta_cpas: "purchases",
};

export type TrendPoint = {
  bucket: string;
  spend: number;
  primary: number;
};

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay(); // 0 (Sun) .. 6 (Sat)
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function buildTrend(
  rows: MetricRow[],
  granularity: "daily" | "weekly",
  primaryField: MetricFieldKey
): TrendPoint[] {
  const buckets = new Map<string, { spend: number; primary: number }>();

  for (const row of rows) {
    const key = granularity === "weekly" ? getWeekStart(row.date) : row.date;
    const existing = buckets.get(key) ?? { spend: 0, primary: 0 };
    existing.spend += row.spend;
    existing.primary += row[primaryField] ?? 0;
    buckets.set(key, existing);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, { spend, primary }]) => ({ bucket, spend, primary }));
}
