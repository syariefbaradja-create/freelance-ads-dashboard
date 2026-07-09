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
