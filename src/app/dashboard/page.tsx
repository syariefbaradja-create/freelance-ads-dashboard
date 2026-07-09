import { createClient } from "@/lib/supabase/server";
import {
  METRIC_FIELD_LABELS,
  OBJECTIVE_VALUES,
  PLATFORM_VALUES,
  type Objective,
  type Platform,
} from "@/lib/metrics/objective";
import { objectiveSummaryTitle } from "@/lib/metrics/summary";
import { buildSummaryGroups } from "@/lib/metrics/build-summary-groups";
import { OBJECTIVE_PRIMARY_FIELD } from "@/lib/metrics/trend";
import { formatCurrency } from "@/lib/metrics/derived";
import { getClientBudget, getDashboardData } from "./data";
import { FilterBar } from "./filter-bar";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CampaignList } from "@/components/dashboard/campaign-list";
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
  const [{ campaigns, metricsByCampaign }, budget] = await Promise.all([
    getDashboardData(supabase, {
      platform: platformFilter,
      objective: objectiveFilter,
      dateFrom,
      dateTo,
    }),
    getClientBudget(supabase),
  ]);

  const summaryGroups = buildSummaryGroups(
    campaigns,
    metricsByCampaign,
    granularity
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Ringkasan Performa</h1>
        <RefreshButton />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div>
            <p className="stat-label">Total Top Up</p>
            <p className="stat-value">{formatCurrency(budget.totalTopup)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <p className="stat-label">Total Spend</p>
            <p className="stat-value">{formatCurrency(budget.totalSpend)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏦</div>
          <div>
            <p className="stat-label">Sisa Budget</p>
            <p
              className={`mt-1 text-lg font-semibold ${
                budget.remaining < 0 ? "text-red-600" : "text-slate-900"
              }`}
            >
              {formatCurrency(budget.remaining)}
            </p>
          </div>
        </div>
      </div>

      <FilterBar
        platform={platformFilter ?? "all"}
        objective={objectiveFilter ?? "all"}
        granularity={granularity}
        from={dateFrom ?? ""}
        to={dateTo ?? ""}
      />

      {campaigns.length === 0 && (
        <p className="text-slate-500">
          Belum ada campaign yang cocok dengan filter ini.
        </p>
      )}

      {summaryGroups.map((group) => (
        <section key={group.objective}>
          <h2 className="mb-3 section-title">
            {objectiveSummaryTitle(group.objective)}
          </h2>
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {group.cards.map((card) => (
              <div key={card.label} className="card p-4">
                <p className="stat-label">{card.label}</p>
                <p className="stat-value">{card.value}</p>
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
