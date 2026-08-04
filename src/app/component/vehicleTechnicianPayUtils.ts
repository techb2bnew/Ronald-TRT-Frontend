export type TechnicianAmountField =
  | "techPercentageCalculatedAmount"
  | "rPercentageCalculatedAmount";

export function isDentTechnicianType(techType: string | undefined): boolean {
  return techType === "technician" || techType === "FlatRate";
}

export function getTechnicianRatePool(
  techDetail: { techFlatRate?: string; rRate?: string; techType?: string } | undefined,
  isDentTech: boolean
): number {
  if (!techDetail) return 0;
  const raw = isDentTech ? techDetail.techFlatRate : techDetail.rRate;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function amountFromPercentage(percentage: number, ratePool: number): number {
  if (!Number.isFinite(percentage) || !ratePool) return 0;
  return Number(((percentage / 100) * ratePool).toFixed(2));
}

export function percentageFromAmount(amount: number, ratePool: number): number {
  if (!Number.isFinite(amount) || !ratePool) return 0;
  return Number(((amount / ratePool) * 100).toFixed(2));
}

export function buildAmountMapFromPercentages(
  technicianDetails: any[] | undefined,
  percentages: Record<string, number>,
  isDentTech: boolean
): Record<string, number> {
  const next: Record<string, number> = {};
  if (!Array.isArray(technicianDetails)) return next;

  technicianDetails.forEach((tech) => {
    const techType = String(tech?.techType || "");
    const isMatch = isDentTech
      ? isDentTechnicianType(techType)
      : techType === "R/I/R/R";
    if (!isMatch) return;

    const tid = String(tech.id);
    const pct = Number(percentages[tid] ?? 0);
    const ratePool = getTechnicianRatePool(tech, isDentTech);
    next[tid] = amountFromPercentage(pct, ratePool);
  });

  return next;
}

export function seedAmountMapFromDetails(
  technicianDetails: any[] | undefined,
  isDentTech: boolean
): Record<string, number> {
  const next: Record<string, number> = {};
  if (!Array.isArray(technicianDetails)) return next;

  technicianDetails.forEach((tech) => {
    const techType = String(tech?.techType || "");
    const isMatch = isDentTech
      ? isDentTechnicianType(techType)
      : techType === "R/I/R/R";
    if (!isMatch) return;

    const tid = String(tech.id);
    const amountField = isDentTech
      ? "techPercentageCalculatedAmount"
      : "rPercentageCalculatedAmount";
    const pctField = isDentTech ? "techPercentage" : "rPercentage";
    const rawAmount = tech?.[amountField];
    const parsedAmount = Number(rawAmount);

    if (Number.isFinite(parsedAmount) && parsedAmount >= 0) {
      next[tid] = Number(parsedAmount.toFixed(2));
      return;
    }

    const pct = Number(tech?.[pctField] ?? 0);
    const ratePool = getTechnicianRatePool(tech, isDentTech);
    next[tid] = amountFromPercentage(pct, ratePool);
  });

  return next;
}
