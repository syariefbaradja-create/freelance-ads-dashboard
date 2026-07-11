import { createClient } from "@/lib/supabase/server";
import {
  PLATFORM_VALUES,
  parseObjectivesParam,
  type Platform,
} from "@/lib/metrics/objective";
import { formatCurrency } from "@/lib/metrics/derived";
import { getClientBudget, getDashboardData } from "./data";
import { FilterBar } from "./filter-bar";
import { PerformanceSections } from "@/components/dashboard/performance-sections";
import { RefreshButton } from "./refresh-button";

type SearchParams = {
  from?: string;
  to?: string;
  platform?: string;
  objective?: string | string[];
  granularity?: string;
};

function isPlatform(value: string | undefined): value is Platform {
  return !!value && (PLATFORM_VALUES as readonly string[]).includes(value);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const platformFilter = isPlatform(params.platform) ? params.platform : null;
  const objectiveFilters = parseObjectivesParam(params.objective);
  const granularity = params.granularity === "daily" ? "daily" : "weekly";
  const dateFrom = params.from || null;
  const dateTo = params.to || null;

  const supabase = await createClient();
  const [{ campaigns, metricsByCampaign }, budget] = await Promise.all([
    getDashboardData(supabase, {
      platform: platformFilter,
      objectives: objectiveFilters,
      dateFrom,
      dateTo,
    }),
    getClientBudget(supabase),
  ]);

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
        objectives={objectiveFilters}
        granularity={granularity}
        from={dateFrom ?? ""}
        to={dateTo ?? ""}
      />

      {campaigns.length === 0 && (
        <div className="empty-state">
          <p className="text-2xl">📭</p>
          <p>Belum ada campaign yang cocok dengan filter ini.</p>
        </div>
      )}

      <PerformanceSections
        campaigns={campaigns}
        metricsByCampaign={Array.from(metricsByCampaign.entries())}
        granularity={granularity}
      />
    </div>
  );
}
