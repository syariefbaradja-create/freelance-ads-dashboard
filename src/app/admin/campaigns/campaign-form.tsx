"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  OBJECTIVE_LABELS,
  OBJECTIVE_PLATFORMS,
  OBJECTIVE_VALUES,
  PLATFORM_LABELS,
  type Objective,
  type Platform,
} from "@/lib/metrics/objective";
import type { CampaignFormState } from "./actions";

type ClientOption = { id: string; name: string; isActive: boolean };

type CampaignAction = (
  prevState: CampaignFormState,
  formData: FormData
) => Promise<CampaignFormState>;

export function CampaignForm({
  clientsList,
  action,
  defaultValues,
}: {
  clientsList: ClientOption[];
  action: CampaignAction;
  defaultValues?: {
    clientId: string;
    platform: Platform;
    objective: Objective;
    name: string;
    catalogName: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(
    action,
    {} as CampaignFormState
  );
  const [objective, setObjective] = useState<Objective>(
    defaultValues?.objective ?? "awareness"
  );

  const allowedPlatforms = OBJECTIVE_PLATFORMS[objective];

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <div>
        <label htmlFor="clientId" className="field-label">
          Client
        </label>
        <select
          id="clientId"
          name="clientId"
          required
          defaultValue={defaultValues?.clientId ?? ""}
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

      <div>
        <label htmlFor="objective" className="field-label">
          Objective
        </label>
        <select
          id="objective"
          name="objective"
          required
          value={objective}
          onChange={(e) => setObjective(e.target.value as Objective)}
          className="select-field"
        >
          {OBJECTIVE_VALUES.map((value) => (
            <option key={value} value={value}>
              {OBJECTIVE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="platform" className="field-label">
          Platform
        </label>
        <select
          id="platform"
          name="platform"
          required
          key={objective}
          defaultValue={
            defaultValues?.platform && allowedPlatforms.includes(defaultValues.platform)
              ? defaultValues.platform
              : allowedPlatforms[0]
          }
          className="select-field"
        >
          {allowedPlatforms.map((value) => (
            <option key={value} value={value}>
              {PLATFORM_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="name" className="field-label">
          Nama Campaign
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="input-field"
        />
      </div>

      {objective === "meta_cpas" && (
        <div>
          <label htmlFor="catalogName" className="field-label">
            Catalog/Product Set Name
          </label>
          <input
            id="catalogName"
            name="catalogName"
            required
            defaultValue={defaultValues?.catalogName ?? ""}
            className="input-field"
          />
        </div>
      )}

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
        <Link href="/admin/campaigns" className="btn-secondary">
          Batal
        </Link>
      </div>
    </form>
  );
}
