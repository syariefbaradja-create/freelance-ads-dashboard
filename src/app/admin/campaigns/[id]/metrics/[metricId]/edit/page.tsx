import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, metrics } from "@/db/schema";
import { MetricForm } from "@/components/admin/metric-form";
import { updateMetric } from "@/lib/actions/metrics";

export default async function EditMetricPage({
  params,
}: {
  params: Promise<{ id: string; metricId: string }>;
}) {
  const { id, metricId } = await params;

  const [[campaign], [metric]] = await Promise.all([
    db.select().from(campaigns).where(eq(campaigns.id, id)),
    db.select().from(metrics).where(eq(metrics.id, metricId)),
  ]);

  if (!campaign || !metric) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-6 page-title">Edit Data Harian</h1>
      <MetricForm
        campaignId={campaign.id}
        objective={campaign.objective}
        action={updateMetric.bind(null, metric.id, campaign.id)}
        defaultValues={{
          date: metric.date,
          spend: metric.spend,
          impressions: metric.impressions,
          reach: metric.reach,
          frequency: metric.frequency,
          clicks: metric.clicks,
          postEngagements: metric.postEngagements,
          videoViews: metric.videoViews,
          leads: metric.leads,
          conversions: metric.conversions,
          purchases: metric.purchases,
          revenue: metric.revenue,
          viewProductPage: metric.viewProductPage,
          addToCart: metric.addToCart,
          addToCartValue: metric.addToCartValue,
        }}
      />
    </div>
  );
}
