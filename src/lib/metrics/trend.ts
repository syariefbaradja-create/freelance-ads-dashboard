import type { MetricRow } from "./summary";
import type { MetricFieldKey, Objective } from "./objective";

// Default line-2 metric per objective — keeps today's chart look as the
// default even though viewers can now pick any metric themselves.
export const OBJECTIVE_PRIMARY_FIELD: Record<Objective, MetricFieldKey> = {
  awareness: "reach",
  traffic: "clicks",
  engagement: "postEngagements",
  leads: "leads",
  sales: "conversions",
  meta_cpas: "purchases",
};

export type TrendFieldKey = "spend" | MetricFieldKey;

export type TrendPoint = { bucket: string } & Partial<
  Record<TrendFieldKey, number>
>;

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDay(); // 0 (Sun) .. 6 (Sat)
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Aggregates spend plus every raw field relevant to the objective, so the
 * chart can let viewers pick any metric to plot without re-fetching. */
export function buildTrend(
  rows: MetricRow[],
  granularity: "daily" | "weekly",
  fields: MetricFieldKey[]
): TrendPoint[] {
  const buckets = new Map<string, TrendPoint>();

  for (const row of rows) {
    const key = granularity === "weekly" ? getWeekStart(row.date) : row.date;
    const existing = buckets.get(key) ?? { bucket: key, spend: 0 };
    existing.spend = (existing.spend ?? 0) + row.spend;
    for (const field of fields) {
      existing[field] = (existing[field] ?? 0) + (row[field] ?? 0);
    }
    buckets.set(key, existing);
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.bucket.localeCompare(b.bucket)
  );
}
