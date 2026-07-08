import { redirect } from "next/navigation";

// proxy.ts sends already-authenticated users to /admin or /dashboard;
// unauthenticated users land here and get bounced to /login.
export default function Home() {
  redirect("/login");
}
