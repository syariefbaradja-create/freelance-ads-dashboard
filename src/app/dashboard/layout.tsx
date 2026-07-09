import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth/role";
import { logout } from "@/app/actions/auth";

export default async function DashboardLayout({
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
  if (!user || getRole(user) !== "client") {
    redirect("/login");
  }

  // Re-check is_active on every request (not just at login) so a client
  // deactivated mid-session is kicked out immediately, not just once their
  // JWT expires.
  const { data: clientRow } = await supabase
    .from("clients")
    .select("is_active")
    .eq("id", user.id)
    .single();

  if (!clientRow?.is_active) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            S
          </div>
          <span className="font-semibold text-slate-900">
            Dashboard Performa Ads
          </span>
        </div>
        <form action={logout}>
          <button type="submit" className="nav-link">
            Keluar
          </button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-6">{children}</main>
    </div>
  );
}
