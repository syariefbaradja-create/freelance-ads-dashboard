import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth/role";
import { logout } from "@/app/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth — proxy.ts already gates this route, this catches
  // any request that reaches the layout without going through it.
  if (!user || getRole(user) !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link href="/admin" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              A
            </div>
            <span className="hidden font-semibold text-slate-900 sm:inline">
              Dashboard
            </span>
          </Link>
          <nav className="flex gap-1 overflow-x-auto text-sm">
            <Link href="/admin/clients" className="nav-link shrink-0">
              Klien
            </Link>
            <Link href="/admin/campaigns" className="nav-link shrink-0">
              Campaign
            </Link>
            <Link href="/admin/input-data" className="nav-link shrink-0">
              Input Data
            </Link>
            <Link href="/admin/upload" className="nav-link shrink-0">
              Upload Data
            </Link>
          </nav>
        </div>
        <form action={logout} className="shrink-0">
          <button type="submit" className="nav-link">
            Keluar
          </button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
