"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { topups } from "@/db/schema";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export type TopupFormState = { error?: string };

const topupSchema = z.object({
  amount: z.coerce.number({ message: "Harus berupa angka" }).positive("Harus lebih dari 0"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  note: z.string().optional(),
});

function readTopupFormData(formData: FormData) {
  return {
    amount: formData.get("amount"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  };
}

export async function createTopup(
  clientId: string,
  _prevState: TopupFormState,
  formData: FormData
): Promise<TopupFormState> {
  const parsed = topupSchema.safeParse(readTopupFormData(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi login tidak ditemukan, silakan login ulang." };
  }

  await db.insert(topups).values({
    clientId,
    amount: String(parsed.data.amount),
    date: parsed.data.date,
    note: parsed.data.note ?? null,
    createdBy: user.id,
  });

  revalidatePath(`/admin/clients/${clientId}/budget`);
  redirect(`/admin/clients/${clientId}/budget`);
}

export async function updateTopup(
  topupId: string,
  clientId: string,
  _prevState: TopupFormState,
  formData: FormData
): Promise<TopupFormState> {
  const parsed = topupSchema.safeParse(readTopupFormData(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  await db
    .update(topups)
    .set({
      amount: String(parsed.data.amount),
      date: parsed.data.date,
      note: parsed.data.note ?? null,
      updatedAt: new Date(),
    })
    .where(eq(topups.id, topupId));

  revalidatePath(`/admin/clients/${clientId}/budget`);
  redirect(`/admin/clients/${clientId}/budget`);
}

export async function deleteTopup(topupId: string, clientId: string) {
  await db.delete(topups).where(eq(topups.id, topupId));
  revalidatePath(`/admin/clients/${clientId}/budget`);
}
