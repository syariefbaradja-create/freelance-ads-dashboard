import type { SupabaseClient } from "@supabase/supabase-js";
import type { Objective, Platform } from "@/lib/metrics/objective";
import type { MetricRow } from "@/lib/metrics/summary";
import type { CampaignRow } from "@/lib/metrics/campaign-row";
import { calcClientBudget, type ClientBudget } from "@/lib/metrics/budget";

export type { CampaignRow };

type MetricRowRaw = {
  id: string;
  campaign_id: string;
  date: string;
  spend: string;
  impressions: string | null;
  reach: string | null;
  frequency: string | null;
  clicks: string | null;
  post_engagements: string | null;
  video_views: string | null;
  leads: string | null;
  conversions: string | null;
  purchases: string | null;
  revenue: string | null;
  view_product_page: string | null;
  add_to_cart: string | null;
  add_to_cart_value: string | null;
};

function toNumber(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function toMetricRow(raw: MetricRowRaw): MetricRow {
  return {
    date: raw.date,
    spend: toNumber(raw.spend) ?? 0,
    impressions: toNumber(raw.impressions),
    reach: toNumber(raw.reach),
    frequency: toNumber(raw.frequency),
    clicks: toNumber(raw.clicks),
    postEngagements: toNumber(raw.post_engagements),
    videoViews: toNumber(raw.video_views),
    leads: toNumber(raw.leads),
    conversions: toNumber(raw.conversions),
    purchases: toNumber(raw.purchases),
    revenue: toNumber(raw.revenue),
    viewProductPage: toNumber(raw.view_product_page),
    addToCart: toNumber(raw.add_to_cart),
    addToCartValue: toNumber(raw.add_to_cart_value),
  };
}

export type DashboardFilters = {
  platform: Platform | null;
  objective: Objective | null;
  dateFrom: string | null;
  dateTo: string | null;
};

export type DashboardData = {
  campaigns: CampaignRow[];
  metricsByCampaign: Map<string, MetricRow[]>;
};

/**
 * Fetches via the Supabase client bound to the logged-in client's session,
 * so Row Level Security — not this code — is what actually enforces that a
 * client only ever sees their own campaigns/metrics.
 */
export async function getDashboardData(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<DashboardData> {
  let campaignsQuery = supabase
    .from("campaigns")
    .select("id, name, platform, objective, catalog_name");

  if (filters.platform) {
    campaignsQuery = campaignsQuery.eq("platform", filters.platform);
  }
  if (filters.objective) {
    campaignsQuery = campaignsQuery.eq("objective", filters.objective);
  }

  const { data: campaignRows } = await campaignsQuery;
  const campaigns = (campaignRows ?? []) as CampaignRow[];
  const campaignIds = campaigns.map((c) => c.id);

  const metricsByCampaign = new Map<string, MetricRow[]>();

  if (campaignIds.length > 0) {
    let metricsQuery = supabase
      .from("metrics")
      .select(
        "id, campaign_id, date, spend, impressions, reach, frequency, clicks, post_engagements, video_views, leads, conversions, purchases, revenue, view_product_page, add_to_cart, add_to_cart_value"
      )
      .in("campaign_id", campaignIds)
      .order("date", { ascending: true });

    if (filters.dateFrom) metricsQuery = metricsQuery.gte("date", filters.dateFrom);
    if (filters.dateTo) metricsQuery = metricsQuery.lte("date", filters.dateTo);

    const { data: metricRows } = await metricsQuery;

    for (const raw of (metricRows ?? []) as MetricRowRaw[]) {
      const row = toMetricRow(raw);
      const list = metricsByCampaign.get(raw.campaign_id) ?? [];
      list.push(row);
      metricsByCampaign.set(raw.campaign_id, list);
    }
  }

  return { campaigns, metricsByCampaign };
}

/**
 * All-time budget for the logged-in client — deliberately ignores the
 * dashboard's date/platform/objective filters, since "sisa budget" should
 * reflect every top up and every rupiah spent, not just the filtered view.
 */
export async function getClientBudget(
  supabase: SupabaseClient
): Promise<ClientBudget> {
  const [{ data: topupRows }, { data: campaignRows }] = await Promise.all([
    supabase.from("topups").select("amount"),
    supabase.from("campaigns").select("id"),
  ]);

  const totalTopup = (topupRows ?? []).reduce(
    (sum: number, t: { amount: string }) => sum + Number(t.amount),
    0
  );

  const campaignIds = (campaignRows ?? []).map((c: { id: string }) => c.id);
  let totalSpend = 0;

  if (campaignIds.length > 0) {
    const { data: metricRows } = await supabase
      .from("metrics")
      .select("spend")
      .in("campaign_id", campaignIds);

    totalSpend = (metricRows ?? []).reduce(
      (sum: number, m: { spend: string }) => sum + Number(m.spend),
      0
    );
  }

  return calcClientBudget(totalTopup, totalSpend);
}
