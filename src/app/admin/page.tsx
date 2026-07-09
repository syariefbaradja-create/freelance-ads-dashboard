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
      <h1 className="text-2xl font-semibold text-gray-900">
        Selamat datang, Admin
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Klien Aktif</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {overview.activeClientCount} / {overview.totalClients}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Campaign (sesuai filter)</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatNumber(overview.totalCampaigns)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Spend (sesuai filter)</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatCurrency(overview.totalSpend)}
          </p>
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
        <p className="text-gray-500">
          Belum ada campaign yang cocok dengan filter ini.
        </p>
      )}

      {budgetByClient.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Budget per Klien (sepanjang waktu)
          </h2>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Klien</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Total Top Up</th>
                  <th className="px-4 py-3 font-medium">Total Spend</th>
                  <th className="px-4 py-3 font-medium">Sisa Budget</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {budgetByClient.map((client) => (
                  <tr key={client.id}>
                    <td className="px-4 py-3 text-gray-900">
                      <Link
                        href={`/admin/campaigns?clientId=${client.id}`}
                        className="hover:underline"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          client.isActive
                            ? "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
                            : "rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500"
                        }
                      >
                        {client.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatCurrency(client.totalTopup)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatCurrency(client.totalSpend)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          client.remaining < 0
                            ? "font-medium text-red-600"
                            : "text-gray-600"
                        }
                      >
                        {formatCurrency(client.remaining)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/clients/${client.id}/budget`}
                        className="text-gray-600 hover:text-gray-900"
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
