import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, topups } from "@/db/schema";
import { TopupForm } from "@/components/admin/topup-form";
import { updateTopup } from "@/lib/actions/topups";

export default async function EditTopupPage({
  params,
}: {
  params: Promise<{ id: string; topupId: string }>;
}) {
  const { id, topupId } = await params;

  const [[client], [topup]] = await Promise.all([
    db.select().from(clients).where(eq(clients.id, id)),
    db.select().from(topups).where(eq(topups.id, topupId)),
  ]);

  if (!client || !topup) {
    notFound();
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 page-title">Edit Top Up — {client.name}</h1>
      <TopupForm
        clientId={client.id}
        action={updateTopup.bind(null, topup.id, client.id)}
        defaultValues={{
          amount: topup.amount,
          date: topup.date,
          note: topup.note,
        }}
      />
    </div>
  );
}
