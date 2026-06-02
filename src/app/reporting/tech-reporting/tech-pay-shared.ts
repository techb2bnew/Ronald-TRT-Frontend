import { format } from "date-fns";

export const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
export const PAGE_LIMIT = 10;

export type PayStatusFilter = "all" | "paid" | "unpaid";

export type WorkOrderRow = {
  vehicleId: number;
  technicianName?: string;
  technicianType?: string;
  customerName?: string;
  vin?: string;
  modelYear?: number | string;
  make?: string;
  model?: string;
  stockNumber?: string;
  color?: string;
  techPayAmount?: number;
  paidStatus?: boolean;
  paidAt?: string | null;
};

export type DetailJobDetails = {
  id?: number;
  jobName?: string;
  jobTitle?: string;
  technicianId?: number;
  technicianName?: string;
  technicianType?: string;
  techTotalPay?: number;
  totalCars?: number;
  totalPages?: number;
  currentPage?: number;
  limit?: number;
};

export function money(n: number | string | undefined | null) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(x);
}

export function formatDatePaid(paidAt: string | null | undefined, paidStatus?: boolean) {
  if (paidAt) {
    try {
      return format(new Date(paidAt), "MMM d, yyyy");
    } catch {
      return paidAt;
    }
  }
  if (paidStatus) return "Paid";
  return "—";
}

export function payStatusLabel(value: PayStatusFilter) {
  if (value === "paid") return "Paid";
  if (value === "unpaid") return "Unpaid";
  return "All";
}

export function buildFilterParams(
  payStatus: PayStatusFilter,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (payStatus !== "all") params.set("payStatus", payStatus);
  return params;
}

export function techReportingListUrl(filters?: {
  jobId?: string;
  payStatus?: string;
  startDate?: string;
  endDate?: string;
}) {
  const q = new URLSearchParams();
  if (filters?.jobId) q.set("jobId", filters.jobId);
  if (filters?.payStatus && filters.payStatus !== "all") q.set("payStatus", filters.payStatus);
  if (filters?.startDate) q.set("startDate", filters.startDate);
  if (filters?.endDate) q.set("endDate", filters.endDate);
  const qs = q.toString();
  return `/reporting/tech-reporting${qs ? `?${qs}` : ""}`;
}
