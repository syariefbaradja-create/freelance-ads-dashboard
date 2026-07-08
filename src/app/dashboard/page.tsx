import { createClient } from "@/lib/supabase/server";
import {
  METRIC_FIELD_LABELS,
  OBJECTIVE_VALUES,
  PLATFORM_VALUES,
  type Objective,
  type Platform,
} from "@/lib/metrics/objective";
import {
  aggregateMetrics,
  buildSummaryCards,
  objectiveSummaryTitle,
} from "@/lib/metrics/summary";
import { buildTrend, OBJECTIVE_PRIMARY_FIELD } from "@/lib/metrics/trend";
import { getDashboardData } from "./data";
import { FilterBar } from "./filter-bar";
import { TrendChart } from "./trend-chart";
import { CampaignList } from "./campaign-list";
import { RefreshButton } from "./refresh-button";

type SearchParams = {
  from?: string;
  to?: string;
  platform?: string;
  objective?: string;
  granularity?: string;
};

function isPlatform(value: string | undefined): value is Platform {
  return !!value && (PLATFORM_VALUES as readonly string[]).includes(value);
}

function isObjective(value: string | undefined): value is Objective {
  return !!value && (OBJECTIVE_VALUES as readonly string[]).includes(value);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const platformFilter = isPlatform(params.platform) ? params.platform : null;
  const objectiveFilter = isObjective(params.objective)
    ? params.objective
    : null;
  const granularity = params.granularity === "daily" ? "daily" : "weekly";
  const dateFrom = params.from || null;
  const dateTo = params.to || null;

  const supabase = await createClient();
  const { campaigns, metricsByCampaign } = await getDashboardData(supabase, {
    platform: platformFilter,
    objective: objectiveFilter,
    dateFrom,
    dateTo,
  });

  const objectivesPresent = Array.from(
    new Set(campaigns.map((c) => c.objective))
  );

  const summaryGroups = objectivesPresent.map((objective) => {
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Ringkasan Performa
        </h1>
        <RefreshButton />
      </div>

      <FilterBar
        platform={platformFilter ?? "all"}
        objective={objectiveFilter ?? "all"}
        granularity={granularity}
        from={dateFrom ?? ""}
        to={dateTo ?? ""}
      />

      {campaigns.length === 0 && (
        <p className="text-gray-500">
          Belum ada campaign yang cocok dengan filter ini.
        </p>
      )}

      {summaryGroups.map((group) => (
        <section key={group.objective}>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            {objectiveSummaryTitle(group.objective)}
          </h2>
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {group.cards.map((card) => (
              <div
                key={card.label}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
          <TrendChart
            data={group.trend}
            primaryLabel={
              METRIC_FIELD_LABELS[OBJECTIVE_PRIMARY_FIELD[group.objective]]
            }
          />
        </section>
      ))}

      <CampaignList campaigns={campaigns} metricsByCampaign={metricsByCampaign} />
    </div>
  );
}
