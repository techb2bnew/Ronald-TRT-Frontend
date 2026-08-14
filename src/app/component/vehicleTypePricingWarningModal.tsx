"use client";

import React from "react";

export interface VehicleTypePricingValues {
  suvPrice: string;
  sedanPrice: string;
  truckPrice: string;
  chassisTruckPrice: string;
  other: string;
}

const VEHICLE_TYPE_PRICING_FIELDS: { key: keyof VehicleTypePricingValues; label: string }[] = [
  { key: "suvPrice", label: "SUV's" },
  { key: "sedanPrice", label: "Sedans" },
  { key: "truckPrice", label: "Trucks" },
  { key: "chassisTruckPrice", label: "Chassis trucks" },
  { key: "other", label: "Other vehicles" },
];

export type VehiclePricingWarningVariant = "noneSelected" | "partialMissing";

export function getVehicleTypePricingWarning(pricing: VehicleTypePricingValues): {
  variant: VehiclePricingWarningVariant | null;
  missingLabels: string[];
} {
  const missingLabels = VEHICLE_TYPE_PRICING_FIELDS.filter(
    ({ key }) => !String(pricing[key] ?? "").trim()
  ).map(({ label }) => label);

  if (missingLabels.length === 0) {
    return { variant: null, missingLabels: [] };
  }

  if (missingLabels.length === VEHICLE_TYPE_PRICING_FIELDS.length) {
    return { variant: "noneSelected", missingLabels };
  }

  return { variant: "partialMissing", missingLabels };
}

interface VehicleTypePricingWarningModalProps {
  variant: VehiclePricingWarningVariant;
  missingLabels: string[];
  isEdit?: boolean;
  onProceed: () => void;
  onDismiss: () => void;
}

const WarningIcon = () => (
  <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 text-amber-500"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  </div>
);

const VehicleTypePricingWarningModal: React.FC<VehicleTypePricingWarningModalProps> = ({
  variant,
  missingLabels,
  isEdit = false,
  onProceed,
  onDismiss,
}) => {
  const isNoneSelected = variant === "noneSelected";
  const actionLabel = isNoneSelected
    ? isEdit
      ? "Update without vehicle type"
      : "Submit without vehicle type"
    : isEdit
      ? "Update job without vehicle amounts"
      : "Create job without vehicle amounts";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 sm:px-6">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-pricing-warning-title"
      >
        <div className="flex items-start gap-4 px-6 sm:px-8 pt-6 sm:pt-7 pb-4">
          <WarningIcon />
          <div className="min-w-0 pt-0.5">
            <h2
              id="vehicle-pricing-warning-title"
              className="text-xl font-bold text-gray-900 leading-snug"
            >
              {isNoneSelected ? "Vehicle Type Not Selected" : "Vehicle Type Amounts Missing"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isNoneSelected
                ? "Invoice amounts will not be prefilled without vehicle type pricing."
                : "Some vehicle types are missing pricing amounts."}
            </p>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-2">
          {isNoneSelected ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                If you do not select a vehicle type, the invoice amount will not be prefilled when
                you create an invoice. If you want the invoice amount to be prefilled, please select
                a vehicle type and then submit the work order.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                If vehicle type amounts are missing, the invoice amount will not be prefilled for
                those types when you create an invoice.
              </p>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  The following vehicle types have no amount entered:
                </p>
                <div className="space-y-2">
                  {missingLabels.map((label) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-sm sm:text-base text-amber-900 font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                To get prefilled invoice amounts, please enter amounts for all vehicle types before
                creating the job.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 px-6 sm:px-8 py-6 sm:py-7 mt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onProceed}
            className="w-full py-3 px-5 primary-bg text-sm sm:text-base border border-black-500 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            {actionLabel}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-3 px-5 rounded-lg border border-gray-300 text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleTypePricingWarningModal;
