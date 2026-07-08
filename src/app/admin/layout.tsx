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
    <div className="flex min-h-screen flex-1 flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-semibold text-gray-900">
            Dashboard
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin/clients" className="text-gray-600 hover:text-gray-900">
              Klien
            </Link>
            <Link href="/admin/campaigns" className="text-gray-600 hover:text-gray-900">
              Campaign
            </Link>
            <Link href="/admin/upload" className="text-gray-600 hover:text-gray-900">
              Upload Data
            </Link>
          </nav>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Keluar
          </button>
        </form>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
