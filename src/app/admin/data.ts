import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, clients, metrics } from "@/db/schema";
import type { CampaignRow } from "@/lib/metrics/campaign-row";
import type { MetricRow } from "@/lib/metrics/summary";
import type { Objective, Platform } from "@/lib/metrics/objective";

export type AdminDashboardFilters = {
  clientId: string | null;
  platform: Platform | null;
  objective: Objective | null;
  dateFrom: string | null;
  dateTo: string | null;
};

function toNumber(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export async function getAdminDashboardData(filters: AdminDashboardFilters) {
  const clientsList = await db
    .select({ id: clients.id, name: clients.name, isActive: clients.isActive })
    .from(clients)
    .orderBy(asc(clients.name));

  const campaignConditions = [];
  if (filters.clientId) {
    campaignConditions.push(eq(campaigns.clientId, filters.clientId));
  }
  if (filters.platform) {
    campaignConditions.push(eq(campaigns.platform, filters.platform));
  }
  if (filters.objective) {
    campaignConditions.push(eq(campaigns.objective, filters.objective));
  }

  const campaignRows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      platform: campaigns.platform,
      objective: campaigns.objective,
      catalogName: campaigns.catalogName,
      clientId: campaigns.clientId,
      clientName: clients.name,
    })
    .from(campaigns)
    .innerJoin(clients, eq(campaigns.clientId, clients.id))
    .where(campaignConditions.length > 0 ? and(...campaignConditions) : undefined)
    .orderBy(asc(clients.name), asc(campaigns.name));

  const campaignsOut: CampaignRow[] = campaignRows.map((c) => ({
    id: c.id,
    name: c.name,
    platform: c.platform,
    objective: c.objective,
    catalog_name: c.catalogName,
    clientName: c.clientName,
  }));

  const campaignIds = campaignRows.map((c) => c.id);
  const campaignToClient = new Map(campaignRows.map((c) => [c.id, c.clientId]));

  const metricsByCampaign = new Map<string, MetricRow[]>();
  const spendByClientId = new Map<string, number>();

  if (campaignIds.length > 0) {
    const metricConditions = [inArray(metrics.campaignId, campaignIds)];
    if (filters.dateFrom) metricConditions.push(gte(metrics.date, filters.dateFrom));
    if (filters.dateTo) metricConditions.push(lte(metrics.date, filters.dateTo));

    const metricRows = await db
      .select()
      .from(metrics)
      .where(and(...metricConditions))
      .orderBy(asc(metrics.date));

    for (const raw of metricRows) {
      const row: MetricRow = {
        date: raw.date,
        spend: toNumber(raw.spend) ?? 0,
        impressions: toNumber(raw.impressions),
        reach: toNumber(raw.reach),
        frequency: toNumber(raw.frequency),
        clicks: toNumber(raw.clicks),
        postEngagements: toNumber(raw.postEngagements),
        videoViews: toNumber(raw.videoViews),
        leads: toNumber(raw.leads),
        conversions: toNumber(raw.conversions),
        purchases: toNumber(raw.purchases),
        revenue: toNumber(raw.revenue),
      };

      const list = metricsByCampaign.get(raw.campaignId) ?? [];
      list.push(row);
      metricsByCampaign.set(raw.campaignId, list);

      const clientId = campaignToClient.get(raw.campaignId);
      if (clientId) {
        spendByClientId.set(
          clientId,
          (spendByClientId.get(clientId) ?? 0) + row.spend
        );
      }
    }
  }

  const spendByClient = clientsList
    .map((c) => ({
      id: c.id,
      name: c.name,
      isActive: c.isActive,
      spend: spendByClientId.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.spend - a.spend);

  const totalSpend = Array.from(spendByClientId.values()).reduce(
    (a, b) => a + b,
    0
  );

  return {
    clientsList,
    campaigns: campaignsOut,
    metricsByCampaign,
    spendByClient,
    overview: {
      totalClients: clientsList.length,
      activeClientCount: clientsList.filter((c) => c.isActive).length,
      totalCampaigns: campaignRows.length,
      totalSpend,
    },
  };
}
