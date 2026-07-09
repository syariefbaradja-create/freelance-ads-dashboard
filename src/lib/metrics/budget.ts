import type { Objective, Platform } from "./objective";

export type ClientBudget = {
  totalTopup: number;
  totalSpend: number;
  remaining: number;
};

export function calcClientBudget(
  totalTopup: number,
  totalSpend: number
): ClientBudget {
  return { totalTopup, totalSpend, remaining: totalTopup - totalSpend };
}

// Budget bucket for top ups and spend. Meta CPAS gets its own bucket even
// though it technically runs on the "meta" platform, because it uses a
// separate ad account from regular Meta campaigns.
export const BUDGET_CATEGORY_VALUES = [
  "meta",
  "meta_cpas",
  "tiktok",
  "google",
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORY_VALUES)[number];

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  meta: "Meta",
  meta_cpas: "Meta CPAS",
  tiktok: "TikTok",
  google: "Google",
};

/** Every campaign falls into exactly one budget category, derived from its
 * platform + objective — meta_cpas is the only objective with its own
 * category; every other platform/objective combo maps 1:1 to its platform. */
export function categorizeCampaign(
  platform: Platform,
  objective: Objective
): BudgetCategory {
  if (objective === "meta_cpas") return "meta_cpas";
  return platform as BudgetCategory;
}

export type CategoryBudget = ClientBudget & { category: BudgetCategory };

/** Per-category top up/spend/remaining breakdown, plus an "uncategorized"
 * top-up total for rows recorded before this feature existed. No spend is
 * ever uncategorized — every campaign always has a platform + objective. */
export function calcBudgetBreakdown(
  topups: { amount: number; category: BudgetCategory | null }[],
  campaignSpend: { platform: Platform; objective: Objective; spend: number }[]
): {
  categories: CategoryBudget[];
  uncategorizedTopup: number;
} {
  const topupByCategory = new Map<BudgetCategory, number>();
  let uncategorizedTopup = 0;

  for (const t of topups) {
    if (t.category == null) {
      uncategorizedTopup += t.amount;
    } else {
      topupByCategory.set(
        t.category,
        (topupByCategory.get(t.category) ?? 0) + t.amount
      );
    }
  }

  const spendByCategory = new Map<BudgetCategory, number>();
  for (const c of campaignSpend) {
    const category = categorizeCampaign(c.platform, c.objective);
    spendByCategory.set(
      category,
      (spendByCategory.get(category) ?? 0) + c.spend
    );
  }

  const categories = BUDGET_CATEGORY_VALUES.map((category) => {
    const totalTopup = topupByCategory.get(category) ?? 0;
    const totalSpend = spendByCategory.get(category) ?? 0;
    return { category, ...calcClientBudget(totalTopup, totalSpend) };
  });

  return { categories, uncategorizedTopup };
}
