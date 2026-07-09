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

export type SummaryCard = { label: string; value: string };

export function buildSummaryCards(
  objective: Objective,
  totals: MetricTotals
): SummaryCard[] {
  // CPM/CTR/CPC only need spend, impressions, and clicks — always
  // meaningful (and shown) regardless of objective. Rows that don't
  // collect clicks yet just show "—" for CTR/CPC until they do.
  const reachEfficiencyCards: SummaryCard[] = [
    {
      label: "CPM",
      value: formatCurrency(calcCPM(totals.spend, totals.impressions)),
    },
    {
      label: "CTR",
      value: formatPercent(calcCTR(totals.clicks, totals.impressions)),
    },
    {
      label: "CPC",
      value: formatCurrency(calcCPC(totals.spend, totals.clicks)),
    },
  ];

  switch (objective) {
    case "awareness":
      return [
        { label: "Spend", value: formatCurrency(totals.spend) },
        { label: "Impressions", value: formatNumber(totals.impressions) },
        { label: "Reach", value: formatNumber(totals.reach) },
        { label: "Frequency", value: formatRatio(totals.frequency) },
        ...reachEfficiencyCards,
      ];
    case "traffic":
      return [
        { label: "Spend", value: formatCurrency(totals.spend) },
        { label: "Impressions", value: formatNumber(totals.impressions) },
        { label: "Clicks", value: formatNumber(totals.clicks) },
        ...reachEfficiencyCards,
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
        ...reachEfficiencyCards,
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
        ...reachEfficiencyCards,
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
        ...reachEfficiencyCards,
      ];
    case "meta_cpas":
      return [
        { label: "Spend", value: formatCurrency(totals.spend) },
        { label: "Impressions", value: formatNumber(totals.impressions) },
        { label: "Clicks", value: formatNumber(totals.clicks) },
        {
          label: "View Product Page",
          value: formatNumber(totals.viewProductPage),
        },
        { label: "Add to Cart", value: formatNumber(totals.addToCart) },
        {
          label: "Add to Cart Value",
          value: formatCurrency(totals.addToCartValue),
        },
        {
          label: "Cost/Add to Cart",
          value: formatCurrency(
            calcCostPerAddToCart(totals.spend, totals.addToCart)
          ),
        },
        {
          label: "Add to Cart Rate",
          value: formatPercent(
            calcAddToCartRate(totals.addToCart, totals.viewProductPage)
          ),
        },
        { label: "Purchases", value: formatNumber(totals.purchases) },
        {
          label: "Conversion Rate",
          value: formatPercent(
            calcCartToPurchaseRate(totals.purchases, totals.addToCart)
          ),
        },
        {
          label: "Cost/Purchase",
          value: formatCurrency(calcCPA(totals.spend, totals.purchases)),
        },
        { label: "Revenue", value: formatCurrency(totals.revenue) },
        {
          label: "ROAS",
          value: formatRatio(calcROAS(totals.revenue, totals.spend)),
        },
        ...reachEfficiencyCards,
      ];
  }
}

export function objectiveSummaryTitle(objective: Objective) {
  return OBJECTIVE_LABELS[objective];
}
