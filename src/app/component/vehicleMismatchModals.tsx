"use client";

import React, { useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface MismatchVehicle {
  vin: string;
  make: string;
  model: string;
}
export interface MismatchData {
  missingInScanned: MismatchVehicle[];
  missingInInsurance: MismatchVehicle[];
}

/** Single GET for compare/invoice: ask for all rows in one request (no page loop). */
export const INSURANCE_FETCH_ALL_LIMIT = 10000;

export function normalizeVinKey(vin: unknown): string {
  if (vin == null) return "";
  return String(vin).trim().replace(/\s+/g, "").toUpperCase();
}

export function isInsuranceJobTypeForInvoice(jobType: unknown): boolean {
  const s = String(jobType || "")
    .toLowerCase()
    .replace(/_/g, "")
    .replace(/-/g, "")
    .replace(/\s+/g, "");
  return s === "insurancepercentage";
}

function vehicleToMismatchRow(v: Record<string, unknown>): MismatchVehicle {
  return {
    vin: String(v?.vin ?? ""),
    make: String(v?.make ?? ""),
    model: String(v?.model ?? ""),
  };
}

export function computeVinMismatch(
  selectedJobs: any[],
  insuranceVehicles: any[]
): MismatchData {
  const scanned = selectedJobs;
  const insurance = insuranceVehicles || [];
  const scannedVinSet = new Set<string>();
  scanned.forEach((v) => {
    const k = normalizeVinKey(v?.vin);
    if (k) scannedVinSet.add(k);
  });
  const insuranceVinSet = new Set<string>();
  insurance.forEach((v) => {
    const k = normalizeVinKey(v?.vin);
    if (k) insuranceVinSet.add(k);
  });
  const missingInScanned = insurance
    .filter((iv) => {
      const k = normalizeVinKey(iv?.vin);
      return k && !scannedVinSet.has(k);
    })
    .map((iv) => vehicleToMismatchRow(iv as Record<string, unknown>));
  const missingInInsurance = scanned
    .filter((sv) => {
      const k = normalizeVinKey(sv?.vin);
      return k && !insuranceVinSet.has(k);
    })
    .map((sv) => vehicleToMismatchRow(sv as Record<string, unknown>));
  return { missingInScanned, missingInInsurance };
}

/** GET `fetchInsuranceVehiclesByJob?jobIds=[…]&page=&limit=` — jobIds JSON array e.g. `[60]` or `[60,65]`. */
async function getFetchInsuranceVehiclesPage(
  jobIds: number[],
  page: number,
  limit: number,
  token: string
): Promise<{ vehicles: any[]; totalPages?: number | string | null }> {
  const params = new URLSearchParams();
  params.set('jobIds', JSON.stringify(jobIds));
  params.set('page', String(page));
  params.set('limit', String(limit));

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(
    `${apiUrl}/fetchInsuranceVehiclesByJob?${params.toString()}`,
    { method: 'GET', headers }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      String(data?.message ?? data?.error ?? `HTTP ${response.status}`)
    );
  }
  const newVehicles =
    data?.jobs?.vehicles ??
    data?.response?.vehicles ??
    data?.vehicles ??
    [];
  const arr = Array.isArray(newVehicles) ? newVehicles : [];
  const totalPages =
    data?.jobs?.totalPages ?? data?.response?.totalPages ?? data?.totalPages;
  return { vehicles: arr, totalPages };
}

/** Single job: same GET as multi-job with `jobIds: [id]`. */
export async function fetchAllInsuranceVehiclesByJob(
  jobId: string,
  token: string
): Promise<any[]> {
  const n = Number(jobId);
  if (!Number.isFinite(n) || n <= 0) return [];
  return fetchAllInsuranceVehiclesByJobIds([n], token);
}

/** Unique positive numeric job ids from vehicle rows (checkbox-selected rows). */
export function uniqueNumericJobIdsFromVehicles(rows: any[]): number[] {
  const set = new Set<number>();
  for (const j of rows) {
    const raw = j?.jobId ?? j?.job?.id;
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isFinite(n) && n > 0) set.add(n);
  }
  return Array.from(set).sort((a, b) => a - b);
}

/**
 * One GET only: `?page=1&limit=…&jobIds=[…]` — avoids multiple sequential page requests.
 */
export async function fetchAllInsuranceVehiclesByJobIds(
  jobIds: Array<number | string>,
  token: string
): Promise<any[]> {
  const numeric = jobIds
    .map((id) => (typeof id === 'number' ? id : Number(id)))
    .filter((n): n is number => Number.isFinite(n) && n > 0);
  const unique = Array.from(new Set(numeric)).sort((a, b) => a - b);
  if (unique.length === 0) return [];

  const { vehicles: arr } = await getFetchInsuranceVehiclesPage(
    unique,
    1,
    INSURANCE_FETCH_ALL_LIMIT,
    token
  );
  return arr;
}

