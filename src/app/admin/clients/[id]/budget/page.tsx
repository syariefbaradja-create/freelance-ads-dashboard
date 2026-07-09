import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, clients, metrics, topups } from "@/db/schema";
import { calcClientBudget } from "@/lib/metrics/budget";
import { formatCurrency } from "@/lib/metrics/derived";
import { DeleteTopupButton } from "./delete-topup-button";

export default async function ClientBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  if (!client) {
    notFound();
  }

  const [topupRows, campaignIds] = await Promise.all([
    db
      .select()
      .from(topups)
      .where(eq(topups.clientId, id))
      .orderBy(desc(topups.date)),
    db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.clientId, id)),
  ]);

  const totalTopup = topupRows.reduce((sum, t) => sum + Number(t.amount), 0);

  let totalSpend = 0;
  if (campaignIds.length > 0) {
    const metricRows = await db
      .select({ spend: metrics.spend })
      .from(metrics)
      .where(
        inArray(
          metrics.campaignId,
          campaignIds.map((c) => c.id)
        )
      );
    totalSpend = metricRows.reduce((sum, m) => sum + Number(m.spend), 0);
  }

  const budget = calcClientBudget(totalTopup, totalSpend);

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-slate-500">
          <Link href="/admin/clients" className="hover:text-indigo-600 hover:underline">
            Klien
          </Link>{" "}
          / {client.name}
        </p>
        <h1 className="page-title">Budget — {client.name}</h1>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div>
            <p className="stat-label">Total Top Up</p>
            <p className="stat-value">{formatCurrency(budget.totalTopup)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div>
            <p className="stat-label">Total Spend</p>
            <p className="stat-value">{formatCurrency(budget.totalSpend)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏦</div>
          <div>
            <p className="stat-label">Sisa Budget</p>
            <p
              className={`mt-1 text-lg font-semibold ${
                budget.remaining < 0 ? "text-red-600" : "text-slate-900"
              }`}
            >
              {formatCurrency(budget.remaining)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <Link href={`/admin/clients/${client.id}/budget/new`} className="btn-primary">
          + Tambah Top Up
        </Link>
      </div>

      <div className="table-card">
        <table className="table-base">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Jumlah</th>
              <th>Catatan</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {topupRows.map((topup) => (
              <tr key={topup.id}>
                <td className="whitespace-nowrap font-medium text-slate-900">
                  {topup.date}
                </td>
                <td className="whitespace-nowrap">
                  {formatCurrency(Number(topup.amount))}
                </td>
                <td>{topup.note}</td>
                <td>
                  <div className="flex justify-end gap-4 text-sm">
                    <Link
                      href={`/admin/clients/${client.id}/budget/${topup.id}/edit`}
                      className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Edit
                    </Link>
                    <DeleteTopupButton
                      topupId={topup.id}
                      clientId={client.id}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {topupRows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  Belum ada top up. Klik &quot;+ Tambah Top Up&quot; untuk
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
