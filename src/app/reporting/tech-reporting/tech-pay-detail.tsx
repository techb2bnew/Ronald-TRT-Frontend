"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from "@/app/component/breadcrumb";
import { useSidebar } from "@/app/component/SidebarContext";
import Loader from "@/app/component/loader";
import toast from "react-hot-toast";
import Pagination from "@/app/component/pagination";
import {
  baseUrl,
  PAGE_LIMIT,
  PayStatusFilter,
  WorkOrderRow,
  DetailJobDetails,
  money,
  formatDatePaid,
  buildFilterParams,
  techReportingListUrl,
} from "./tech-pay-shared";

export default function TechPayDetailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCollapsed } = useSidebar();

  const jobId = searchParams?.get("jobId") || "";
  const technicianId = searchParams?.get("technicianId") || "";
  const displayJobId = searchParams?.get("displayJobId") || jobId;
  const payStatus = (searchParams?.get("payStatus") || "all") as PayStatusFilter;
  const startDate = searchParams?.get("startDate") || "";
  const endDate = searchParams?.get("endDate") || "";

  const [detailPage, setDetailPage] = useState(1);
  const [detailTotalPages, setDetailTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detailMeta, setDetailMeta] = useState<DetailJobDetails | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([]);

  const backHref = useMemo(
    () => techReportingListUrl({ jobId, payStatus, startDate, endDate }),
    [jobId, payStatus, startDate, endDate]
  );

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
      const filters = buildFilterParams(payStatus, startDate, endDate);
      filters.forEach((value, key) => params.set(key, value));

      const res = await fetch(`${baseUrl}/fetchJobTechWorkOrders?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
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
      setWorkOrders(Array.isArray(json.workOrders) ? json.workOrders : []);
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
  }, [jobId, technicianId, payStatus, startDate, endDate]);

  useEffect(() => {
    fetchWorkOrders(detailPage);
  }, [jobId, technicianId, payStatus, startDate, endDate, detailPage]);

  const handleDetailPageChange = (selectedItem: { selected: number }) => {
    setDetailPage(selectedItem.selected + 1);
  };

  if (!jobId || !technicianId) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        <p>Missing job or technician.</p>
        <Link href={backHref} className="text-[#383d71] underline mt-2 inline-block">
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Tech Cars Detail Per JobID</h1>
            <p className="text-sm text-gray-500 mt-1">Vehicle-level pay breakdown for the selected technician</p>
          </div>
          <Link
            href={backHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#383d71] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 shrink-0 shadow-sm"
          >
            <span aria-hidden>←</span>
            Back to list
          </Link>
        </div>

        {loading && !detailMeta ? (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#383d71] to-[#4a5089]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                    Job ID
                  </p>
                  <p className="text-lg font-bold text-white mt-0.5 font-mono">{displayJobId}</p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm border border-white/20">
                  {detailMeta?.technicianType || "Technician"}
                </span>
              </div>

              <div className="p-5 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
                  <div className="lg:col-span-7 space-y-5">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                        Job
                      </p>
                      <p className="text-base font-semibold text-gray-900 leading-snug">
                        {detailMeta?.jobTitle || detailMeta?.jobName || "—"}
                      </p>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#383d71]/10 text-[#383d71] text-sm font-bold"
                        aria-hidden
                      >
                        {(detailMeta?.technicianName || "?")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {detailMeta?.technicianType || "Dent Tech"}
                        </p>
                        <p className="text-base font-semibold text-[#383d71] mt-0.5 truncate">
                          {detailMeta?.technicianName || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="h-full rounded-xl border-2 border-[#383d71]/15 bg-gradient-to-br from-[#383d71]/5 to-white p-5 flex flex-col justify-center">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Tech Total
                      </p>
                      <p className="text-3xl md:text-4xl font-bold text-[#383d71] mt-2 tabular-nums">
                        {money(detailMeta?.techTotalPay)}
                      </p>
                      <div className="mt-4 pt-4 border-t border-[#383d71]/10 flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-600">Vehicles worked</span>
                        <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-sm font-semibold text-gray-900 shadow-sm border border-gray-200">
                          {detailMeta?.totalCars ?? 0}{" "}
                          {(detailMeta?.totalCars ?? 0) === 1 ? "car" : "cars"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">
                  Tech Cars Detail per JobID
                  {displayJobId ? `: ${displayJobId}` : ""}
                </h2>
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
                          workOrders.map((wo, i) => (
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
                                <span
                                  className={
                                    wo.paidStatus ? "text-green-700 font-medium" : "text-gray-600"
                                  }
                                >
                                  {formatDatePaid(wo.paidAt, wo.paidStatus)}
                                </span>
                              </td>
                            </tr>
                          ))
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
