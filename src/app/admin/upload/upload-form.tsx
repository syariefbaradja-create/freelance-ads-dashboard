"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  parseUploadFile,
  commitUploadRows,
  type ParseUploadState,
} from "./actions";

const initialState: ParseUploadState = {};

const STATUS_STYLES: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  ok: "OK",
  warning: "Warning",
  error: "Error",
};

export function UploadForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    parseUploadFile,
    initialState
  );
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [committed, setCommitted] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const rows = useMemo(() => state.rows ?? [], [state.rows]);
  const counts = useMemo(() => {
    const result = { ok: 0, warning: 0, error: 0 };
    for (const row of rows) {
      if (row.status === "ok") result.ok += 1;
      else if (row.status === "warning") result.warning += 1;
      else if (row.status === "error") result.error += 1;
    }
    return result;
  }, [rows]);

  const savableRows = rows.filter((row) => row.data !== null);

  async function handleSave() {
    setCommitting(true);
    setCommitError(null);
    const result = await commitUploadRows(
      savableRows.map((row) => row.data!)
    );
    setCommitting(false);
    if (result.error) {
      setCommitError(result.error);
      return;
    }
    setCommitted(result.savedCount ?? 0);
  }

  if (committed !== null) {
    return (
      <div className="card p-6">
        <p className="text-sm text-slate-900">
          Berhasil menyimpan {committed} baris data.
        </p>
        <button
          type="button"
          onClick={() => router.push("/admin/campaigns")}
          className="btn-primary mt-4"
        >
          Lihat Campaign
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="card space-y-4 p-6">
        <div>
          <label htmlFor="file" className="field-label">
            File Excel (.xlsx) atau CSV
          </label>
          <div className="flex items-center gap-3">
            <label
              htmlFor="file"
              className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500"
            >
              Pilih File
            </label>
            <span className="text-sm text-slate-600">
              {fileName ?? "Belum ada file dipilih"}
            </span>
          </div>
          <input
            id="file"
            name="file"
            type="file"
            accept=".xlsx,.csv"
            required
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            className="sr-only"
          />
          <p className="mt-1 text-xs text-slate-500">
            Maksimal 5MB. Gunakan template dengan sheet &quot;Data
            Entry&quot;.
          </p>
        </div>
        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Memproses..." : "Preview"}
        </button>
      </form>

      {rows.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {state.fileName} — {rows.length} baris ({counts.ok} OK,{" "}
              {counts.warning} warning, {counts.error} error)
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={committing || savableRows.length === 0}
              className="btn-primary"
            >
              {committing
                ? "Menyimpan..."
                : `Simpan ${savableRows.length} Baris`}
            </button>
          </div>

          {commitError && (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {commitError}
            </p>
          )}

          <div className="table-card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Baris</th>
                  <th>Status</th>
                  <th>Client</th>
                  <th>Campaign</th>
                  <th>Tanggal</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className="text-slate-500">{row.rowNumber}</td>
                    <td>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[row.status]}`}
                      >
                        {STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="font-medium text-slate-900">
                      {row.preview.clientName}
                    </td>
                    <td>{row.preview.campaignName}</td>
                    <td>{row.preview.date}</td>
                    <td>
                      {row.messages.length > 0 && (
                        <ul className="list-inside list-disc space-y-1">
                          {row.messages.map((message, i) => (
                            <li key={i}>{message}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
