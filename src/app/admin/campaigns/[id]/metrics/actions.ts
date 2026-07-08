"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, metrics } from "@/db/schema";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { buildMetricSchema, optionalNumber } from "@/lib/validation";

export type MetricFormState = { error?: string };

function readMetricFormData(formData: FormData) {
  return {
    date: formData.get("date"),
    spend: formData.get("spend"),
    impressions: optionalNumber(formData.get("impressions")),
    reach: optionalNumber(formData.get("reach")),
    frequency: optionalNumber(formData.get("frequency")),
    clicks: optionalNumber(formData.get("clicks")),
    postEngagements: optionalNumber(formData.get("postEngagements")),
    videoViews: optionalNumber(formData.get("videoViews")),
    leads: optionalNumber(formData.get("leads")),
    conversions: optionalNumber(formData.get("conversions")),
    purchases: optionalNumber(formData.get("purchases")),
    revenue: optionalNumber(formData.get("revenue")),
  };
}

export async function createMetric(
  campaignId: string,
  _prevState: MetricFormState,
  formData: FormData
): Promise<MetricFormState> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));

  if (!campaign) {
    return { error: "Campaign tidak ditemukan." };
  }

  // Objective comes from the campaign record (server-side truth), not the
  // form, so required fields can't be spoofed by tampering with the request.
  const parsed = buildMetricSchema(campaign.objective).safeParse(
    readMetricFormData(formData)
  );

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi login tidak ditemukan, silakan login ulang." };
  }

  await db.insert(metrics).values({
    campaignId,
    date: parsed.data.date,
    spend: String(parsed.data.spend),
    impressions: parsed.data.impressions?.toString(),
    reach: parsed.data.reach?.toString(),
    frequency: parsed.data.frequency?.toString(),
    clicks: parsed.data.clicks?.toString(),
    postEngagements: parsed.data.postEngagements?.toString(),
    videoViews: parsed.data.videoViews?.toString(),
    leads: parsed.data.leads?.toString(),
    conversions: parsed.data.conversions?.toString(),
    purchases: parsed.data.purchases?.toString(),
    revenue: parsed.data.revenue?.toString(),
    createdBy: user.id,
  });

  revalidatePath(`/admin/campaigns/${campaignId}`);
  redirect(`/admin/campaigns/${campaignId}`);
}

export async function updateMetric(
  metricId: string,
  campaignId: string,
  _prevState: MetricFormState,
  formData: FormData
): Promise<MetricFormState> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));

  if (!campaign) {
    return { error: "Campaign tidak ditemukan." };
  }

  const parsed = buildMetricSchema(campaign.objective).safeParse(
    readMetricFormData(formData)
  );

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  await db
    .update(metrics)
    .set({
      date: parsed.data.date,
      spend: String(parsed.data.spend),
      impressions: parsed.data.impressions?.toString(),
      reach: parsed.data.reach?.toString(),
      frequency: parsed.data.frequency?.toString(),
      clicks: parsed.data.clicks?.toString(),
      postEngagements: parsed.data.postEngagements?.toString(),
      videoViews: parsed.data.videoViews?.toString(),
      leads: parsed.data.leads?.toString(),
      conversions: parsed.data.conversions?.toString(),
      purchases: parsed.data.purchases?.toString(),
      revenue: parsed.data.revenue?.toString(),
      updatedAt: new Date(),
    })
    .where(eq(metrics.id, metricId));

  revalidatePath(`/admin/campaigns/${campaignId}`);
  redirect(`/admin/campaigns/${campaignId}`);
}

export async function deleteMetric(metricId: string, campaignId: string) {
  await db.delete(metrics).where(eq(metrics.id, metricId));
  revalidatePath(`/admin/campaigns/${campaignId}`);
}
