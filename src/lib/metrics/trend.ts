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
  // frequency is an average metric (like in aggregateMetrics), not a sum —
  // tracked separately per bucket so it can be divided out at the end.
  const frequencySums = new Map<string, { sum: number; count: number }>();

  for (const row of rows) {
    const key = granularity === "weekly" ? getWeekStart(row.date) : row.date;
    const existing = buckets.get(key) ?? { bucket: key, spend: 0 };
    existing.spend = (existing.spend ?? 0) + row.spend;
    for (const field of fields) {
      if (field === "frequency") continue;
      existing[field] = (existing[field] ?? 0) + (row[field] ?? 0);
    }
    buckets.set(key, existing);

    if (fields.includes("frequency") && row.frequency != null) {
      const freq = frequencySums.get(key) ?? { sum: 0, count: 0 };
      freq.sum += row.frequency;
      freq.count += 1;
      frequencySums.set(key, freq);
    }
  }

  for (const [key, point] of buckets) {
    const freq = frequencySums.get(key);
    point.frequency = freq ? freq.sum / freq.count : undefined;
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.bucket.localeCompare(b.bucket)
  );
}
