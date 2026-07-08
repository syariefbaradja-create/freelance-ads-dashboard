"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientSchema, createClientSchema } from "@/lib/validation";

export type ClientFormState = { error?: string };

export async function createClientAccount(
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  await db
    .update(clients)
    .set({ name: parsed.data.name, email: parsed.data.email })
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
