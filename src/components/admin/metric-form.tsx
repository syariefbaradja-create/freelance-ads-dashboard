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
import type { MetricFormState } from "@/lib/actions/metrics";

type MetricAction = (
  prevState: MetricFormState,
  formData: FormData
) => Promise<MetricFormState>;

export function MetricForm({
  campaignId,
  objective,
  action,
  defaultValues,
  cancelHref,
}: {
  campaignId: string;
  objective: Objective;
  action: MetricAction;
  defaultValues?: { date: string; spend: string } & Partial<
    Record<MetricFieldKey, string | null>
  >;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    {} as MetricFormState
  );
  const fields = OBJECTIVE_METRIC_FIELDS[objective];
  const required = new Set(OBJECTIVE_REQUIRED_FIELDS[objective]);

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="field-label">
            Tanggal
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={defaultValues?.date}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="spend" className="field-label">
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
            className="input-field"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field}>
            <label htmlFor={field} className="field-label">
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
              className="input-field"
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
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
        <Link
          href={cancelHref ?? `/admin/campaigns/${campaignId}`}
          className="btn-secondary"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
