"use client";

import React from "react";
import type { VehicleTypePricingValues } from "@/app/component/vehicleTypePricingWarningModal";

const PRICING_KEYS: (keyof VehicleTypePricingValues)[] = [
  "suvPrice",
  "sedanPrice",
  "truckPrice",
  "chassisTruckPrice",
  "other",
];

function normalizePricingValue(value: string): string {
  return String(value ?? "").trim();
}

export function hasVehicleTypePricingChanged(
  original: VehicleTypePricingValues,
  current: VehicleTypePricingValues
): boolean {
  return PRICING_KEYS.some(
    (key) => normalizePricingValue(original[key]) !== normalizePricingValue(current[key])
  );
}

interface VehicleTypePricingUpdateModalProps {
  onApplyFutureOnly: () => void;
  onApplyPreviousToo: () => void;
}

const VehicleTypePricingUpdateModal: React.FC<VehicleTypePricingUpdateModalProps> = ({
  onApplyFutureOnly,
  onApplyPreviousToo,
}) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 sm:px-6">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-pricing-update-title"
      >
        <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-4">
          <h2
            id="vehicle-pricing-update-title"
            className="text-xl font-bold text-gray-900 leading-snug text-center"
          >
            Update Vehicle Type Pricing
          </h2>
        </div>

        <div className="px-6 sm:px-8 pb-2">
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center">
            You changed one or more vehicle type amounts. Do you want this update to apply only to
            work orders added to this job in the future, or to previous work orders as well?
          </p>
        </div>

        <div className="flex flex-col gap-3 px-6 sm:px-8 py-6 sm:py-7 mt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onApplyFutureOnly}
            className="w-full py-3 px-5 primary-bg text-sm sm:text-base border border-black-500 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Apply to future work orders only
          </button>
          <button
            type="button"
            onClick={onApplyPreviousToo}
            className="w-full py-3 px-5 rounded-lg bg-gray-200 text-sm sm:text-base font-medium text-gray-800 hover:bg-gray-300 transition-colors"
          >
            Apply to previous work orders too
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleTypePricingUpdateModal;
