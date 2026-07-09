import Link from "next/link";
import {
  METRIC_FIELD_LABELS,
  OBJECTIVE_VALUES,
  PLATFORM_VALUES,
  type Objective,
  type Platform,
} from "@/lib/metrics/objective";
import { formatCurrency, formatNumber } from "@/lib/metrics/derived";
import { objectiveSummaryTitle } from "@/lib/metrics/summary";
import { buildSummaryGroups } from "@/lib/metrics/build-summary-groups";
import { OBJECTIVE_PRIMARY_FIELD } from "@/lib/metrics/trend";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CampaignList } from "@/components/dashboard/campaign-list";
import { getAdminDashboardData } from "./data";
import { OverviewFilterBar } from "./overview-filter-bar";

type SearchParams = {
  clientId?: string;
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

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const clientFilter = params.clientId || null;
  const platformFilter = isPlatform(params.platform) ? params.platform : null;
  const objectiveFilter = isObjective(params.objective)
    ? params.objective
    : null;
  const granularity = params.granularity === "daily" ? "daily" : "weekly";
  const dateFrom = params.from || null;
  const dateTo = params.to || null;

  const { clientsList, campaigns, metricsByCampaign, budgetByClient, overview } =
    await getAdminDashboardData({
      clientId: clientFilter,
      platform: platformFilter,
      objective: objectiveFilter,
      dateFrom,
      dateTo,
    });

  const summaryGroups = buildSummaryGroups(
    campaigns,
    metricsByCampaign,
    granularity
  );

  return (
    <div className="space-y-8">
      <h1 className="page-title">Selamat datang, Admin</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div>
            <p className="stat-label">Klien Aktif</p>
            <p className="stat-value">
              {overview.activeClientCount} / {overview.totalClients}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div>
            <p className="stat-label">Campaign (sesuai filter)</p>
            <p className="stat-value">{formatNumber(overview.totalCampaigns)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <p className="stat-label">Total Spend (sesuai filter)</p>
            <p className="stat-value">{formatCurrency(overview.totalSpend)}</p>
          </div>
        </div>
      </div>

      <OverviewFilterBar
        clientId={clientFilter ?? ""}
        clientsList={clientsList}
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

      {budgetByClient.length > 0 && (
        <section>
          <h2 className="mb-3 section-title">
            Budget per Klien (sepanjang waktu)
          </h2>
          <div className="table-card">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Klien</th>
                  <th>Status</th>
                  <th>Total Top Up</th>
                  <th>Total Spend</th>
                  <th>Sisa Budget</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {budgetByClient.map((client) => (
                  <tr key={client.id}>
                    <td className="font-medium text-slate-900">
                      <Link
                        href={`/admin/campaigns?clientId=${client.id}`}
                        className="hover:text-indigo-600 hover:underline"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td>
                      <span className={client.isActive ? "badge-green" : "badge-gray"}>
                        {client.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td>{formatCurrency(client.totalTopup)}</td>
                    <td>{formatCurrency(client.totalSpend)}</td>
                    <td>
                      <span
                        className={
                          client.remaining < 0
                            ? "font-medium text-red-600"
                            : "text-slate-700"
                        }
                      >
                        {formatCurrency(client.remaining)}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/admin/clients/${client.id}/budget`}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Kelola
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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
