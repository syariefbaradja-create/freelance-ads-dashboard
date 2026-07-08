import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, clients } from "@/db/schema";
import { OBJECTIVE_LABELS, PLATFORM_LABELS } from "@/lib/metrics/objective";
import { DeleteCampaignButton } from "./delete-campaign-button";

export default async function CampaignsPage() {
  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      platform: campaigns.platform,
      objective: campaigns.objective,
      clientName: clients.name,
    })
    .from(campaigns)
    .innerJoin(clients, eq(campaigns.clientId, clients.id))
    .orderBy(desc(campaigns.createdAt));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Campaign</h1>
        <Link
          href="/admin/campaigns/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Tambah Campaign
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Platform</th>
              <th className="px-4 py-3 font-medium">Objective</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 text-gray-900">
                  <Link
                    href={`/admin/campaigns/${row.id}`}
                    className="hover:underline"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.clientName}</td>
                <td className="px-4 py-3 text-gray-600">
                  {PLATFORM_LABELS[row.platform]}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {OBJECTIVE_LABELS[row.objective]}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/campaigns/${row.id}/edit`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Edit
                    </Link>
                    <DeleteCampaignButton
                      campaignId={row.id}
                      campaignName={row.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Belum ada campaign. Klik &quot;+ Tambah Campaign&quot; untuk
                  mulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
