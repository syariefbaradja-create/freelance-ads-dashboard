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
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
    >
      <div>
        <label
          htmlFor="clientId"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Client
        </label>
        <select
          id="clientId"
          name="clientId"
          required
          defaultValue={defaultValues?.clientId ?? ""}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
        <label
          htmlFor="objective"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Objective
        </label>
        <select
          id="objective"
          name="objective"
          required
          value={objective}
          onChange={(e) => setObjective(e.target.value as Objective)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          {OBJECTIVE_VALUES.map((value) => (
            <option key={value} value={value}>
              {OBJECTIVE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="platform"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
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
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          {allowedPlatforms.map((value) => (
            <option key={value} value={value}>
              {PLATFORM_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Nama Campaign
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        />
      </div>

      {objective === "meta_cpas" && (
        <div>
          <label
            htmlFor="catalogName"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Catalog/Product Set Name
          </label>
          <input
            id="catalogName"
            name="catalogName"
            required
            defaultValue={defaultValues?.catalogName ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
      )}

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
        <Link
          href="/admin/campaigns"
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
