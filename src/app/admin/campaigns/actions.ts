"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { campaignSchema } from "@/lib/validation";

export type CampaignFormState = { error?: string };

function parseCampaignForm(formData: FormData) {
  return campaignSchema.safeParse({
    clientId: formData.get("clientId"),
    platform: formData.get("platform"),
    objective: formData.get("objective"),
    name: formData.get("name"),
    catalogName: formData.get("catalogName") || undefined,
  });
}

export async function createCampaign(
  _prevState: CampaignFormState,
  formData: FormData
): Promise<CampaignFormState> {
  const parsed = parseCampaignForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  await db.insert(campaigns).values({
    clientId: parsed.data.clientId,
    platform: parsed.data.platform,
    objective: parsed.data.objective,
    name: parsed.data.name,
    catalogName:
      parsed.data.objective === "meta_cpas" ? parsed.data.catalogName : null,
  });

  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

export async function updateCampaign(
  id: string,
  _prevState: CampaignFormState,
  formData: FormData
): Promise<CampaignFormState> {
  const parsed = parseCampaignForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  await db
    .update(campaigns)
    .set({
      clientId: parsed.data.clientId,
      platform: parsed.data.platform,
      objective: parsed.data.objective,
      name: parsed.data.name,
      catalogName:
        parsed.data.objective === "meta_cpas" ? parsed.data.catalogName : null,
    })
    .where(eq(campaigns.id, id));

  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

export async function deleteCampaign(id: string) {
  await db.delete(campaigns).where(eq(campaigns.id, id));
  revalidatePath("/admin/campaigns");
}
