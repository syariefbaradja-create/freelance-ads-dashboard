import {
  METRIC_FIELD_LABELS,
  OBJECTIVE_LABELS,
  OBJECTIVE_METRIC_FIELDS,
  OBJECTIVE_PLATFORMS,
  OBJECTIVE_REQUIRED_FIELDS,
  OBJECTIVE_VALUES,
  PLATFORM_VALUES,
  type MetricFieldKey,
  type Objective,
  type Platform,
} from "@/lib/metrics/objective";

export type UploadRowData = {
  clientId: string;
  clientName: string;
  platform: Platform;
  objective: Objective;
  campaignName: string;
  catalogName: string | null;
  date: string;
  spend: number;
  impressions: number | null;
  reach: number | null;
  frequency: number | null;
  clicks: number | null;
  postEngagements: number | null;
  videoViews: number | null;
  leads: number | null;
  conversions: number | null;
  purchases: number | null;
  revenue: number | null;
};

export type ParsedRow = {
  rowNumber: number;
  status: "ok" | "warning" | "error" | "blank";
  messages: string[];
  preview: Record<string, string>;
  data: UploadRowData | null;
};

export type ClientLookup = Map<string, { id: string; name: string }>;
export type CampaignLookup = Map<string, { catalogName: string | null }>;

const OBJECTIVE_LABEL_TO_VALUE: Record<string, Objective> = {};
for (const value of OBJECTIVE_VALUES) {
  OBJECTIVE_LABEL_TO_VALUE[OBJECTIVE_LABELS[value].toLowerCase()] = value;
  OBJECTIVE_LABEL_TO_VALUE[value] = value;
}
OBJECTIVE_LABEL_TO_VALUE["sales"] = "sales";
OBJECTIVE_LABEL_TO_VALUE["conversions"] = "sales";
OBJECTIVE_LABEL_TO_VALUE["meta cpas"] = "meta_cpas";
OBJECTIVE_LABEL_TO_VALUE["cpas"] = "meta_cpas";

function parseObjective(raw: string): Objective | null {
  return OBJECTIVE_LABEL_TO_VALUE[raw.trim().toLowerCase()] ?? null;
}

function parsePlatform(raw: string): Platform | null {
  const key = raw.trim().toLowerCase();
  return (PLATFORM_VALUES as readonly string[]).includes(key)
    ? (key as Platform)
    : null;
}

function parseDate(raw: unknown): string | null {
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return null;
    return raw.toISOString().slice(0, 10);
  }
  const str = String(raw ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : null;
}

const INVALID = Symbol("invalid-number");

function parseNumber(raw: unknown): number | null | typeof INVALID {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : INVALID;
  const trimmed = String(raw).trim();
  if (trimmed === "") return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : INVALID;
}

export function campaignLookupKey(
  clientId: string,
  platform: string,
  objective: string,
  name: string
) {
  return `${clientId}|${platform}|${objective}|${name.trim().toLowerCase()}`;
}

const NUMERIC_FIELDS: MetricFieldKey[] = [
  "impressions",
  "reach",
  "frequency",
  "clicks",
  "postEngagements",
  "videoViews",
  "leads",
  "conversions",
  "purchases",
  "revenue",
];

