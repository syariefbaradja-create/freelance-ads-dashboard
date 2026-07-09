"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth/role";
import { resolveUsernameToEmail } from "@/lib/auth/resolve-username";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email/Username wajib diisi"),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Email atau password tidak valid." };
  }

  // Supabase Auth only ever authenticates by email — if the identifier
  // isn't shaped like one, resolve it as a username first.
  let email = parsed.data.identifier;
  if (!email.includes("@")) {
    const resolved = await resolveUsernameToEmail(email);
    if (!resolved) {
      return { error: "Email atau password salah." };
    }
    email = resolved;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Email atau password salah." };
  }

  const role = getRole(data.user);
  redirect(role === "admin" ? "/admin" : "/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
