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
        <h1 className="page-title">Klien</h1>
        <Link href="/admin/clients/new" className="btn-primary">
          + Tambah Klien
        </Link>
      </div>

      <div className="table-card">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Status</th>
              <th>Sisa Budget</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {allClients.map((client) => {
              const budget = calcClientBudget(
                topupByClient.get(client.id) ?? 0,
                spendByClient.get(client.id) ?? 0
              );
              return (
                <tr key={client.id}>
                  <td className="font-medium text-slate-900">{client.name}</td>
                  <td>{client.email}</td>
                  <td>
                    <span className={client.isActive ? "badge-green" : "badge-gray"}>
                      {client.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        budget.remaining < 0 ? "font-medium text-red-600" : ""
                      }
                    >
                      {formatCurrency(budget.remaining)}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-4 text-sm">
                      <Link
                        href={`/admin/clients/${client.id}/budget`}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Budget
                      </Link>
                      <Link
                        href={`/admin/clients/${client.id}/edit`}
                        className="font-medium text-slate-600 hover:text-slate-900"
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
                          className="font-medium text-slate-600 hover:text-slate-900"
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
                <td colSpan={5} className="py-8 text-center text-slate-500">
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
