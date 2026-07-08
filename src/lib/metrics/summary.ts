import {
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
import { OBJECTIVE_LABELS, type Objective } from "./objective";

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
    if (row.frequency != null) {
      frequencySum += row.frequency;
      frequencyCount += 1;
    }
  }

  totals.frequency = frequencyCount > 0 ? frequencySum / frequencyCount : null;

  return totals;
}

export type SummaryCard = { label: string; value: string };

export function buildSummaryCards(
  objective: Objective,
  totals: MetricTotals
): SummaryCard[] {
  switch (objective) {
    case "awareness":
      return [
        { label: "Spend", value: formatCurrency(totals.spend) },
        { label: "Impressions", value: formatNumber(totals.impressions) },
        { label: "Reach", value: formatNumber(totals.reach) },
        { label: "Frequency", value: formatRatio(totals.frequency) },
        {
          label: "CPM",
          value: formatCurrency(calcCPM(totals.spend, totals.impressions)),
        },
      ];
    case "traffic":
      return [
        { label: "Spend", value: formatCurrency(totals.spend) },
        { label: "Impressions", value: formatNumber(totals.impressions) },
        { label: "Clicks", value: formatNumber(totals.clicks) },
        {
          label: "CTR",
          value: formatPercent(calcCTR(totals.clicks, totals.impressions)),
        },
        {
          label: "CPC",
          value: formatCurrency(calcCPC(totals.spend, totals.clicks)),
        },
      ];
    case "engagement":
      return [
        { label: "Spend", value: formatCurrency(totals.spend) },
        { label: "Impressions", value: formatNumber(totals.impressions) },
        {
          label: "Post Engagements",
          value: formatNumber(totals.postEngagements),
        },
        { label: "Video Views/ThruPlays", value: formatNumber(totals.videoViews) },
        {
          label: "Cost/Engagement",
          value: formatCurrency(
            calcCostPerEngagement(totals.spend, totals.postEngagements)
          ),
        },
      ];
    case "leads":
      return [
        { label: "Spend", value: formatCurrency(totals.spend) },
        { label: "Impressions", value: formatNumber(totals.impressions) },
        { label: "Clicks", value: formatNumber(totals.clicks) },
        { label: "Leads", value: formatNumber(totals.leads) },
        {
          label: "CPL",
          value: formatCurrency(calcCPL(totals.spend, totals.leads)),
        },
      ];
    case "sales":
      return [
        { label: "Spend", value: formatCurrency(totals.spend) },
        { label: "Impressions", value: formatNumber(totals.impressions) },
        { label: "Clicks", value: formatNumber(totals.clicks) },
        { label: "Conversions", value: formatNumber(totals.conversions) },
        {
          label: "CPA",
          value: formatCurrency(calcCPA(totals.spend, totals.conversions)),
        },
        { label: "Revenue", value: formatCurrency(totals.revenue) },
        {
          label: "ROAS",
          value: formatRatio(calcROAS(totals.revenue, totals.spend)),
        },
      ];
    case "meta_cpas":
      return [
        { label: "Spend", value: formatCurrency(totals.spend) },
        { label: "Impressions", value: formatNumber(totals.impressions) },
        { label: "Clicks", value: formatNumber(totals.clicks) },
        { label: "Purchases", value: formatNumber(totals.purchases) },
        { label: "Revenue", value: formatCurrency(totals.revenue) },
        {
          label: "ROAS",
          value: formatRatio(calcROAS(totals.revenue, totals.spend)),
        },
      ];
  }
}

export function objectiveSummaryTitle(objective: Objective) {
  return OBJECTIVE_LABELS[objective];
}
