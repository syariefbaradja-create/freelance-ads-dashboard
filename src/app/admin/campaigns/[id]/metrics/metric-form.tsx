"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  METRIC_FIELD_LABELS,
  OBJECTIVE_METRIC_FIELDS,
  OBJECTIVE_REQUIRED_FIELDS,
  type MetricFieldKey,
  type Objective,
} from "@/lib/metrics/objective";
import type { MetricFormState } from "./actions";

type MetricAction = (
  prevState: MetricFormState,
  formData: FormData
) => Promise<MetricFormState>;

export function MetricForm({
  campaignId,
  objective,
  action,
  defaultValues,
}: {
  campaignId: string;
  objective: Objective;
  action: MetricAction;
  defaultValues?: { date: string; spend: string } & Partial<
    Record<MetricFieldKey, string | null>
  >;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    {} as MetricFormState
  );
  const fields = OBJECTIVE_METRIC_FIELDS[objective];
  const required = new Set(OBJECTIVE_REQUIRED_FIELDS[objective]);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="date"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Tanggal
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultValues?.date}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div>
          <label
            htmlFor="spend"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Spend
          </label>
          <input
            id="spend"
            name="spend"
            type="number"
            step="any"
            min={0}
            required
            defaultValue={defaultValues?.spend}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field}>
            <label
              htmlFor={field}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {METRIC_FIELD_LABELS[field]}
              {required.has(field) ? "" : " (opsional)"}
            </label>
            <input
              id={field}
              name={field}
              type="number"
              step="any"
              min={0}
              required={required.has(field)}
              defaultValue={defaultValues?.[field] ?? ""}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </div>
        ))}
      </div>

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
          href={`/admin/campaigns/${campaignId}`}
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
