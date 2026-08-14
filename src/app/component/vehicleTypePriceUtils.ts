/**
 * Resolve job vehicle-type pricing amount for a selected work-order vehicle type.
 * Job API uses labels like "Chassis Truck"; work-order UI may use "Chassis Trucks".
 */

export type VehicleTypePricingItem = {
  vehicleType?: string;
  amount?: string | number | null;
};

function normalizeVehicleTypeKey(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ")
    .replace(/s\b/g, "") // Sedans→sedan, Trucks→truck, Chassis Trucks→chassis truck
    .trim();
}

export function resolveVehicleTypePrice(
  selectedVehicleType: string,
  pricing: VehicleTypePricingItem[] | null | undefined
): string {
  const selected = String(selectedVehicleType || "").trim();
  if (!selected || !Array.isArray(pricing) || pricing.length === 0) return "";

  const selectedKey = normalizeVehicleTypeKey(selected);
  const match = pricing.find((item) => {
    const typeKey = normalizeVehicleTypeKey(String(item?.vehicleType || ""));
    return typeKey === selectedKey || typeKey.includes(selectedKey) || selectedKey.includes(typeKey);
  });

  if (!match) return "";
  const amount = match.amount;
  if (amount == null || amount === "") return "";
  const num = Number(amount);
  if (!Number.isFinite(num)) return String(amount).trim();
  return String(num);
}

export function getVehicleTypePriceFromJobOrVehicle(row: any): string {
  if (!row) return "";
  const direct =
    row.vehicleTypePrice ??
    row.vehicle_type_price ??
    row.vehicleType?.price ??
    "";
  if (direct != null && String(direct).trim() !== "" && String(direct).toLowerCase() !== "null") {
    return String(direct).trim();
  }

  const selectedType = String(row.vehicleType || "").trim();
  const pricing =
    row.job?.vehicleTypePricing ||
    row.vehicleTypePricing ||
    row.job?.vehicle_type_pricing ||
    [];
  return resolveVehicleTypePrice(selectedType, pricing);
}
