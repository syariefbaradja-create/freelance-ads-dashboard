"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
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
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-lg font-bold text-white shadow-sm">
        !
      </div>
      <h1 className="page-title">Terjadi kesalahan</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Maaf, ada yang tidak beres saat memuat halaman ini. Coba lagi, atau
        kembali ke dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={() => reset()} className="btn-primary">
          Coba Lagi
        </button>
        <Link href="/admin" className="btn-secondary">
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
