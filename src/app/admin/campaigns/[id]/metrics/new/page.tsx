import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { MetricForm } from "@/components/admin/metric-form";
import { createMetric } from "@/lib/actions/metrics";

export default async function NewMetricPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id));

  if (!campaign) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-6 page-title">Tambah Data Harian</h1>
      <MetricForm
        campaignId={campaign.id}
        objective={campaign.objective}
        action={createMetric.bind(null, campaign.id)}
      />
    </div>
  );
}
