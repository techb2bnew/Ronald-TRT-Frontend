"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Breadcrumb from "@/app/component/breadcrumb";
import { useSidebar } from "@/app/component/SidebarContext";
import Loader from "@/app/component/loader";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import Pagination from "@/app/component/pagination";
import {
  baseUrl,
  PAGE_LIMIT,
  PayStatusFilter,
  WorkOrderRow,
  DetailJobDetails,
  money,
  buildDetailFilterParams,
  DetailActiveFilter,
  techReportingListUrl,
  toDateInputValue,
  markVehicleTechnicianPaid,
  resolveFillAllPaidAt,
  vehicleHasPaidDate,
  workOrdersApiPath,
} from "./tech-pay-shared";
import { format } from "date-fns";

export default function TechPayDetailView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCollapsed } = useSidebar();

  const jobId = searchParams?.get("jobId") || "";
  const technicianId = searchParams?.get("technicianId") || "";
  const displayJobId = searchParams?.get("displayJobId") || jobId;

  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterPayStatus, setFilterPayStatus] = useState<PayStatusFilter>("all");
  const [activeDetailFilter, setActiveDetailFilter] = useState<DetailActiveFilter | null>(null);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const datePopoverRef = useRef<HTMLDivElement>(null);

  const [detailPage, setDetailPage] = useState(1);
  const [detailTotalPages, setDetailTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detailMeta, setDetailMeta] = useState<DetailJobDetails | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([]);
  const [dateDrafts, setDateDrafts] = useState<Record<number, string>>({});
  const [isSubmittingPaid, setIsSubmittingPaid] = useState(false);
  const [submittingVehicleId, setSubmittingVehicleId] = useState<number | null>(null);

  const backHref = useMemo(
    () =>
      techReportingListUrl({
        jobId,
        payStatus: filterPayStatus,
        startDate: filterStartDate,
        endDate: filterEndDate,
      }),
    [jobId, filterPayStatus, filterStartDate, filterEndDate]
  );

  const dateRangeLabel =
    filterStartDate && filterEndDate
      ? `${format(new Date(filterStartDate + "T12:00:00"), "MMM d, yyyy")} – ${format(
          new Date(filterEndDate + "T12:00:00"),
          "MMM d, yyyy"
        )}`
      : "From – To";

  useEffect(() => {
    const sd = searchParams?.get("startDate") || "";
    const ed = searchParams?.get("endDate") || "";
    const ps = searchParams?.get("payStatus");
    setFilterStartDate(sd);
    setFilterEndDate(ed);
    if (ps === "paid" || ps === "unpaid") {
      setFilterPayStatus(ps);
      setActiveDetailFilter("payStatus");
    } else {
      setFilterPayStatus("all");
      if (sd && ed) setActiveDetailFilter("dateRange");
      else setActiveDetailFilter(null);
    }
  }, [searchParams]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (datePopoverRef.current && !datePopoverRef.current.contains(e.target as Node)) {
        setDatePopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const syncFiltersToUrl = (
    next: Partial<{ startDate: string; endDate: string; payStatus: PayStatusFilter }>
  ) => {
    const q = new URLSearchParams();
    q.set("jobId", jobId);
    q.set("technicianId", technicianId);
    if (displayJobId && displayJobId !== "—") q.set("displayJobId", displayJobId);

    const sd = next.startDate ?? filterStartDate;
    const ed = next.endDate ?? filterEndDate;
    const ps = next.payStatus ?? filterPayStatus;
    if (sd) q.set("startDate", sd);
    if (ed) q.set("endDate", ed);
    if (ps !== "all") q.set("payStatus", ps);

    router.replace(`${pathname}?${q.toString()}`);
  };

  const applyDateRange = (start: string, end: string) => {
    setFilterStartDate(start);
    setFilterEndDate(end);
    if (start && end) setActiveDetailFilter("dateRange");
    else if (filterPayStatus === "all") setActiveDetailFilter(null);
    setDetailPage(1);
    syncFiltersToUrl({ startDate: start, endDate: end });
  };

  const applyPayStatus = (status: PayStatusFilter) => {
    setFilterPayStatus(status);
    if (status !== "all") setActiveDetailFilter("payStatus");
    else if (filterStartDate && filterEndDate) setActiveDetailFilter("dateRange");
    else setActiveDetailFilter(null);
    setDetailPage(1);
    syncFiltersToUrl({ payStatus: status });
  };

  const clearFilters = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterPayStatus("all");
    setActiveDetailFilter(null);
    setDetailPage(1);
    syncFiltersToUrl({ startDate: "", endDate: "", payStatus: "all" });
  };

  const fetchWorkOrders = async (page: number) => {
    if (!jobId || !technicianId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }
      const params = new URLSearchParams({
        jobId,
        technicianId,
        page: String(page),
        limit: String(PAGE_LIMIT),
      });
      const filters = buildDetailFilterParams(
        filterPayStatus,
        filterStartDate,
        filterEndDate,
        activeDetailFilter
      );
      filters.forEach((value, key) => params.set(key, value));

      const res = await fetch(
        `${workOrdersApiPath(filterStartDate, filterEndDate, filterPayStatus, activeDetailFilter)}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.status === 400) {
        localStorage.removeItem("token");
        router.push("/");
        return;
      }
      const json = await res.json();
      if (!res.ok || !json?.status) {
        toast.error(json?.message || "Failed to load work orders");
        setWorkOrders([]);
        setDetailMeta(null);
        setDetailTotalPages(1);
        return;
      }
      const details = json.jobDetails ?? null;
      setDetailMeta(details);
      const rows = Array.isArray(json.workOrders) ? json.workOrders : [];
      setWorkOrders(rows);
      const drafts: Record<number, string> = {};
      rows.forEach((wo: WorkOrderRow) => {
        if (wo.vehicleId != null) {
          drafts[wo.vehicleId] = toDateInputValue(wo.paidAt);
        }
      });
      setDateDrafts(drafts);
      setDetailTotalPages(Math.max(1, Number(details?.totalPages) || 1));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load work orders");
      setWorkOrders([]);
      setDetailMeta(null);
      setDetailTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDetailPage(1);
  }, [jobId, technicianId, filterPayStatus, filterStartDate, filterEndDate, activeDetailFilter]);

  useEffect(() => {
    fetchWorkOrders(detailPage);
  }, [
    jobId,
    technicianId,
    filterPayStatus,
    filterStartDate,
    filterEndDate,
    activeDetailFilter,
    detailPage,
  ]);

  const handleDetailPageChange = (selectedItem: { selected: number }) => {
    setDetailPage(selectedItem.selected + 1);
  };

  const fetchAllWorkOrders = async (): Promise<WorkOrderRow[]> => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return [];
    }
    const total = Math.max(detailMeta?.totalCars ?? workOrders.length, workOrders.length);
    const params = new URLSearchParams({
      jobId,
      technicianId,
      page: "1",
      limit: String(Math.min(total, 500)),
    });
    const filters = buildDetailFilterParams(
      filterPayStatus,
      filterStartDate,
      filterEndDate,
      activeDetailFilter
    );
    filters.forEach((value, key) => params.set(key, value));

    const res = await fetch(
      `${workOrdersApiPath(filterStartDate, filterEndDate, filterPayStatus, activeDetailFilter)}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const json = await res.json();
    if (!res.ok || !json?.status) return workOrders;
    return Array.isArray(json.workOrders) ? json.workOrders : [];
  };

  const submitPaidUpdate = async (
    paid: boolean,
    items: { vehicleId: number; technicianId: number; paidAt?: string }[],
    opts?: { vehicleId?: number; refresh?: boolean }
  ) => {
    if (!items.length) {
      toast.error("No vehicles to update.");
      return false;
    }
    const techId = Number(technicianId);
    if (!jobId || Number.isNaN(techId)) {
      toast.error("Job or technician ID missing.");
      return false;
    }

    try {
      if (opts?.vehicleId != null) setSubmittingVehicleId(opts.vehicleId);
      else setIsSubmittingPaid(true);

      const token = localStorage.getItem("token");
      await markVehicleTechnicianPaid({
        jobId,
        paid,
        items: items.map((item) => ({
          vehicleId: item.vehicleId,
          technicianId: item.technicianId || techId,
          paidAt: item.paidAt,
        })),
        token,
      });

      toast.success(paid ? "Payment date saved." : "Payment date cleared.");
      if (opts?.refresh !== false) {
        await fetchWorkOrders(detailPage);
      }
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update payment date";
      toast.error(msg);
      return false;
    } finally {
      setSubmittingVehicleId(null);
      setIsSubmittingPaid(false);
    }
  };

  const handleDateChange = async (wo: WorkOrderRow, value: string) => {
    const vehicleId = Number(wo.vehicleId);
    const techId = Number(technicianId);
    if (Number.isNaN(vehicleId) || Number.isNaN(techId)) return;

    setDateDrafts((prev) => ({ ...prev, [vehicleId]: value }));

    if (!value) {
      await submitPaidUpdate(
        false,
        [{ vehicleId, technicianId: techId }],
        { vehicleId }
      );
      return;
    }

    await submitPaidUpdate(
      true,
      [{ vehicleId, technicianId: techId, paidAt: value }],
      { vehicleId }
    );
  };

  const handleClearDate = async (wo: WorkOrderRow) => {
    const vehicleId = Number(wo.vehicleId);
    const techId = Number(technicianId);
    if (Number.isNaN(vehicleId) || Number.isNaN(techId)) return;

    setDateDrafts((prev) => ({ ...prev, [vehicleId]: "" }));
    await submitPaidUpdate(false, [{ vehicleId, technicianId: techId }], { vehicleId });
  };

  const handleFillAllDates = async () => {
    const techId = Number(technicianId);
    if (!jobId || Number.isNaN(techId)) {
      toast.error("Job or technician ID missing.");
      return;
    }

    try {
      const allRows = await fetchAllWorkOrders();
      if (!allRows.length) {
        toast.error("No vehicles to update.");
        return;
      }

      const emptyRows = allRows.filter((wo) => !vehicleHasPaidDate(wo, dateDrafts));
      if (!emptyRows.length) {
        toast.error("All vehicles already have a payment date.");
        return;
      }

      const paidAt = resolveFillAllPaidAt(allRows, dateDrafts);
      const dateLabel = format(new Date(`${paidAt}T12:00:00`), "MMM d, yyyy");
      const skippedCount = allRows.length - emptyRows.length;
      const hasExistingDate = skippedCount > 0;

      const result = await Swal.fire({
        title: "Fill all payment dates?",
        html: `
          <p style="margin:0;font-size:15px;line-height:1.65;color:#4b5563;text-align:center">
            Apply <strong style="color:#111827">${dateLabel}</strong> to
            <strong style="color:#111827"> ${emptyRows.length} </strong>
            vehicle${emptyRows.length === 1 ? "" : "s"} without a payment date?
          </p>
          <p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#6b7280;text-align:center">
            ${
              hasExistingDate
                ? `${skippedCount} vehicle${skippedCount === 1 ? "" : "s"} with an existing date will not be changed. Using the most recent date already set in this job.`
                : "No payment date was set yet — using today's date."
            }
          </p>
        `,
        icon: "question",
        iconColor: "#383d71",
        showCancelButton: true,
        confirmButtonColor: "#383d71",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, fill all",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      setIsSubmittingPaid(true);
      const items = emptyRows
        .map((wo) => ({
          vehicleId: Number(wo.vehicleId),
          technicianId: techId,
          paidAt,
        }))
        .filter((item) => !Number.isNaN(item.vehicleId));

      if (!items.length) {
        toast.error("Vehicle IDs missing.");
        return;
      }

      const token = localStorage.getItem("token");
      await markVehicleTechnicianPaid({ jobId, paid: true, items, token });
      toast.success(
        `${items.length} payment date${items.length === 1 ? "" : "s"} set to ${dateLabel}.`
      );
      await fetchWorkOrders(detailPage);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to fill all dates";
      toast.error(msg);
    } finally {
      setIsSubmittingPaid(false);
    }
  };

  if (!jobId || !technicianId) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        <p>Missing job or technician.</p>
        <Link href={backHref} className="text-[#383d71] hover:underline mt-2 inline-block font-medium">
          Back to Tech Reporting
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`mobile_listing mx-auto mt-4 transition-all duration-300 pb-10 ${
        isCollapsed ? "w-full pl-20" : "container max-w-7xl"
      }`}
    >
      <Breadcrumb
        items={[
          { label: "Tech Reporting", href: backHref },
          { label: "Tech Cars Detail", href: "#" },
        ]}
      />

      <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Tech Cars Detail Per JobID</h1>
          <Link
            href={backHref}
            className="primary-bg inline-flex items-center justify-center gap-2 pl-5 pr-5 p-2 rounded text-sm shrink-0"
          >
            ← Back to list
          </Link>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-end gap-4">
            <div className="min-w-[180px] flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Job ID</label>
              <div className="h-[44px] flex items-center px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-mono text-[#383d71]">
                {displayJobId || "—"}
              </div>
            </div>

            <div className="min-w-[220px] flex-1 relative" ref={datePopoverRef}>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
              <button
                type="button"
                onClick={() => setDatePopoverOpen((o) => !o)}
                className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-left"
              >
                <span className="text-gray-800 truncate">{dateRangeLabel}</span>
                <span className="text-gray-400 shrink-0 ml-2" aria-hidden>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
              </button>
              {datePopoverOpen && (
                <div className="absolute z-20 mt-1 rounded-lg border border-gray-200 bg-white p-3 shadow-lg min-w-[260px]">
                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Date Paid From</label>
                      <input
                        type="date"
                        className="w-full mt-0.5 rounded border border-gray-300 px-2 py-1.5 text-sm"
                        value={filterStartDate}
                        onChange={(e) => applyDateRange(e.target.value, filterEndDate)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">To</label>
                      <input
                        type="date"
                        className="w-full mt-0.5 rounded border border-gray-300 px-2 py-1.5 text-sm"
                        value={filterEndDate}
                        onChange={(e) => applyDateRange(filterStartDate, e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!filterStartDate && !filterEndDate}
                      className="text-xs text-[#383d71] underline self-start disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
                      onClick={() => {
                        applyDateRange("", "");
                        setDatePopoverOpen(false);
                      }}
                    >
                      Clear dates
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Pay Status</label>
              <select
                value={filterPayStatus}
                onChange={(e) => applyPayStatus(e.target.value as PayStatusFilter)}
                className="w-full h-[44px] px-3 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#383d71]/30"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 self-end"
            >
              Clear filters
            </button>
          </div>
        </div>

        {loading && !detailMeta ? (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm mb-6">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#1e3e6f] text-white px-4 py-3 md:px-5">
                <span className="font-bold text-base">Job &amp; Technician Summary</span>
                <span className="text-xs md:text-sm font-mono opacity-90">
                  Job ID: {displayJobId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 md:p-5">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {detailMeta?.technicianType || "Dent Tech"}
                  </p>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {detailMeta?.technicianName || "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-500 mb-1">Tech Total</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {money(detailMeta?.techTotalPay)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {detailMeta?.totalCars ?? 0}{" "}
                    {(detailMeta?.totalCars ?? 0) === 1 ? "car" : "cars"}
                  </p>
                </div>
               
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:col-span-1 lg:col-span-1">
                  <p className="text-xs font-medium text-gray-500 mb-1">Job</p>
                  <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                    {detailMeta?.jobTitle || detailMeta?.jobName || "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-500 mb-1">Job ID</p>
                  <p className="text-lg font-bold text-[#383d71] font-mono">{displayJobId}</p>
                </div>
                
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 bg-white flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Tech Cars Detail per JobID
                    {displayJobId ? `: ${displayJobId}` : ""}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Vehicles worked by {detailMeta?.technicianName || "technician"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFillAllDates}
                  disabled={isSubmittingPaid || workOrders.length === 0}
                  className="primary-bg pl-5 pr-5 p-2 rounded text-sm shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingPaid ? "Updating..." : "Fill All Dates"}
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                      <thead>
                        <tr>
                          {[
                            "Dent Tech",
                            "Customer",
                            "VIN",
                            "Model Year",
                            "Make",
                            "Model",
                            "Stock Number",
                            "Color",
                            "Tech Pay Amount",
                            "Date Paid",
                          ].map((col) => (
                            <th
                              key={col}
                              className="text-left text-xs font-semibold text-gray-700 px-3 py-2 border-b border-gray-200 bg-gray-50 whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {workOrders.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-3 py-10 text-center text-gray-500">
                              No vehicles found for this technician.
                            </td>
                          </tr>
                        ) : (
                          workOrders.map((wo, i) => {
                            const hasPaidDate = vehicleHasPaidDate(wo, dateDrafts);
                            return (
                            <tr
                              key={wo.vehicleId ?? i}
                              className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
                            >
                              <td className="px-3 py-2.5 border-b border-gray-100">
                                {wo.technicianName || detailMeta?.technicianName || "—"}
                              </td>
                              <td className="px-3 py-2.5 border-b border-gray-100">
                                {wo.customerName || "—"}
                              </td>
                              <td className="px-3 py-2.5 border-b border-gray-100 font-mono text-xs">
                                {wo.vin || "—"}
                              </td>
                              <td className="px-3 py-2.5 border-b border-gray-100">
                                {wo.modelYear ?? "—"}
                              </td>
                              <td className="px-3 py-2.5 border-b border-gray-100">
                                {wo.make || "—"}
                              </td>
                              <td className="px-3 py-2.5 border-b border-gray-100">
                                {wo.model || "—"}
                              </td>
                              <td className="px-3 py-2.5 border-b border-gray-100">
                                {wo.stockNumber?.trim() ? wo.stockNumber : "—"}
                              </td>
                              <td className="px-3 py-2.5 border-b border-gray-100">
                                {wo.color?.trim() ? wo.color : "—"}
                              </td>
                              <td className="px-3 py-2.5 border-b border-gray-100 font-medium">
                                {money(wo.techPayAmount)}
                              </td>
                              <td className="px-3 py-2.5 border-b border-gray-100">
                                <div className="flex flex-wrap items-center gap-2 min-w-[220px]">
                                  <input
                                    type="date"
                                    value={dateDrafts[wo.vehicleId] ?? toDateInputValue(wo.paidAt)}
                                    onChange={(e) => void handleDateChange(wo, e.target.value)}
                                    disabled={
                                      isSubmittingPaid || submittingVehicleId === wo.vehicleId
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#383d71]/30 disabled:opacity-50"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => void handleClearDate(wo)}
                                    disabled={
                                      !hasPaidDate ||
                                      isSubmittingPaid ||
                                      submittingVehicleId === wo.vehicleId
                                    }
                                    className="primary-bg px-3 py-1.5 rounded text-xs whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {submittingVehicleId === wo.vehicleId
                                      ? "..."
                                      : "Clear Date"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            );
                          })
                        )}
                      </tbody>
                      {workOrders.length > 0 && (
                        <tfoot>
                          <tr className="bg-gray-50">
                            <td colSpan={8} className="px-3 py-2.5 text-xs font-semibold text-gray-600">
                              Tech Total
                            </td>
                            <td className="px-3 py-2.5 text-sm font-semibold text-gray-900">
                              {money(detailMeta?.techTotalPay)}
                            </td>
                            <td className="px-3 py-2.5 border-b border-gray-100" />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100 flex justify-center">
                    <Pagination
                      currentPage={detailPage}
                      totalPages={detailTotalPages}
                      onPageChange={handleDetailPageChange}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
