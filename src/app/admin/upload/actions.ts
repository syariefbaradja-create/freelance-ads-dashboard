"use server";

import * as XLSX from "xlsx";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, clients, metrics } from "@/db/schema";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { COLUMN_HEADER_MAP, normalizeHeader } from "@/lib/excel/columns";
import {
  campaignLookupKey,
  validateRow,
  type CampaignLookup,
  type ClientLookup,
  type ParsedRow,
  type UploadRowData,
} from "@/lib/excel/parse-upload";

export type ParseUploadState = {
  error?: string;
  fileName?: string;
  rows?: ParsedRow[];
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = [".xlsx", ".csv"];

export async function parseUploadFile(
  _prevState: ParseUploadState,
  formData: FormData
): Promise<ParseUploadState> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pilih file .xlsx atau .csv terlebih dahulu." };
  }

  const lowerName = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    return { error: "Format file harus .xlsx atau .csv." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "Ukuran file maksimal 5MB." };
  }

  let rawRows: Record<string, unknown>[];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames.includes("Data Entry")
      ? "Data Entry"
      : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    rawRows = jsonRows.map((row) => {
      const mapped: Record<string, unknown> = {};
      for (const [header, value] of Object.entries(row)) {
        const key = COLUMN_HEADER_MAP[normalizeHeader(header)];
        if (key) mapped[key] = value;
      }
      return mapped;
    });
  } catch {
    return {
      error:
        "Gagal membaca file. Pastikan file tidak rusak dan formatnya .xlsx atau .csv.",
    };
  }

  if (rawRows.length === 0) {
    return { error: "File tidak berisi data. Pastikan sheet 'Data Entry' terisi." };
  }

  const [allClients, allCampaigns] = await Promise.all([
    db.select({ id: clients.id, name: clients.name }).from(clients),
    db
      .select({
        clientId: campaigns.clientId,
        platform: campaigns.platform,
        objective: campaigns.objective,
        name: campaigns.name,
        catalogName: campaigns.catalogName,
      })
      .from(campaigns),
  ]);

  const clientsByName: ClientLookup = new Map();
  for (const client of allClients) {
    clientsByName.set(client.name.trim().toLowerCase(), client);
  }

  const campaignsByKey: CampaignLookup = new Map();
  for (const campaign of allCampaigns) {
    campaignsByKey.set(
      campaignLookupKey(
        campaign.clientId,
        campaign.platform,
        campaign.objective,
        campaign.name
      ),
      { catalogName: campaign.catalogName }
    );
  }

  const rows = rawRows
    .map((raw, index) => validateRow(index + 2, raw, clientsByName, campaignsByKey))
    .filter((row) => row.status !== "blank");

  if (rows.length === 0) {
    return { error: "Tidak ada baris data yang bisa diproses di file ini." };
  }

  return { fileName: file.name, rows };
}

export type CommitResult = { error?: string; savedCount?: number };

export async function commitUploadRows(
  rowsData: UploadRowData[]
): Promise<CommitResult> {
  if (rowsData.length === 0) {
    return { error: "Tidak ada baris valid untuk disimpan." };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi login tidak ditemukan, silakan login ulang." };
  }

  let savedCount = 0;

  for (const row of rowsData) {
    // Find-or-create: a campaign is identified by client + platform +
    // objective + name (case-insensitive), matching how the manual
    // "Tambah Campaign" form and the upload template both describe one.
    const candidateRows = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.clientId, row.clientId));

    const match = candidateRows.find(
      (c) =>
        c.platform === row.platform &&
        c.objective === row.objective &&
        c.name.trim().toLowerCase() === row.campaignName.trim().toLowerCase()
    );

    let campaignId: string;
    if (match) {
      campaignId = match.id;
    } else {
      const [created] = await db
        .insert(campaigns)
        .values({
          clientId: row.clientId,
          platform: row.platform,
          objective: row.objective,
          name: row.campaignName,
          catalogName: row.objective === "meta_cpas" ? row.catalogName : null,
        })
        .returning({ id: campaigns.id });
      campaignId = created.id;
    }

    // Explicit null (not `?.toString()`, which yields `undefined` for null
    // input) — an update must be able to CLEAR a field that's no longer
    // relevant, and drizzle treats `undefined` in `set` as "leave as-is".
    const toNumeric = (n: number | null) => (n == null ? null : n.toString());

    const numericValues = {
      impressions: toNumeric(row.impressions),
      reach: toNumeric(row.reach),
      frequency: toNumeric(row.frequency),
      clicks: toNumeric(row.clicks),
      postEngagements: toNumeric(row.postEngagements),
      videoViews: toNumeric(row.videoViews),
      leads: toNumeric(row.leads),
      conversions: toNumeric(row.conversions),
      purchases: toNumeric(row.purchases),
      revenue: toNumeric(row.revenue),
    };

    await db
      .insert(metrics)
      .values({
        campaignId,
        date: row.date,
        spend: String(row.spend),
        ...numericValues,
        createdBy: user.id,
      })
      .onConflictDoUpdate({
        target: [metrics.campaignId, metrics.date],
        set: {
          spend: String(row.spend),
          ...numericValues,
          updatedAt: new Date(),
        },
      });

    savedCount += 1;
  }

  return { savedCount };
}
