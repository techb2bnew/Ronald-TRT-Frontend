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
              <div className="px-4 py-3 border-b border-gray-100 bg-white">
                <h2 className="text-base font-semibold text-gray-900">
                  Tech Cars Detail per JobID
                  {displayJobId ? `: ${displayJobId}` : ""}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Vehicles worked by {detailMeta?.technicianName || "technician"}
                </p>
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
