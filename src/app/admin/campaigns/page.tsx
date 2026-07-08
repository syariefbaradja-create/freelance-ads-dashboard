import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, clients } from "@/db/schema";
import { OBJECTIVE_LABELS, PLATFORM_LABELS } from "@/lib/metrics/objective";
import { DeleteCampaignButton } from "./delete-campaign-button";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;

  const [clientsList, rows] = await Promise.all([
    db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .orderBy(asc(clients.name)),
    db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        platform: campaigns.platform,
        objective: campaigns.objective,
        clientName: clients.name,
      })
      .from(campaigns)
      .innerJoin(clients, eq(campaigns.clientId, clients.id))
      .where(clientId ? eq(campaigns.clientId, clientId) : undefined)
      .orderBy(asc(clients.name), asc(campaigns.name)),
  ]);

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

      <form
        method="GET"
        className="mb-4 flex items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
      >
        <div>
          <label
            htmlFor="clientId"
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            Client
          </label>
          <select
            id="clientId"
            name="clientId"
            defaultValue={clientId ?? ""}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
          >
            <option value="">Semua</option>
            {clientsList.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Terapkan
        </button>
      </form>

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
                  {clientId
                    ? "Tidak ada campaign untuk client ini."
                    : 'Belum ada campaign. Klik "+ Tambah Campaign" untuk mulai.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
