export const OBJECTIVE_VALUES = [
  "awareness",
  "traffic",
  "engagement",
  "leads",
  "sales",
  "meta_cpas",
] as const;
export type Objective = (typeof OBJECTIVE_VALUES)[number];

export const OBJECTIVE_LABELS: Record<Objective, string> = {
  awareness: "Awareness",
  traffic: "Traffic",
  engagement: "Engagement",
  leads: "Leads",
  sales: "Sales/Conversions",
  meta_cpas: "Meta CPAS (Catalog Sales)",
};

/** Next.js collapses a single repeated query param to a plain string and
 * only produces an array once there are 2+ — this normalizes both cases,
 * dropping anything that isn't a real objective value. Empty result means
 * "no filter" (show all), same as the old single-select's "Semua". */
export function parseObjectivesParam(
  value: string | string[] | undefined
): Objective[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return raw.filter((v): v is Objective =>
    (OBJECTIVE_VALUES as readonly string[]).includes(v)
  );
}

export const PLATFORM_VALUES = ["meta", "tiktok", "google"] as const;
export type Platform = (typeof PLATFORM_VALUES)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  meta: "Meta",
  tiktok: "TikTok",
  google: "Google",
};

// Which platforms are valid for each objective — PRD 5.1.
export const OBJECTIVE_PLATFORMS: Record<Objective, Platform[]> = {
  awareness: ["meta", "tiktok"],
  traffic: ["meta", "tiktok"],
  engagement: ["meta", "tiktok"],
  leads: ["meta", "tiktok"],
  sales: ["meta", "tiktok", "google"],
  meta_cpas: ["meta"],
};

export type MetricFieldKey =
  | "impressions"
  | "reach"
  | "frequency"
  | "clicks"
  | "postEngagements"
  | "videoViews"
  | "leads"
  | "conversions"
  | "purchases"
  | "revenue"
  | "viewProductPage"
  | "addToCart"
  | "addToCartValue";

export const METRIC_FIELD_LABELS: Record<MetricFieldKey, string> = {
  impressions: "Impressions",
  reach: "Reach",
  frequency: "Frequency",
  clicks: "Clicks",
  postEngagements: "Post Engagements",
  videoViews: "Video Views/ThruPlays",
  leads: "Leads",
  conversions: "Conversions",
  purchases: "Purchases",
  revenue: "Revenue",
  viewProductPage: "View Product Page",
  addToCart: "Add to Cart",
  addToCartValue: "Add to Cart Value",
};

// Which raw metric fields are relevant (shown) for each objective —
// PRD 5.1 table. Derived metrics (CTR, CPC, CPM, etc.) are never stored,
// so they're not part of this list — they're computed for display.
export const OBJECTIVE_METRIC_FIELDS: Record<Objective, MetricFieldKey[]> = {
  awareness: ["impressions", "reach", "frequency", "clicks"],
  traffic: ["impressions", "clicks"],
  engagement: ["impressions", "postEngagements", "videoViews", "clicks"],
  leads: ["impressions", "clicks", "leads"],
  sales: ["impressions", "clicks", "conversions", "revenue"],
  meta_cpas: [
    "impressions",
    "clicks",
    "viewProductPage",
    "addToCart",
    "addToCartValue",
    "purchases",
    "revenue",
  ],
};

// Which fields are mandatory (besides `spend`, which is always required) —
// PRD 5.1 "Field Wajib" column.
export const OBJECTIVE_REQUIRED_FIELDS: Record<Objective, MetricFieldKey[]> = {
  awareness: ["impressions", "reach"],
  traffic: ["clicks"],
  engagement: ["postEngagements"],
  leads: ["leads"],
  sales: ["conversions"],
  meta_cpas: ["purchases", "revenue"],
};
