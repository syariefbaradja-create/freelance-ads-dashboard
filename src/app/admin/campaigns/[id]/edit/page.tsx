import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, clients } from "@/db/schema";
import { CampaignForm } from "../../campaign-form";
import { updateCampaign } from "../../actions";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [[campaign], clientsList] = await Promise.all([
    db.select().from(campaigns).where(eq(campaigns.id, id)),
    db
      .select({ id: clients.id, name: clients.name, isActive: clients.isActive })
      .from(clients)
      .orderBy(asc(clients.name)),
  ]);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Edit Campaign
      </h1>
      <CampaignForm
        clientsList={clientsList}
        action={updateCampaign.bind(null, campaign.id)}
        defaultValues={{
          clientId: campaign.clientId,
          platform: campaign.platform,
          objective: campaign.objective,
          name: campaign.name,
          catalogName: campaign.catalogName,
        }}
      />
    </div>
  );
}
