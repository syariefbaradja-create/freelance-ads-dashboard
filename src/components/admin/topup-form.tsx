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
            htmlFor="amount"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="note"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Catatan (opsional)
        </label>
        <input
          id="note"
          name="note"
          defaultValue={defaultValues?.note ?? ""}
          placeholder="mis. Top up untuk campaign Juli"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        />
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
          href={`/admin/clients/${clientId}/budget`}
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
