"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateClientAccount, type ClientFormState } from "../../actions";
import type { clients } from "@/db/schema";

const initialState: ClientFormState = {};

export function EditClientForm({
  client,
}: {
  client: typeof clients.$inferSelect;
}) {
  const updateWithId = updateClientAccount.bind(null, client.id);
  const [state, formAction, pending] = useActionState(
    updateWithId,
    initialState
  );

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <div>
        <label htmlFor="name" className="field-label">
          Nama
        </label>
        <input
          id="name"
          name="name"
          defaultValue={client.name}
          required
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={client.email}
          required
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="username" className="field-label">
          Username (opsional)
        </label>
        <input
          id="username"
          name="username"
          defaultValue={client.username ?? ""}
          placeholder="mis. klinik_sehat"
          className="input-field"
        />
        <p className="mt-1 text-xs text-slate-500">
          Kalau diisi, klien bisa login pakai username ini selain email.
        </p>
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
        <Link href="/admin/clients" className="btn-secondary">
          Batal
        </Link>
      </div>
    </form>
  );
}
