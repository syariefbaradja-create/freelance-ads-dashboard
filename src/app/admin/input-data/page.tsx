import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, clients } from "@/db/schema";
import { OBJECTIVE_LABELS, PLATFORM_LABELS } from "@/lib/metrics/objective";
import { MetricForm } from "@/components/admin/metric-form";
import { createMetric } from "@/lib/actions/metrics";

type SearchParams = { clientId?: string; campaignId?: string };

export default async function InputDataPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { clientId, campaignId } = await searchParams;

  const clientsList = await db
    .select({ id: clients.id, name: clients.name, isActive: clients.isActive })
    .from(clients)
    .orderBy(asc(clients.name));

  const selectedClient = clientId
    ? clientsList.find((c) => c.id === clientId)
    : undefined;

  // Step 1: pick a client.
  if (!selectedClient) {
    return (
      <div>
        <h1 className="mb-6 page-title">Input Data Manual</h1>
        <p className="mb-4 text-sm text-slate-500">Langkah 1 dari 3 — Pilih Client</p>
        <form method="GET" className="card space-y-4 p-6">
          <div>
            <label htmlFor="clientId" className="field-label">
              Client
            </label>
            <select
              id="clientId"
              name="clientId"
              required
              defaultValue=""
              className="select-field"
            >
              <option value="" disabled>
                Pilih client
              </option>
              {clientsList.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                  {!client.isActive ? " (nonaktif)" : ""}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Lanjut
          </button>
        </form>
        {clientsList.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">
            Belum ada client.{" "}
            <Link href="/admin/clients/new" className="text-indigo-600 underline hover:text-indigo-500">
              Tambah client dulu
            </Link>
            .
          </p>
        )}
      </div>
    );
  }

  const campaignsList = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      platform: campaigns.platform,
      objective: campaigns.objective,
    })
    .from(campaigns)
    .where(eq(campaigns.clientId, selectedClient.id))
    .orderBy(asc(campaigns.name));

  const selectedCampaign = campaignId
    ? campaignsList.find((c) => c.id === campaignId)
    : undefined;

  // Step 2: pick a campaign belonging to that client.
  if (!selectedCampaign) {
    return (
      <div>
        <h1 className="mb-6 page-title">Input Data Manual</h1>
        <p className="mb-4 text-sm text-slate-500">
          Langkah 2 dari 3 — Pilih Campaign untuk{" "}
          <span className="font-medium text-slate-700">
            {selectedClient.name}
          </span>{" "}
          ·{" "}
          <Link href="/admin/input-data" className="text-indigo-600 underline hover:text-indigo-500">
            Ganti client
          </Link>
        </p>
        <form method="GET" className="card space-y-4 p-6">
          <input type="hidden" name="clientId" value={selectedClient.id} />
          <div>
            <label htmlFor="campaignId" className="field-label">
              Campaign
            </label>
            <select
              id="campaignId"
              name="campaignId"
              required
              defaultValue=""
              className="select-field"
            >
              <option value="" disabled>
                Pilih campaign
              </option>
              {campaignsList.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} ({PLATFORM_LABELS[campaign.platform]} ·{" "}
                  {OBJECTIVE_LABELS[campaign.objective]})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Lanjut
          </button>
        </form>
        {campaignsList.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">
            Client ini belum punya campaign.{" "}
            <Link href="/admin/campaigns/new" className="text-indigo-600 underline hover:text-indigo-500">
              Tambah campaign dulu
            </Link>
            .
          </p>
        )}
      </div>
    );
  }

  // Step 3: fill in the daily metric data, form fields adapt to the
  // campaign's objective.
  return (
    <div className="max-w-lg">
      <h1 className="mb-6 page-title">Input Data Manual</h1>
      <p className="mb-4 text-sm text-slate-500">
        Langkah 3 dari 3 — {selectedClient.name} · {selectedCampaign.name} (
        {PLATFORM_LABELS[selectedCampaign.platform]} ·{" "}
        {OBJECTIVE_LABELS[selectedCampaign.objective]}) ·{" "}
        <Link
          href={`/admin/input-data?clientId=${selectedClient.id}`}
          className="text-indigo-600 underline hover:text-indigo-500"
        >
          Ganti campaign
        </Link>
      </p>
      <MetricForm
        campaignId={selectedCampaign.id}
        objective={selectedCampaign.objective}
        action={createMetric.bind(null, selectedCampaign.id)}
        cancelHref="/admin/input-data"
      />
    </div>
  );
}
