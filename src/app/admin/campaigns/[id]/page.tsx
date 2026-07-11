import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, clients, metrics } from "@/db/schema";
import {
  METRIC_FIELD_KINDS,
  METRIC_FIELD_LABELS,
  OBJECTIVE_LABELS,
  OBJECTIVE_METRIC_FIELDS,
  PLATFORM_LABELS,
} from "@/lib/metrics/objective";
import { formatCurrency, formatNumber, formatRatio } from "@/lib/metrics/derived";
import { DeleteMetricButton } from "./metrics/delete-metric-button";

function formatMetricValue(
  kind: "currency" | "number" | "ratio",
  value: string | null
) {
  const num = value == null ? null : Number(value);
  switch (kind) {
    case "currency":
      return formatCurrency(num);
    case "ratio":
      return formatRatio(num);
    default:
      return formatNumber(num);
  }
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [campaignRows, metricRows] = await Promise.all([
    db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        platform: campaigns.platform,
        objective: campaigns.objective,
        catalogName: campaigns.catalogName,
        clientName: clients.name,
      })
      .from(campaigns)
      .innerJoin(clients, eq(campaigns.clientId, clients.id))
      .where(eq(campaigns.id, id)),
    db
      .select()
      .from(metrics)
      .where(eq(metrics.campaignId, id))
      .orderBy(desc(metrics.date)),
  ]);

  const campaign = campaignRows[0];
  if (!campaign) {
    notFound();
  }

  const fields = OBJECTIVE_METRIC_FIELDS[campaign.objective];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>{campaign.clientName}</span>
          <span className="badge-indigo">
            {PLATFORM_LABELS[campaign.platform]}
          </span>
          <span className="badge-gray">
            {OBJECTIVE_LABELS[campaign.objective]}
          </span>
        </div>
        <h1 className="page-title">{campaign.name}</h1>
        {campaign.catalogName && (
          <p className="mt-1 text-sm text-slate-500">
            Catalog: {campaign.catalogName}
          </p>
        )}
      </div>

      <div className="mb-4 flex justify-end">
        <Link
          href={`/admin/campaigns/${campaign.id}/metrics/new`}
          className="btn-primary"
        >
          + Tambah Data Harian
        </Link>
      </div>

      <div className="table-card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Spend</th>
              {fields.map((field) => (
                <th key={field}>{METRIC_FIELD_LABELS[field]}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {metricRows.map((metric) => (
              <tr key={metric.id}>
                <td className="whitespace-nowrap font-medium text-slate-900">
                  {metric.date}
                </td>
                <td className="whitespace-nowrap">
                  {formatCurrency(Number(metric.spend))}
                </td>
                {fields.map((field) => (
                  <td key={field} className="whitespace-nowrap">
                    {formatMetricValue(METRIC_FIELD_KINDS[field], metric[field])}
                  </td>
                ))}
                <td className="whitespace-nowrap">
                  <div className="flex justify-end gap-4 text-sm">
                    <Link
                      href={`/admin/campaigns/${campaign.id}/metrics/${metric.id}/edit`}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Edit
                    </Link>
                    <DeleteMetricButton
                      metricId={metric.id}
                      campaignId={campaign.id}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {metricRows.length === 0 && (
              <tr>
                <td
                  colSpan={fields.length + 3}
                  className="py-8 text-center text-slate-500"
                >
                  Belum ada data harian untuk campaign ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
