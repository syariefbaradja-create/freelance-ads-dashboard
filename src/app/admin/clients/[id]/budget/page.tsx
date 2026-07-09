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
        <p className="text-sm text-gray-500">
          <Link href="/admin/clients" className="hover:underline">
            Klien
          </Link>{" "}
          / {client.name}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">
          Budget — {client.name}
        </h1>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Top Up</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatCurrency(budget.totalTopup)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Spend</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatCurrency(budget.totalSpend)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Sisa Budget</p>
          <p
            className={`mt-1 text-lg font-semibold ${
              budget.remaining < 0 ? "text-red-600" : "text-gray-900"
            }`}
          >
            {formatCurrency(budget.remaining)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <Link
          href={`/admin/clients/${client.id}/budget/new`}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Tambah Top Up
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Jumlah</th>
              <th className="px-4 py-3 font-medium">Catatan</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {topupRows.map((topup) => (
              <tr key={topup.id}>
                <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                  {topup.date}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  {formatCurrency(Number(topup.amount))}
                </td>
                <td className="px-4 py-3 text-gray-600">{topup.note}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/clients/${client.id}/budget/${topup.id}/edit`}
                      className="text-gray-600 hover:text-gray-900"
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
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
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
