import { format } from "date-fns";
import { formatDisplayDate } from "@/lib/dateUtils";
import { BASE_PATH } from "@/lib/basePath";

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
  /** Tech pay Paid/Unpaid — use this, not invoiceStatus / generatedInvoiceStatus. */
  paidStatus?: boolean | string | null;
  generatedInvoiceStatus?: boolean;
  invoiceStatus?: string | null;
  paidAt?: string | null;
  generatedInvoiceDate?: string | null;
};

/** Paid badge + filters must follow API `paidStatus`, not invoice generation flags. */
export function isWorkOrderPaid(wo: Pick<WorkOrderRow, "paidStatus"> | null | undefined): boolean {
  const raw = wo?.paidStatus;
  if (typeof raw === "boolean") return raw;
  if (raw == null) return false;
  const s = String(raw).trim().toLowerCase();
  return s === "true" || s === "paid" || s === "1";
}

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
      return formatDisplayDate(paidAt);
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

/** Backend expects `paidStatus=Paid` | `Unpaid`, not `payStatus=paid`. */
export function payStatusToApiValue(value: Exclude<PayStatusFilter, "all">): "Paid" | "Unpaid" {
  return value === "paid" ? "Paid" : "Unpaid";
}

export function buildFilterParams(
  payStatus: PayStatusFilter,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (payStatus !== "all") params.set("paidStatus", payStatusToApiValue(payStatus));
  return params;
}

/** Which detail filter was applied last when both date range and pay status are set in the UI. */
export type DetailActiveFilter = "dateRange" | "payStatus";

/**
 * Detail work-order API query: never send date range together with pay status.
 * - Pay status only (or pay status won "most recent") → paidStatus param only
 * - Date range only (pay status "all", or date range won "most recent") → startDate + endDate only
 */
export function getDetailFilterQuery(
  payStatus: PayStatusFilter,
  startDate: string,
  endDate: string,
  activeFilter: DetailActiveFilter | null
): { startDate?: string; endDate?: string; payStatus?: Exclude<PayStatusFilter, "all"> } | null {
  const hasDateRange = Boolean(startDate.trim() && endDate.trim());
  const hasPayStatus = payStatus !== "all";

  if (!hasDateRange && !hasPayStatus) return null;

  if (hasDateRange && hasPayStatus) {
    if (activeFilter === "dateRange") return { startDate, endDate };
    return { payStatus };
  }

  if (hasPayStatus) return { payStatus };
  return { startDate, endDate };
}

export function buildDetailFilterParams(
  payStatus: PayStatusFilter,
  startDate: string,
  endDate: string,
  activeFilter: DetailActiveFilter | null
) {
  const params = new URLSearchParams();
  const q = getDetailFilterQuery(payStatus, startDate, endDate, activeFilter);
  if (!q) return params;
  if (q.startDate) params.set("startDate", q.startDate);
  if (q.endDate) params.set("endDate", q.endDate);
  if (q.payStatus) params.set("paidStatus", payStatusToApiValue(q.payStatus));
  return params;
}

/** Detail work orders: filter API when an active filter applies. */
export function workOrdersApiPath(
  startDate: string,
  endDate: string,
  payStatus: PayStatusFilter,
  activeFilter: DetailActiveFilter | null = null
): string {
  if (getDetailFilterQuery(payStatus, startDate, endDate, activeFilter)) {
    return `${baseUrl}/filterJobTechWorkOrders`;
  }
  return `${baseUrl}/fetchJobTechWorkOrders`;
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

export type MarkPaidItem = {
  vehicleId: number;
  technicianId: number;
  paidAt?: string;
};

/** Format API / input date as yyyy-MM-dd for type="date" inputs. */
export function toDateInputValue(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
      return "";
    }
    return format(d, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

export function todayDateInputValue(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Tech pay date for type="date" inputs — paidAt only; empty when unpaid (not generatedInvoiceDate). */
export function workOrderDatePaidInputValue(
  wo: WorkOrderRow,
  dateDrafts: Record<number, string> = {}
): string {
  const id = wo.vehicleId;
  if (id != null && Object.prototype.hasOwnProperty.call(dateDrafts, id)) {
    return dateDrafts[id] ?? "";
  }
  if (!isWorkOrderPaid(wo)) return "";
  return toDateInputValue(wo.paidAt);
}

/** Whether this vehicle already has a payment date (draft or saved). */
export function vehicleHasPaidDate(
  wo: WorkOrderRow,
  dateDrafts: Record<number, string>
): boolean {
  const id = wo.vehicleId;
  if (id == null) return false;
  return Boolean((dateDrafts[id] ?? "").trim() || toDateInputValue(wo.paidAt));
}

/**
 * Date to apply to empty vehicles when using Fill All Dates:
 * - No paid dates on any vehicle → today
 * - One or more paid dates → most recent among vehicles that already have a date
 */
export function resolveFillAllPaidAt(
  rows: WorkOrderRow[],
  dateDrafts: Record<number, string>
): string {
  const parsed: Date[] = [];

  for (const wo of rows) {
    const id = wo.vehicleId;
    if (id == null) continue;
    const draft = (dateDrafts[id] ?? "").trim();
    const fromRow = toDateInputValue(wo.paidAt);
    const value = draft || fromRow;
    if (!value) continue;

    const d = new Date(`${value}T12:00:00`);
    if (!Number.isNaN(d.getTime())) parsed.push(d);
  }

  if (parsed.length === 0) return todayDateInputValue();

  const latest = parsed.reduce((max, d) => (d > max ? d : max), parsed[0]);
  return format(latest, "yyyy-MM-dd");
}

export async function markVehicleTechnicianPaid(payload: {
  jobId: number | string;
  paid: boolean;
  items: MarkPaidItem[];
  token?: string | null;
}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (payload.token) headers.Authorization = `Bearer ${payload.token}`;

  const items = payload.items.map((item) => {
    const base = {
      vehicleId: item.vehicleId,
      technicianId: item.technicianId,
    };
    if (payload.paid && item.paidAt) {
      return { ...base, paidAt: item.paidAt };
    }
    return base;
  });

  const res = await fetch(`${BASE_PATH}/api/markVehicleTechnicianPaid`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jobId: Number(payload.jobId),
      paid: payload.paid,
      items,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.status === false) {
    throw new Error(data?.message || data?.error || "Failed to update payment date");
  }
  return data;
}
