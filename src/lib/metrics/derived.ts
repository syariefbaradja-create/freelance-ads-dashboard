/**
 * Derived metrics (PRD 6): computed on-the-fly from raw fields, never
 * stored, so they stay consistent if raw fields are edited later.
 */

function ratio(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || denominator == null || denominator === 0) return null;
  return numerator / denominator;
}

export function calcCTR(clicks: number | null, impressions: number | null) {
  const r = ratio(clicks, impressions);
  return r == null ? null : r * 100;
}

export function calcCPC(spend: number | null, clicks: number | null) {
  return ratio(spend, clicks);
}

export function calcCPM(spend: number | null, impressions: number | null) {
  const r = ratio(spend, impressions);
  return r == null ? null : r * 1000;
}

export function calcCostPerEngagement(
  spend: number | null,
  postEngagements: number | null
) {
  return ratio(spend, postEngagements);
}

export function calcCPL(spend: number | null, leads: number | null) {
  return ratio(spend, leads);
}

export function calcCPA(spend: number | null, conversions: number | null) {
  return ratio(spend, conversions);
}

export function calcROAS(revenue: number | null, spend: number | null) {
  return ratio(revenue, spend);
}

/** Formats a number for display, or an em dash when there's nothing to show. */
export function formatNumber(value: number | null | undefined, decimals = 0) {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return "Rp" + value.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

export function formatPercent(value: number | null | undefined, decimals = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("id-ID", { maximumFractionDigits: decimals }) + "%";
}

export function formatRatio(value: number | null | undefined, decimals = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("id-ID", { maximumFractionDigits: decimals }) + "x";
}
