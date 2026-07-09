import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-50 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-50" />
      <div className="relative w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm">
          S
        </div>
        <p className="text-sm font-medium text-indigo-600">404</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Halaman yang Anda cari tidak ada atau sudah dipindahkan.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
