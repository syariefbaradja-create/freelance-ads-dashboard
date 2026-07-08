import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { toggleClientActive } from "./actions";

export default async function ClientsPage() {
  const allClients = await db
    .select()
    .from(clients)
    .orderBy(desc(clients.createdAt));

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
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allClients.map((client) => (
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
                  <div className="flex justify-end gap-3">
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
            ))}
            {allClients.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
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
