import { asc } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { CampaignForm } from "../campaign-form";
import { createCampaign } from "../actions";

export default async function NewCampaignPage() {
  const clientsList = await db
    .select({ id: clients.id, name: clients.name, isActive: clients.isActive })
    .from(clients)
    .orderBy(asc(clients.name));

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Tambah Campaign
      </h1>
      <CampaignForm clientsList={clientsList} action={createCampaign} />
    </div>
  );
}
