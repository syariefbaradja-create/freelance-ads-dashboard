import { z } from "zod";
import {
  METRIC_FIELD_LABELS,
  OBJECTIVE_PLATFORMS,
  OBJECTIVE_REQUIRED_FIELDS,
  OBJECTIVE_VALUES,
  PLATFORM_VALUES,
  type Objective,
} from "@/lib/metrics/objective";

export const clientSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  // Optional alternate login identifier — kept simple (no "@") so the login
  // form can tell email and username apart just by checking for "@".
  username: z.string().optional().refine(
    (val) => !val || /^[a-zA-Z0-9._-]{3,}$/.test(val),
    "Username minimal 3 karakter, hanya huruf/angka/titik/underscore/strip"
  ),
});

export const createClientSchema = clientSchema.extend({
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const campaignSchema = z
  .object({
    clientId: z.string().uuid("Pilih client"),
    platform: z.enum(PLATFORM_VALUES),
    objective: z.enum(OBJECTIVE_VALUES),
    name: z.string().min(1, "Nama campaign wajib diisi"),
    catalogName: z.string().optional(),
  })
  .refine(
    (data) => data.objective !== "meta_cpas" || !!data.catalogName?.trim(),
    {
      message: "Catalog/Product Set Name wajib diisi untuk Meta CPAS",
      path: ["catalogName"],
    }
  )
  .refine(
    (data) => OBJECTIVE_PLATFORMS[data.objective].includes(data.platform),
    {
      message: "Platform tidak sesuai untuk objective ini",
      path: ["platform"],
    }
  );

/** Converts an empty/blank form value to `undefined` so optional numeric
 * fields aren't coerced to 0 when left blank. */
export function optionalNumber(value: FormDataEntryValue | null) {
  if (value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed === "" ? undefined : trimmed;
}

const numericField = z.coerce
  .number({ message: "Harus berupa angka" })
  .nonnegative("Tidak boleh minus")
  .optional();

const metricBaseSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  spend: z.coerce.number({ message: "Harus berupa angka" }).nonnegative("Tidak boleh minus"),
  impressions: numericField,
  reach: numericField,
  frequency: numericField,
  clicks: numericField,
  postEngagements: numericField,
  videoViews: numericField,
  leads: numericField,
  conversions: numericField,
  purchases: numericField,
  revenue: numericField,
  viewProductPage: numericField,
  addToCart: numericField,
  addToCartValue: numericField,
});

export type MetricInput = z.infer<typeof metricBaseSchema>;

/** Required fields depend on the campaign's objective, so the schema is
 * built per-request rather than statically. */
export function buildMetricSchema(objective: Objective) {
  const required = OBJECTIVE_REQUIRED_FIELDS[objective];

  return metricBaseSchema.superRefine((data, ctx) => {
    for (const field of required) {
      if (data[field] === undefined) {
        ctx.addIssue({
          code: "custom",
          message: `${METRIC_FIELD_LABELS[field]} wajib diisi untuk objective ini`,
          path: [field],
        });
      }
    }
  });
}
