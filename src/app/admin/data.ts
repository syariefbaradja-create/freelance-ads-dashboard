import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, clients, metrics, topups } from "@/db/schema";
import type { CampaignRow } from "@/lib/metrics/campaign-row";
import type { MetricRow } from "@/lib/metrics/summary";
import type { Objective, Platform } from "@/lib/metrics/objective";
import { calcBudgetBreakdown, calcClientBudget } from "@/lib/metrics/budget";

export type AdminDashboardFilters = {
  clientId: string | null;
  platform: Platform | null;
  objectives: Objective[];
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
  if (filters.objectives.length > 0) {
    campaignConditions.push(inArray(campaigns.objective, filters.objectives));
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

  const metricsByCampaign = new Map<string, MetricRow[]>();
  let totalSpend = 0;

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
        viewProductPage: toNumber(raw.viewProductPage),
        addToCart: toNumber(raw.addToCart),
        addToCartValue: toNumber(raw.addToCartValue),
      };

      const list = metricsByCampaign.get(raw.campaignId) ?? [];
      list.push(row);
      metricsByCampaign.set(raw.campaignId, list);
      totalSpend += row.spend;
    }
  }

  // Budget per client is deliberately all-time (unfiltered) — "sisa budget"
  // must reflect every top up and every rupiah ever spent, not just the
  // slice currently being viewed above.
  const [allCampaigns, allTopups] = await Promise.all([
    db
      .select({
        id: campaigns.id,
        clientId: campaigns.clientId,
        platform: campaigns.platform,
        objective: campaigns.objective,
      })
      .from(campaigns),
    db
      .select({
        clientId: topups.clientId,
        amount: topups.amount,
        platformCategory: topups.platformCategory,
      })
      .from(topups),
  ]);

  const allCampaignToClient = new Map(
    allCampaigns.map((c) => [c.id, c.clientId])
  );
  const allCampaignIds = allCampaigns.map((c) => c.id);

  const allTimeMetrics =
    allCampaignIds.length > 0
      ? await db
          .select({ campaignId: metrics.campaignId, spend: metrics.spend })
          .from(metrics)
      : [];

  const allTimeSpendByClient = new Map<string, number>();
  const allTimeSpendByCampaign = new Map<string, number>();
  for (const m of allTimeMetrics) {
    allTimeSpendByCampaign.set(
      m.campaignId,
      (allTimeSpendByCampaign.get(m.campaignId) ?? 0) + Number(m.spend)
    );
    const clientId = allCampaignToClient.get(m.campaignId);
    if (!clientId) continue;
    allTimeSpendByClient.set(
      clientId,
      (allTimeSpendByClient.get(clientId) ?? 0) + Number(m.spend)
    );
  }

  // Global per-platform summary (all clients combined) — same categories
  // as each client's own budget breakdown page, just aggregated across
  // everyone. Legacy uncategorized top ups are deliberately left out here
  // (they still show up as "Umum" on the per-client breakdown page).
  const { categories: platformBudget } = calcBudgetBreakdown(
    allTopups
      .filter((t) => t.platformCategory != null)
      .map((t) => ({
        amount: Number(t.amount),
        category: t.platformCategory,
      })),
    allCampaigns.map((c) => ({
      platform: c.platform,
      objective: c.objective,
      spend: allTimeSpendByCampaign.get(c.id) ?? 0,
    }))
  );

  const allTimeTopupByClient = new Map<string, number>();
  for (const t of allTopups) {
    allTimeTopupByClient.set(
      t.clientId,
      (allTimeTopupByClient.get(t.clientId) ?? 0) + Number(t.amount)
    );
  }

  const budgetByClient = clientsList
    .map((c) => ({
      id: c.id,
      name: c.name,
      isActive: c.isActive,
      ...calcClientBudget(
        allTimeTopupByClient.get(c.id) ?? 0,
        allTimeSpendByClient.get(c.id) ?? 0
      ),
    }))
    .sort((a, b) => b.remaining - a.remaining);

  return {
    clientsList,
    campaigns: campaignsOut,
    metricsByCampaign,
    budgetByClient,
    platformBudget,
    overview: {
      totalClients: clientsList.length,
      activeClientCount: clientsList.filter((c) => c.isActive).length,
      totalCampaigns: campaignRows.length,
      totalSpend,
    },
  };
}
