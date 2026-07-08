import type { SupabaseClient } from "@supabase/supabase-js";
import type { Objective, Platform } from "@/lib/metrics/objective";
import type { MetricRow } from "@/lib/metrics/summary";

export type CampaignRow = {
  id: string;
  name: string;
  platform: Platform;
  objective: Objective;
  catalog_name: string | null;
};

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
        "id, campaign_id, date, spend, impressions, reach, frequency, clicks, post_engagements, video_views, leads, conversions, purchases, revenue"
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
