import type { CampaignRow } from "./campaign-row";
import type { Objective } from "./objective";
import { aggregateMetrics, buildSummaryCards, type MetricRow, type SummaryCard } from "./summary";
import { buildTrend, OBJECTIVE_PRIMARY_FIELD, type TrendPoint } from "./trend";

export type SummaryGroup = {
  objective: Objective;
  cards: SummaryCard[];
  trend: TrendPoint[];
};

export function buildSummaryGroups(
  campaigns: CampaignRow[],
  metricsByCampaign: Map<string, MetricRow[]>,
  granularity: "daily" | "weekly"
): SummaryGroup[] {
  const objectivesPresent = Array.from(
    new Set(campaigns.map((c) => c.objective))
  );

  return objectivesPresent.map((objective) => {
    const idsForObjective = campaigns
      .filter((c) => c.objective === objective)
      .map((c) => c.id);
    const rows = idsForObjective.flatMap(
      (id) => metricsByCampaign.get(id) ?? []
    );
    return {
      objective,
      cards: buildSummaryCards(objective, aggregateMetrics(rows)),
      trend: buildTrend(rows, granularity, OBJECTIVE_PRIMARY_FIELD[objective]),
    };
  });
}
