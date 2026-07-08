import {
  calcCPA,
  calcCPC,
  calcCPL,
  calcCPM,
  calcCTR,
  calcCostPerEngagement,
  calcROAS,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/metrics/derived";
import {
  METRIC_FIELD_LABELS,
  OBJECTIVE_LABELS,
  OBJECTIVE_METRIC_FIELDS,
  PLATFORM_LABELS,
} from "@/lib/metrics/objective";
import type { MetricRow } from "@/lib/metrics/summary";
import type { CampaignRow } from "./data";

export function CampaignList({
  campaigns,
  metricsByCampaign,
}: {
  campaigns: CampaignRow[];
  metricsByCampaign: Map<string, MetricRow[]>;
}) {
  if (campaigns.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        Detail Campaign
      </h2>
      <div className="space-y-3">
        {campaigns.map((campaign) => {
          const rows = (metricsByCampaign.get(campaign.id) ?? [])
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date));
          const fields = OBJECTIVE_METRIC_FIELDS[campaign.objective];

          return (
            <details
              key={campaign.id}
              className="rounded-lg border border-gray-200 bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
                <div>
                  <span className="font-medium text-gray-900">
                    {campaign.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {PLATFORM_LABELS[campaign.platform]} ·{" "}
                    {OBJECTIVE_LABELS[campaign.objective]}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {rows.length} baris data
                </span>
              </summary>
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Tanggal</th>
                      <th className="px-4 py-2 font-medium">Spend</th>
                      {fields.map((field) => (
                        <th key={field} className="px-4 py-2 font-medium">
                          {METRIC_FIELD_LABELS[field]}
                        </th>
                      ))}
                      {campaign.objective === "awareness" && (
                        <th className="px-4 py-2 font-medium">CPM</th>
                      )}
                      {campaign.objective === "traffic" && (
                        <>
                          <th className="px-4 py-2 font-medium">CTR</th>
                          <th className="px-4 py-2 font-medium">CPC</th>
                        </>
                      )}
                      {campaign.objective === "engagement" && (
                        <th className="px-4 py-2 font-medium">
                          Cost/Engagement
                        </th>
                      )}
                      {campaign.objective === "leads" && (
                        <th className="px-4 py-2 font-medium">CPL</th>
                      )}
                      {campaign.objective === "sales" && (
                        <>
                          <th className="px-4 py-2 font-medium">CPA</th>
                          <th className="px-4 py-2 font-medium">ROAS</th>
                        </>
                      )}
                      {campaign.objective === "meta_cpas" && (
                        <th className="px-4 py-2 font-medium">ROAS</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap px-4 py-2 text-gray-900">
                          {row.date}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                          {formatCurrency(row.spend)}
                        </td>
                        {fields.map((field) => (
                          <td
                            key={field}
                            className="whitespace-nowrap px-4 py-2 text-gray-600"
                          >
                            {formatNumber(row[field], field === "frequency" ? 2 : 0)}
                          </td>
                        ))}
                        {campaign.objective === "awareness" && (
                          <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                            {formatCurrency(calcCPM(row.spend, row.impressions))}
                          </td>
                        )}
                        {campaign.objective === "traffic" && (
                          <>
                            <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                              {formatPercent(calcCTR(row.clicks, row.impressions))}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                              {formatCurrency(calcCPC(row.spend, row.clicks))}
                            </td>
                          </>
                        )}
                        {campaign.objective === "engagement" && (
                          <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                            {formatCurrency(
                              calcCostPerEngagement(row.spend, row.postEngagements)
                            )}
                          </td>
                        )}
                        {campaign.objective === "leads" && (
                          <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                            {formatCurrency(calcCPL(row.spend, row.leads))}
                          </td>
                        )}
                        {campaign.objective === "sales" && (
                          <>
                            <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                              {formatCurrency(calcCPA(row.spend, row.conversions))}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                              {formatRatio(calcROAS(row.revenue, row.spend))}
                            </td>
                          </>
                        )}
                        {campaign.objective === "meta_cpas" && (
                          <td className="whitespace-nowrap px-4 py-2 text-gray-600">
                            {formatRatio(calcROAS(row.revenue, row.spend))}
                          </td>
                        )}
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={fields.length + 2}
                          className="px-4 py-6 text-center text-gray-500"
                        >
                          Belum ada data harian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
