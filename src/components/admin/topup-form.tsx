"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { TopupFormState } from "@/lib/actions/topups";

type TopupAction = (
  prevState: TopupFormState,
  formData: FormData
) => Promise<TopupFormState>;

export function TopupForm({
  clientId,
  action,
  defaultValues,
}: {
  clientId: string;
  action: TopupAction;
  defaultValues?: { amount: string; date: string; note: string | null };
}) {
  const [state, formAction, pending] = useActionState(
    action,
    {} as TopupFormState
  );

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
          <label htmlFor="amount" className="field-label">
            Jumlah Top Up
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="any"
            min={0}
            required
            defaultValue={defaultValues?.amount}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label htmlFor="note" className="field-label">
          Catatan (opsional)
        </label>
        <input
          id="note"
          name="note"
          defaultValue={defaultValues?.note ?? ""}
          placeholder="mis. Top up untuk campaign Juli"
          className="input-field"
        />
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
        <Link href={`/admin/clients/${clientId}/budget`} className="btn-secondary">
          Batal
        </Link>
      </div>
    </form>
  );
}
