"use client";

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
import type { CampaignRow } from "@/lib/metrics/campaign-row";

export function CampaignList({
  campaigns,
  metricsByCampaign,
  selectedIds,
  onToggle,
}: {
  campaigns: CampaignRow[];
  metricsByCampaign: Map<string, MetricRow[]>;
  selectedIds: Set<string>;
  onToggle: (campaignId: string) => void;
}) {
  if (campaigns.length === 0) return null;

  return (
    <section>
      <h2 className="mb-1 section-title">Detail Campaign</h2>
      <p className="mb-3 text-xs text-slate-500">
        Centang/hilangkan campaign untuk mengatur mana yang ikut dihitung di
        card ringkasan dan grafik di atas.
      </p>
      <div className="space-y-3">
        {campaigns.map((campaign) => {
          const rows = (metricsByCampaign.get(campaign.id) ?? [])
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date));
          const fields = OBJECTIVE_METRIC_FIELDS[campaign.objective];

          return (
            <details key={campaign.id} className="table-card">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 marker:content-none">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(campaign.id)}
                    onChange={() => onToggle(campaign.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Sertakan ${campaign.name} di ringkasan`}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40"
                  />
                  <span className="font-medium text-slate-900">
                    {campaign.name}
                  </span>
                  {campaign.clientName && (
                    <span className="text-xs text-slate-400">
                      {campaign.clientName}
                    </span>
                  )}
                  <span className="badge-indigo">
                    {PLATFORM_LABELS[campaign.platform]}
                  </span>
                  <span className="badge-gray">
                    {OBJECTIVE_LABELS[campaign.objective]}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {rows.length} baris data
                </span>
              </summary>
              <div className="overflow-x-auto border-t border-slate-100">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Spend</th>
                      {fields.map((field) => (
                        <th key={field}>{METRIC_FIELD_LABELS[field]}</th>
                      ))}
                      {campaign.objective === "awareness" && <th>CPM</th>}
                      {campaign.objective === "traffic" && (
                        <>
                          <th>CTR</th>
                          <th>CPC</th>
                        </>
                      )}
                      {campaign.objective === "engagement" && (
                        <th>Cost/Engagement</th>
                      )}
                      {campaign.objective === "leads" && <th>CPL</th>}
                      {campaign.objective === "sales" && (
                        <>
                          <th>CPA</th>
                          <th>ROAS</th>
                        </>
                      )}
                      {campaign.objective === "meta_cpas" && <th>ROAS</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap font-medium text-slate-900">
                          {row.date}
                        </td>
                        <td className="whitespace-nowrap">
                          {formatCurrency(row.spend)}
                        </td>
                        {fields.map((field) => (
                          <td key={field} className="whitespace-nowrap">
                            {formatNumber(row[field], field === "frequency" ? 2 : 0)}
                          </td>
                        ))}
                        {campaign.objective === "awareness" && (
                          <td className="whitespace-nowrap">
                            {formatCurrency(calcCPM(row.spend, row.impressions))}
                          </td>
                        )}
                        {campaign.objective === "traffic" && (
                          <>
                            <td className="whitespace-nowrap">
                              {formatPercent(calcCTR(row.clicks, row.impressions))}
                            </td>
                            <td className="whitespace-nowrap">
                              {formatCurrency(calcCPC(row.spend, row.clicks))}
                            </td>
                          </>
                        )}
                        {campaign.objective === "engagement" && (
                          <td className="whitespace-nowrap">
                            {formatCurrency(
                              calcCostPerEngagement(row.spend, row.postEngagements)
                            )}
                          </td>
                        )}
                        {campaign.objective === "leads" && (
                          <td className="whitespace-nowrap">
                            {formatCurrency(calcCPL(row.spend, row.leads))}
                          </td>
                        )}
                        {campaign.objective === "sales" && (
                          <>
                            <td className="whitespace-nowrap">
                              {formatCurrency(calcCPA(row.spend, row.conversions))}
                            </td>
                            <td className="whitespace-nowrap">
                              {formatRatio(calcROAS(row.revenue, row.spend))}
                            </td>
                          </>
                        )}
                        {campaign.objective === "meta_cpas" && (
                          <td className="whitespace-nowrap">
                            {formatRatio(calcROAS(row.revenue, row.spend))}
                          </td>
                        )}
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={fields.length + 2}
                          className="py-6 text-center text-slate-500"
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
