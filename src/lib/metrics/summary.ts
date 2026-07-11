import {
  calcAddToCartRate,
  calcCartToPurchaseRate,
  calcCostPerAddToCart,
  calcCPA,
  calcCPC,
  calcCPL,
  calcCPM,
  calcCTR,
  calcCostPerEngagement,
  calcROAS,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "./derived";
import { OBJECTIVE_LABELS, type MetricFieldKey, type Objective } from "./objective";

export type MetricRow = {
  date: string;
  spend: number;
  impressions: number | null;
  reach: number | null;
  frequency: number | null;
  clicks: number | null;
  postEngagements: number | null;
  videoViews: number | null;
  leads: number | null;
  conversions: number | null;
  purchases: number | null;
  revenue: number | null;
  viewProductPage: number | null;
  addToCart: number | null;
  addToCartValue: number | null;
};

export type MetricTotals = {
  spend: number;
  impressions: number;
  reach: number;
  frequency: number | null; // average across rows that have it
  clicks: number;
  postEngagements: number;
  videoViews: number;
  leads: number;
  conversions: number;
  purchases: number;
  revenue: number;
  viewProductPage: number;
  addToCart: number;
  addToCartValue: number;
  rowCount: number;
};

export function aggregateMetrics(rows: MetricRow[]): MetricTotals {
  const totals: MetricTotals = {
    spend: 0,
    impressions: 0,
    reach: 0,
    frequency: null,
    clicks: 0,
    postEngagements: 0,
    videoViews: 0,
    leads: 0,
    conversions: 0,
    purchases: 0,
    revenue: 0,
    viewProductPage: 0,
    addToCart: 0,
    addToCartValue: 0,
    rowCount: rows.length,
  };

  let frequencySum = 0;
  let frequencyCount = 0;

  for (const row of rows) {
    totals.spend += row.spend;
    totals.impressions += row.impressions ?? 0;
    totals.reach += row.reach ?? 0;
    totals.clicks += row.clicks ?? 0;
    totals.postEngagements += row.postEngagements ?? 0;
    totals.videoViews += row.videoViews ?? 0;
    totals.leads += row.leads ?? 0;
    totals.conversions += row.conversions ?? 0;
    totals.purchases += row.purchases ?? 0;
    totals.revenue += row.revenue ?? 0;
    totals.viewProductPage += row.viewProductPage ?? 0;
    totals.addToCart += row.addToCart ?? 0;
    totals.addToCartValue += row.addToCartValue ?? 0;
    if (row.frequency != null) {
      frequencySum += row.frequency;
      frequencyCount += 1;
    }
  }

  totals.frequency = frequencyCount > 0 ? frequencySum / frequencyCount : null;

  return totals;
}

/** Shape shared by MetricTotals (grand total) and TrendPoint (per-bucket
 * sums, see trend.ts) — lets one descriptor list drive both the summary
 * cards and the chart's selectable metrics without circular imports. */
export type RawMetricValues = Partial<Record<"spend" | MetricFieldKey, number | null>>;

export type MetricDescriptor = {
  key: string;
  label: string;
  getValue: (raw: RawMetricValues) => number | null;
  format: (value: number | null) => string;
};

export type SummaryCard = { key: string; label: string; value: string };

function rawMetric(
  key: "spend" | MetricFieldKey,
  label: string,
  format: (value: number | null) => string
): MetricDescriptor {
  return { key, label, getValue: (raw) => raw[key] ?? null, format };
}

// CPM/CTR/CPC only need spend, impressions, and clicks — always meaningful
// (and shown) regardless of objective. Campaigns that don't collect clicks
// yet just show "—" for CTR/CPC until they do.
const reachEfficiencyMetrics: MetricDescriptor[] = [
  {
    key: "cpm",
    label: "CPM",
    getValue: (r) => calcCPM(r.spend ?? null, r.impressions ?? null),
    format: formatCurrency,
  },
  {
    key: "ctr",
    label: "CTR",
    getValue: (r) => calcCTR(r.clicks ?? null, r.impressions ?? null),
    format: formatPercent,
  },
  {
    key: "cpc",
    label: "CPC",
    getValue: (r) => calcCPC(r.spend ?? null, r.clicks ?? null),
    format: formatCurrency,
  },
];

/** Single source of truth for both the summary cards and the chart's
 * clickable metric list for a given objective — every card here is
 * selectable as a chart line (see ObjectivePanel). */
export function getObjectiveMetricDescriptors(
  objective: Objective
): MetricDescriptor[] {
  switch (objective) {
    case "awareness":
      return [
        rawMetric("spend", "Spend", formatCurrency),
        rawMetric("impressions", "Impressions", (v) => formatNumber(v)),
        rawMetric("reach", "Reach", (v) => formatNumber(v)),
        rawMetric("frequency", "Frequency", (v) => formatRatio(v)),
        ...reachEfficiencyMetrics,
      ];
    case "traffic":
      return [
        rawMetric("spend", "Spend", formatCurrency),
        rawMetric("impressions", "Impressions", (v) => formatNumber(v)),
        rawMetric("clicks", "Clicks", (v) => formatNumber(v)),
        ...reachEfficiencyMetrics,
      ];
    case "engagement":
      return [
        rawMetric("spend", "Spend", formatCurrency),
        rawMetric("impressions", "Impressions", (v) => formatNumber(v)),
        rawMetric("postEngagements", "Post Engagements", (v) => formatNumber(v)),
        rawMetric("videoViews", "Video Views/ThruPlays", (v) => formatNumber(v)),
        {
          key: "costPerEngagement",
          label: "Cost/Engagement",
          getValue: (r) =>
            calcCostPerEngagement(r.spend ?? null, r.postEngagements ?? null),
          format: formatCurrency,
        },
        ...reachEfficiencyMetrics,
      ];
    case "leads":
      return [
        rawMetric("spend", "Spend", formatCurrency),
        rawMetric("impressions", "Impressions", (v) => formatNumber(v)),
        rawMetric("clicks", "Clicks", (v) => formatNumber(v)),
        rawMetric("leads", "Leads", (v) => formatNumber(v)),
        {
          key: "cpl",
          label: "CPL",
          getValue: (r) => calcCPL(r.spend ?? null, r.leads ?? null),
          format: formatCurrency,
        },
        ...reachEfficiencyMetrics,
      ];
    case "sales":
      return [
        rawMetric("spend", "Spend", formatCurrency),
        rawMetric("impressions", "Impressions", (v) => formatNumber(v)),
        rawMetric("clicks", "Clicks", (v) => formatNumber(v)),
        rawMetric("conversions", "Conversions", (v) => formatNumber(v)),
        {
          key: "cpa",
          label: "CPA",
          getValue: (r) => calcCPA(r.spend ?? null, r.conversions ?? null),
          format: formatCurrency,
        },
        rawMetric("revenue", "Revenue", formatCurrency),
        {
          key: "roas",
          label: "ROAS",
          getValue: (r) => calcROAS(r.revenue ?? null, r.spend ?? null),
          format: formatRatio,
        },
        ...reachEfficiencyMetrics,
      ];
    case "meta_cpas":
      return [
        rawMetric("spend", "Spend", formatCurrency),
        rawMetric("impressions", "Impressions", (v) => formatNumber(v)),
        rawMetric("clicks", "Clicks", (v) => formatNumber(v)),
        rawMetric("viewProductPage", "View Product Page", (v) => formatNumber(v)),
        rawMetric("addToCart", "Add to Cart", (v) => formatNumber(v)),
        rawMetric("addToCartValue", "Add to Cart Value", formatCurrency),
        {
          key: "costPerAddToCart",
          label: "Cost/Add to Cart",
          getValue: (r) => calcCostPerAddToCart(r.spend ?? null, r.addToCart ?? null),
          format: formatCurrency,
        },
        {
          key: "addToCartRate",
          label: "Add to Cart Rate",
          getValue: (r) =>
            calcAddToCartRate(r.addToCart ?? null, r.viewProductPage ?? null),
          format: formatPercent,
        },
        rawMetric("purchases", "Purchases", (v) => formatNumber(v)),
        {
          key: "conversionRate",
          label: "Conversion Rate",
          getValue: (r) => calcCartToPurchaseRate(r.purchases ?? null, r.addToCart ?? null),
          format: formatPercent,
        },
        {
          key: "costPerPurchase",
          label: "Cost/Purchase",
          getValue: (r) => calcCPA(r.spend ?? null, r.purchases ?? null),
          format: formatCurrency,
        },
        rawMetric("revenue", "Revenue", formatCurrency),
        {
          key: "roas",
          label: "ROAS",
          getValue: (r) => calcROAS(r.revenue ?? null, r.spend ?? null),
          format: formatRatio,
        },
        ...reachEfficiencyMetrics,
      ];
  }
}

export function buildSummaryCards(
  objective: Objective,
  totals: MetricTotals
): SummaryCard[] {
  return getObjectiveMetricDescriptors(objective).map((d) => ({
    key: d.key,
    label: d.label,
    value: d.format(d.getValue(totals)),
  }));
}

export function objectiveSummaryTitle(objective: Objective) {
  return OBJECTIVE_LABELS[objective];
}