export const MissingVehiclesModal: React.FC<{
  mismatchData: MismatchData;
  onClose: () => void;
  onProceed: () => void;
  /** When false, only Close is shown (e.g. work order compare — no invoice to proceed with). */
  showProceedAnyway?: boolean;
}> = ({ mismatchData, onClose, onProceed, showProceedAnyway = true }) => {
  const [activeTab, setActiveTab] = useState<"scanned" | "insurance">("scanned");
  const rows =
    activeTab === "scanned"
      ? mismatchData.missingInScanned
      : mismatchData.missingInInsurance;
  const scannedCount = mismatchData.missingInScanned.length;
  const insuranceCount = mismatchData.missingInInsurance.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Vehicle Mismatches</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Review the vehicles that don&apos;t match between the two lists.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="px-6">
          <div className="flex rounded-full bg-gray-100 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("scanned")}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === "scanned" ? "bg-white text-gray-900 shadow-sm font-semibold" : "text-gray-500 hover:text-gray-700"}`}
            >
              Missing in Scanned ({scannedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("insurance")}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === "insurance" ? "bg-white text-gray-900 shadow-sm font-semibold" : "text-gray-500 hover:text-gray-700"}`}
            >
              Missing in Insurance ({insuranceCount})
            </button>
          </div>
        </div>

        <p className="px-6 mt-4 text-sm text-gray-500">
          {activeTab === "scanned"
            ? "These vehicles appear in the insurance list but were not found in the scanned vehicles."
            : "These vehicles appear in the scanned list but were not found in the insurance list."}
        </p>

        <div className="px-6 mt-3 max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-700 w-[45%]">
                  VIN
                </th>
                <th className="text-left py-2 font-medium text-gray-700 w-[25%]">
                  Make
                </th>
                <th className="text-left py-2 font-medium text-gray-700 w-[30%]">
                  Model
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-400">
                    No vehicles found
                  </td>
                </tr>
              ) : (
                rows.map((v, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 text-gray-800 font-mono text-xs">{v.vin}</td>
                    <td className="py-3 text-gray-800">{v.make}</td>
                    <td className="py-3 text-gray-800">{v.model}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={`flex gap-3 px-6 py-5 ${!showProceedAnyway ? "justify-stretch" : ""}`}>
          <button
            type="button"
            onClick={onClose}
            className={
              showProceedAnyway
                ? "flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                : "w-full py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            }
          >
            {showProceedAnyway ? "Cancel" : "Close"}
          </button>
          {showProceedAnyway && (
            <button
              type="button"
              onClick={onProceed}
              className="flex-1 py-2.5 px-4 rounded-lg primary-bg text-sm border border-black-500 text-white  font-medium hover:bg-gray-800 transition-colors"
            >
              Proceed Anyway
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const VehicleMismatchAlert: React.FC<{
  mismatchData: MismatchData;
  onProceed: () => void;
  onCancel: () => void;
  onViewMissingVehicles: () => Promise<void>;
  /** When false, hide Proceed Anyway (invoice flow keeps default true). */
  showProceedAnyway?: boolean;
}> = ({
  mismatchData,
  onProceed,
  onCancel,
  onViewMissingVehicles,
  showProceedAnyway = true,
}) => {
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const scannedCount = mismatchData.missingInScanned.length;
  const insuranceCount = mismatchData.missingInInsurance.length;

  return (
    <>
      {!showMissingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-amber-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Vehicle Mismatch Detected</h2>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              There are differences between the scanned vehicles and the uploaded insurance vehicle
              list.
            </p>
            <div className="space-y-2 mb-5">
              {scannedCount > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span className="text-sm text-red-700">
                    <span className="font-semibold">{scannedCount}</span> vehicle(s) in insurance list
                    but NOT in scanned list
                  </span>
                </div>
              )}
              {insuranceCount > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span className="text-sm text-red-700">
                    <span className="font-semibold">{insuranceCount}</span> vehicle(s) in scanned list
                    but NOT in insurance list
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={viewLoading}
              onClick={async () => {
                setViewLoading(true);
                try {
                  await onViewMissingVehicles();
                  setShowMissingModal(true);
                } finally {
                  setViewLoading(false);
                }
              }}
              className="w-full py-3 px-4 primary-bg text-sm border border-black-500 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {viewLoading ? "Loading…" : "View Missing Vehicles"}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className={
                  showProceedAnyway
                    ? "flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    : "w-full py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                }
              >
                Cancel
              </button>
              {showProceedAnyway && (
                <button
                  type="button"
                  onClick={onProceed}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Proceed Anyway
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showMissingModal && (
        <MissingVehiclesModal
          mismatchData={mismatchData}
          onClose={() => setShowMissingModal(false)}
          onProceed={onProceed}
          showProceedAnyway={showProceedAnyway}
        />
      )}
    </>
  );
};
