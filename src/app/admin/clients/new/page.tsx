"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createClientAccount, type ClientFormState } from "../actions";

const initialState: ClientFormState = {};

export default function NewClientPage() {
  const [state, formAction, pending] = useActionState(
    createClientAccount,
    initialState
  );

  return (
    <div>
      <h1 className="mb-6 page-title">Tambah Klien</h1>
      <form action={formAction} className="card space-y-4 p-6">
        <div>
          <label htmlFor="name" className="field-label">
            Nama
          </label>
          <input id="name" name="name" required className="input-field" />
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
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
            placeholder="mis. klinik_sehat"
            className="input-field"
          />
          <p className="mt-1 text-xs text-slate-500">
            Kalau diisi, klien bisa login pakai username ini selain email.
          </p>
        </div>
        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="input-field"
          />
          <p className="mt-1 text-xs text-slate-500">
            Minimal 6 karakter. Beri tahu klien secara manual (WA/email).
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
    </div>
  );
}
