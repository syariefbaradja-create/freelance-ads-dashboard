"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientSchema, createClientSchema } from "@/lib/validation";
import { isUsernameTaken } from "@/lib/auth/resolve-username";

export type ClientFormState = { error?: string };

function readUsername(formData: FormData) {
  const raw = formData.get("username");
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed === "" ? undefined : trimmed;
}

export async function createClientAccount(
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    username: readUsername(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  if (parsed.data.username && (await isUsernameTaken(parsed.data.username))) {
    return { error: "Username sudah dipakai, pilih yang lain." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { role: "client" },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Gagal membuat akun login." };
  }

  await db.insert(clients).values({
    id: data.user.id,
    name: parsed.data.name,
    email: parsed.data.email,
    username: parsed.data.username ?? null,
  });

  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

export async function updateClientAccount(
  id: string,
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    username: readUsername(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  if (
    parsed.data.username &&
    (await isUsernameTaken(parsed.data.username, { table: "clients", id }))
  ) {
    return { error: "Username sudah dipakai, pilih yang lain." };
  }

  await db
    .update(clients)
    .set({
      name: parsed.data.name,
      email: parsed.data.email,
      username: parsed.data.username ?? null,
    })
    .where(eq(clients.id, id));

  // Keep Supabase Auth's email in sync so login still works afterwards.
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(id, {
    email: parsed.data.email,
  });

  if (error) {
    return { error: `Data tersimpan, tapi gagal sinkron email login: ${error.message}` };
  }

  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

export async function toggleClientActive(id: string, nextActive: boolean) {
  await db.update(clients).set({ isActive: nextActive }).where(eq(clients.id, id));

  // Also block/unblock login at the auth level, not just the app's read of
  // isActive — otherwise an already-issued session could still work.
  const supabase = createAdminClient();
  await supabase.auth.admin.updateUserById(id, {
    ban_duration: nextActive ? "none" : "876000h",
  });

  revalidatePath("/admin/clients");
}
