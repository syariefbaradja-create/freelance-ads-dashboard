import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, clients, metrics, topups } from "@/db/schema";
import { calcClientBudget } from "@/lib/metrics/budget";
import { formatCurrency } from "@/lib/metrics/derived";
import { toggleClientActive } from "./actions";

export default async function ClientsPage() {
  const allClients = await db
    .select()
    .from(clients)
    .orderBy(desc(clients.createdAt));

  const [allTopups, allCampaigns] = await Promise.all([
    db.select({ clientId: topups.clientId, amount: topups.amount }).from(topups),
    db
      .select({ id: campaigns.id, clientId: campaigns.clientId })
      .from(campaigns),
  ]);

  const campaignToClient = new Map(allCampaigns.map((c) => [c.id, c.clientId]));
  const campaignIds = allCampaigns.map((c) => c.id);

  const allMetrics =
    campaignIds.length > 0
      ? await db
          .select({ campaignId: metrics.campaignId, spend: metrics.spend })
          .from(metrics)
      : [];

  const topupByClient = new Map<string, number>();
  for (const t of allTopups) {
    topupByClient.set(
      t.clientId,
      (topupByClient.get(t.clientId) ?? 0) + Number(t.amount)
    );
  }

  const spendByClient = new Map<string, number>();
  for (const m of allMetrics) {
    const clientId = campaignToClient.get(m.campaignId);
    if (!clientId) continue;
    spendByClient.set(
      clientId,
      (spendByClient.get(clientId) ?? 0) + Number(m.spend)
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Klien</h1>
        <Link
          href="/admin/clients/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Tambah Klien
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Sisa Budget</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allClients.map((client) => {
              const budget = calcClientBudget(
                topupByClient.get(client.id) ?? 0,
                spendByClient.get(client.id) ?? 0
              );
              return (
                <tr key={client.id}>
                  <td className="px-4 py-3 text-gray-900">{client.name}</td>
                  <td className="px-4 py-3 text-gray-600">{client.email}</td>
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
                  <td className="px-4 py-3">
                    <span
                      className={
                        budget.remaining < 0 ? "text-red-600" : "text-gray-600"
                      }
                    >
                      {formatCurrency(budget.remaining)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/clients/${client.id}/budget`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Budget
                      </Link>
                      <Link
                        href={`/admin/clients/${client.id}/edit`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Link>
                      <form
                        action={toggleClientActive.bind(
                          null,
                          client.id,
                          !client.isActive
                        )}
                      >
                        <button
                          type="submit"
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {client.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {allClients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Belum ada klien. Klik &quot;+ Tambah Klien&quot; untuk mulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
