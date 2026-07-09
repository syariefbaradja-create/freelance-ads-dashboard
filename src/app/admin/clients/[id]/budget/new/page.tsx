import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { TopupForm } from "@/components/admin/topup-form";
import { createTopup } from "@/lib/actions/topups";

export default async function NewTopupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client] = await db.select().from(clients).where(eq(clients.id, id));

  if (!client) {
    notFound();
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 page-title">Tambah Top Up — {client.name}</h1>
      <TopupForm clientId={client.id} action={createTopup.bind(null, client.id)} />
    </div>
  );
}
