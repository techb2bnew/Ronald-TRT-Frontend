/** Letters and digits only (no spaces or symbols). */
export const STOCK_NUMBER_PATTERN = /^[A-Za-z0-9]*$/;

export const STOCK_NUMBER_SUBMIT_PATTERN = /^[A-Za-z0-9]+$/;

export function sanitizeStockNumberInput(value: string): string {
  return String(value ?? "").replace(/[^A-Za-z0-9]/g, "");
}

export function isStockNumberInputValid(value: string): boolean {
  return STOCK_NUMBER_PATTERN.test(value);
}

export function isStockNumberValid(value: string): boolean {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return true;
  return STOCK_NUMBER_SUBMIT_PATTERN.test(trimmed);
}

/** Read stock number from vehicle / invoice row shapes returned by various APIs. */
export function readStockNumber(row: Record<string, unknown> | null | undefined): string {
  if (!row) return "";
  const direct = row.stockNumber ?? row.stock_number;
  if (direct != null && String(direct).trim() !== "") return String(direct).trim();
  const vehicle = row.vehicle as Record<string, unknown> | undefined;
  if (vehicle?.stockNumber != null && String(vehicle.stockNumber).trim() !== "") {
    return String(vehicle.stockNumber).trim();
  }
  const vehicles = row.vehicles;
  if (Array.isArray(vehicles) && vehicles[0]?.stockNumber != null) {
    return String(vehicles[0].stockNumber).trim();
  }
  return "";
}

export function formatStockNumberCell(row: Record<string, unknown> | null | undefined): string {
  const value = readStockNumber(row);
  return value || "—";
}
