import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <p className="text-sm font-medium text-indigo-600">404</p>
      <h1 className="mt-1 page-title">Data tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Data yang Anda cari tidak ada, sudah dihapus, atau URL-nya salah.
      </p>
      <Link href="/admin" className="btn-primary mt-6">
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
