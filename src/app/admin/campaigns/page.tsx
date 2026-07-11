import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, clients } from "@/db/schema";
import {
  OBJECTIVE_LABELS,
  OBJECTIVE_VALUES,
  PLATFORM_LABELS,
  parseObjectivesParam,
} from "@/lib/metrics/objective";
import { ObjectiveMultiSelect } from "@/components/objective-multi-select";
import { DeleteCampaignButton } from "./delete-campaign-button";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; objective?: string | string[] }>;
}) {
  const { clientId, objective } = await searchParams;
  const objectiveFilters = parseObjectivesParam(objective);

  const campaignConditions = [];
  if (clientId) campaignConditions.push(eq(campaigns.clientId, clientId));
  if (objectiveFilters.length > 0) {
    campaignConditions.push(inArray(campaigns.objective, objectiveFilters));
  }

  const [clientsList, rows] = await Promise.all([
    db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .orderBy(asc(clients.name)),
    db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        platform: campaigns.platform,
        objective: campaigns.objective,
        clientName: clients.name,
      })
      .from(campaigns)
      .innerJoin(clients, eq(campaigns.clientId, clients.id))
      .where(campaignConditions.length > 0 ? and(...campaignConditions) : undefined)
      .orderBy(asc(clients.name), asc(campaigns.name)),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="page-title">Campaign</h1>
        <Link href="/admin/campaigns/new" className="btn-primary">
          + Tambah Campaign
        </Link>
      </div>

      <form method="GET" className="card mb-4 flex items-end gap-3 p-4">
        <div>
          <label htmlFor="clientId" className="field-label">
            Client
          </label>
          <select
            id="clientId"
            name="clientId"
            defaultValue={clientId ?? ""}
            className="select-field py-1.5"
          >
            <option value="">Semua</option>
            {clientsList.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Objective</label>
          <ObjectiveMultiSelect
            name="objective"
            options={OBJECTIVE_VALUES.map((value) => ({
              value,
              label: OBJECTIVE_LABELS[value],
            }))}
            defaultValues={objectiveFilters}
          />
        </div>
        <button type="submit" className="btn-primary py-1.5">
          Terapkan
        </button>
      </form>

      <div className="table-card">
        <table className="table-base">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Client</th>
              <th>Platform</th>
              <th>Objective</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-medium text-slate-900">
                  <Link
                    href={`/admin/campaigns/${row.id}`}
                    className="hover:text-indigo-600 hover:underline"
                  >
                    {row.name}
                  </Link>
                </td>
                <td>{row.clientName}</td>
                <td>
                  <span className="badge-indigo">
                    {PLATFORM_LABELS[row.platform]}
                  </span>
                </td>
                <td>
                  <span className="badge-gray">
                    {OBJECTIVE_LABELS[row.objective]}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-4 text-sm">
                    <Link
                      href={`/admin/campaigns/${row.id}/edit`}
                      className="font-medium text-slate-600 hover:text-slate-900"
                    >
                      Edit
                    </Link>
                    <DeleteCampaignButton
                      campaignId={row.id}
                      campaignName={row.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  {clientId || objectiveFilters.length > 0
                    ? "Tidak ada campaign yang cocok dengan filter ini."
                    : 'Belum ada campaign. Klik "+ Tambah Campaign" untuk mulai.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
