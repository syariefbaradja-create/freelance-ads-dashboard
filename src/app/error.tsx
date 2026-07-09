"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-50 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-red-100 via-slate-50 to-slate-50" />
      <div className="relative w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-lg font-bold text-white shadow-sm">
          !
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          Terjadi kesalahan
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Maaf, ada yang tidak beres saat memuat halaman ini. Coba lagi, atau
          hubungi admin kalau masalah terus berlanjut.
        </p>
        <button type="button" onClick={() => reset()} className="btn-primary mt-6">
          Coba Lagi
        </button>
      </div>
    </main>
  );
}