export function validateRow(
  rowNumber: number,
  raw: Record<string, unknown>,
  clientsByName: ClientLookup,
  campaignsByKey: CampaignLookup
): ParsedRow {
  const messages: string[] = [];
  let hasError = false;

  const preview: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value == null) {
      preview[key] = "";
    } else if (value instanceof Date) {
      preview[key] = Number.isNaN(value.getTime())
        ? String(value)
        : value.toISOString().slice(0, 10);
    } else {
      preview[key] = String(value);
    }
  }

  const clientNameRaw = String(raw.clientName ?? "").trim();
  const platformRaw = String(raw.platform ?? "").trim();
  const objectiveRaw = String(raw.objective ?? "").trim();
  const campaignNameRaw = String(raw.campaignName ?? "").trim();

  if (!clientNameRaw && !platformRaw && !objectiveRaw && !campaignNameRaw) {
    return { rowNumber, status: "blank", messages: [], preview, data: null };
  }

  const client = clientsByName.get(clientNameRaw.toLowerCase());
  if (!client) {
    hasError = true;
    messages.push(
      `Client "${clientNameRaw || "(kosong)"}" tidak ditemukan. Tambahkan klien ini dulu di menu Klien.`
    );
  }

  const platform = parsePlatform(platformRaw);
  if (!platform) {
    hasError = true;
    messages.push(
      `Platform "${platformRaw || "(kosong)"}" tidak valid. Harus Meta, TikTok, atau Google.`
    );
  }

  const objective = parseObjective(objectiveRaw);
  if (!objective) {
    hasError = true;
    messages.push(`Objective "${objectiveRaw || "(kosong)"}" tidak valid.`);
  }

  if (
    platform &&
    objective &&
    !OBJECTIVE_PLATFORMS[objective].includes(platform)
  ) {
    hasError = true;
    messages.push(
      `Platform ${platformRaw} tidak berlaku untuk objective ${OBJECTIVE_LABELS[objective]}.`
    );
  }

  if (!campaignNameRaw) {
    hasError = true;
    messages.push("Campaign Name wajib diisi.");
  }

  const date = parseDate(raw.date);
  if (!date) {
    hasError = true;
    messages.push("Format tanggal harus YYYY-MM-DD.");
  }

  const spendParsed = parseNumber(raw.spend);
  if (spendParsed === INVALID || spendParsed === null) {
    hasError = true;
    messages.push("Spend wajib diisi dan harus berupa angka.");
  } else if (spendParsed < 0) {
    hasError = true;
    messages.push("Spend tidak boleh minus.");
  }

  const parsedNumbers: Partial<Record<MetricFieldKey, number | null>> = {};
  for (const field of NUMERIC_FIELDS) {
    const parsed = parseNumber(raw[field]);
    if (parsed === INVALID) {
      hasError = true;
      messages.push(`${METRIC_FIELD_LABELS[field]} harus berupa angka.`);
      continue;
    }
    if (parsed !== null && parsed < 0) {
      hasError = true;
      messages.push(`${METRIC_FIELD_LABELS[field]} tidak boleh minus.`);
      continue;
    }
    parsedNumbers[field] = parsed;
  }

  let catalogName: string | null = null;
  if (objective === "meta_cpas") {
    catalogName = String(raw.catalogName ?? "").trim() || null;

    const existingCampaign =
      client && platform
        ? campaignsByKey.get(
            campaignLookupKey(client.id, platform, objective, campaignNameRaw)
          )
        : undefined;

    // Catalog name is stored on the campaign, not per row. Only require it
    // here when this row will create a brand-new campaign.
    if (!catalogName && !existingCampaign) {
      hasError = true;
      messages.push(
        "Catalog/Product Set Name wajib diisi untuk objective Meta CPAS."
      );
    }
  }

  if (objective) {
    const required = OBJECTIVE_REQUIRED_FIELDS[objective];
    const relevant = new Set(OBJECTIVE_METRIC_FIELDS[objective]);

    for (const field of required) {
      if (parsedNumbers[field] == null) {
        hasError = true;
        messages.push(
          `${METRIC_FIELD_LABELS[field]} wajib diisi untuk objective ${OBJECTIVE_LABELS[objective]}.`
        );
      }
    }

    for (const field of NUMERIC_FIELDS) {
      if (!relevant.has(field) && parsedNumbers[field] != null) {
        messages.push(
          `${METRIC_FIELD_LABELS[field]} diisi tapi tidak relevan untuk objective ${OBJECTIVE_LABELS[objective]} — akan diabaikan.`
        );
        // Actually ignore it, matching the message above — otherwise it
        // would still get written to the database.
        parsedNumbers[field] = null;
      }
    }
  }

  if (
    hasError ||
    !client ||
    !platform ||
    !objective ||
    !date ||
    spendParsed === INVALID ||
    spendParsed === null
  ) {
    return { rowNumber, status: "error", messages, preview, data: null };
  }

  const data: UploadRowData = {
    clientId: client.id,
    clientName: client.name,
    platform,
    objective,
    campaignName: campaignNameRaw,
    catalogName,
    date,
    spend: spendParsed,
    impressions: parsedNumbers.impressions ?? null,
    reach: parsedNumbers.reach ?? null,
    frequency: parsedNumbers.frequency ?? null,
    clicks: parsedNumbers.clicks ?? null,
    postEngagements: parsedNumbers.postEngagements ?? null,
    videoViews: parsedNumbers.videoViews ?? null,
    leads: parsedNumbers.leads ?? null,
    conversions: parsedNumbers.conversions ?? null,
    purchases: parsedNumbers.purchases ?? null,
    revenue: parsedNumbers.revenue ?? null,
  };

  return {
    rowNumber,
    status: messages.length > 0 ? "warning" : "ok",
    messages,
    preview,
    data,
  };
}
