import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, clients, metrics } from "@/db/schema";
import {
  METRIC_FIELD_LABELS,
  OBJECTIVE_LABELS,
  OBJECTIVE_METRIC_FIELDS,
  PLATFORM_LABELS,
} from "@/lib/metrics/objective";
import { DeleteMetricButton } from "./metrics/delete-metric-button";

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
        <p className="text-sm text-gray-500">
          {campaign.clientName} · {PLATFORM_LABELS[campaign.platform]} ·{" "}
          {OBJECTIVE_LABELS[campaign.objective]}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">
          {campaign.name}
        </h1>
        {campaign.catalogName && (
          <p className="mt-1 text-sm text-gray-500">
            Catalog: {campaign.catalogName}
          </p>
        )}
      </div>

      <div className="mb-4 flex justify-end">
        <Link
          href={`/admin/campaigns/${campaign.id}/metrics/new`}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Tambah Data Harian
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Spend</th>
              {fields.map((field) => (
                <th key={field} className="px-4 py-3 font-medium">
                  {METRIC_FIELD_LABELS[field]}
                </th>
              ))}
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {metricRows.map((metric) => (
              <tr key={metric.id}>
                <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                  {metric.date}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  {metric.spend}
                </td>
                {fields.map((field) => (
                  <td
                    key={field}
                    className="whitespace-nowrap px-4 py-3 text-gray-600"
                  >
                    {metric[field] ?? "-"}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/campaigns/${campaign.id}/metrics/${metric.id}/edit`}
                      className="text-gray-600 hover:text-gray-900"
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
                  className="px-4 py-8 text-center text-gray-500"
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
