"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from "@/app/component/breadcrumb";
import { useSidebar } from "@/app/component/SidebarContext";
import Loader from "@/app/component/loader";
import toast from "react-hot-toast";
import SortIcon from "@/app/component/sortIcon";
import Pagination from "@/app/component/pagination";
import { format } from "date-fns";
import {
  baseUrl,
  PAGE_LIMIT,
  PayStatusFilter,
  buildFilterParams,
  money,
  payStatusLabel,
} from "./tech-pay-shared";

type TechPayRow = {
  technicianId: number;
  name: string;
  type: string;
  workOrderCount: number;
  totalTechPay: number;
};

type JobDetails = {
  id: number;
  jobName?: string;
  jobTitle?: string;
  overallTotalPay?: number;
  estimatedCost?: number;
  totalTechnicians?: number;
  payStatus?: string;
  totalPages?: number;
  currentPage?: number;
  limit?: number;
};

export default function TechPayTotalsReporting() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCollapsed } = useSidebar();

  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payStatus, setPayStatus] = useState<PayStatusFilter>("all");

  const [loading, setLoading] = useState(false);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [techPayTotals, setTechPayTotals] = useState<TechPayRow[]>([]);
  const [listPage, setListPage] = useState(1);
  const [listTotalPages, setListTotalPages] = useState(1);
  const [urlFiltersApplied, setUrlFiltersApplied] = useState(false);

  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });

  const datePopoverRef = useRef<HTMLDivElement>(null);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const jobDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isJobDropdownOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(e.target as Node)) {
        setIsJobDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [isJobDropdownOpen]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (datePopoverRef.current && !datePopoverRef.current.contains(e.target as Node)) {
        setDatePopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }
      const res = await fetch(`${baseUrl}/fetchAllTypesJobs?page=1&limit=200`, {
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
      if (!res.ok) {
        toast.error(json?.message || "Failed to load jobs");
        setJobs([]);
        return;
      }
      const list = json?.jobs?.jobs ?? json?.data?.jobs?.jobs ?? [];
      const safeList = Array.isArray(list) ? list : [];
      setJobs(safeList);
      setSelectedJobId((prev) => {
        if (prev) return prev;
        const firstId = safeList[0]?.id;
        return firstId != null ? String(firstId) : "";
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load jobs");
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (urlFiltersApplied) return;
    const jobId = searchParams?.get("jobId");
    const ps = searchParams?.get("payStatus");
    const sd = searchParams?.get("startDate");
    const ed = searchParams?.get("endDate");
    if (jobId) setSelectedJobId(jobId);
    if (ps === "paid" || ps === "unpaid" || ps === "all") setPayStatus(ps);
    if (sd) setStartDate(sd);
    if (ed) setEndDate(ed);
    setUrlFiltersApplied(true);
  }, [searchParams, urlFiltersApplied]);

  const fetchTechPayTotals = async (page: number) => {
    if (!selectedJobId) {
      setJobDetails(null);
      setTechPayTotals([]);
      setListTotalPages(1);
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
        jobId: String(selectedJobId),
        page: String(page),
        limit: String(PAGE_LIMIT),
      });
      const filters = buildFilterParams(payStatus, startDate, endDate);
      filters.forEach((value, key) => params.set(key, value));

      const res = await fetch(`${baseUrl}/fetchJobTechPayTotals?${params.toString()}`, {
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
        toast.error(json?.message || "Failed to load tech pay totals");
        setJobDetails(null);
        setTechPayTotals([]);
        setListTotalPages(1);
        return;
      }
      const details = json.jobDetails ?? null;
      setJobDetails(details);
      setTechPayTotals(Array.isArray(json.techPayTotals) ? json.techPayTotals : []);
      setListTotalPages(Math.max(1, Number(details?.totalPages) || 1));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load tech pay totals");
      setJobDetails(null);
      setTechPayTotals([]);
      setListTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setListPage(1);
  }, [selectedJobId, startDate, endDate, payStatus]);

  useEffect(() => {
    if (!selectedJobId || !urlFiltersApplied) return;
    fetchTechPayTotals(listPage);
  }, [selectedJobId, startDate, endDate, payStatus, listPage, urlFiltersApplied]);

  const selectedJob = useMemo(
    () => jobs.find((j) => String(j?.id) === String(selectedJobId)) ?? null,
    [jobs, selectedJobId]
  );

  const filteredJobs = useMemo(() => {
    const q = jobSearch.trim().toLowerCase();
    if (!q) return jobs;
    const base = jobs.filter((j) => String(j?.jobName ?? "").toLowerCase().includes(q));
    if (selectedJob && !base.some((x) => String(x?.id) === String(selectedJob?.id))) {
      return [selectedJob, ...base];
    }
    return base;
  }, [jobs, jobSearch, selectedJob]);

  const displayJobId = useMemo(() => {
    const fromJob = selectedJob?.jobId ?? selectedJob?.jobID;
    if (fromJob) return String(fromJob);
    if (jobDetails?.id != null) return String(jobDetails.id);
    return selectedJobId || "—";
  }, [selectedJob, jobDetails, selectedJobId]);

  const displayedPayStatus = jobDetails?.payStatus?.trim() || payStatusLabel(payStatus);

  const sortedTechRows = useMemo(() => {
    const rows = [...techPayTotals];
    const { key, dir } = sort;
    const mul = dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (key === "name") {
        va = (a.name || "").toLowerCase();
        vb = (b.name || "").toLowerCase();
      } else if (key === "type") {
        va = (a.type || "").toLowerCase();
        vb = (b.type || "").toLowerCase();
      } else if (key === "workOrderCount") {
        va = a.workOrderCount ?? 0;
        vb = b.workOrderCount ?? 0;
      } else if (key === "totalTechPay") {
        va = a.totalTechPay ?? 0;
        vb = b.totalTechPay ?? 0;
      }
      if (va < vb) return -1 * mul;
      if (va > vb) return 1 * mul;
      return 0;
    });
    return rows;
  }, [techPayTotals, sort]);

  const dateRangeLabel =
    startDate && endDate
      ? `${format(new Date(startDate + "T12:00:00"), "MMM d, yyyy")} – ${format(
          new Date(endDate + "T12:00:00"),
          "MMM d, yyyy"
        )}`
      : "Optional date range";

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setPayStatus("all");
    setJobSearch("");
    setListPage(1);
  };

  const buildDetailHref = (row: TechPayRow) => {
    const q = new URLSearchParams({
      jobId: selectedJobId,
      technicianId: String(row.technicianId),
      payStatus,
    });
    if (startDate) q.set("startDate", startDate);
    if (endDate) q.set("endDate", endDate);
    if (displayJobId && displayJobId !== "—") q.set("displayJobId", displayJobId);
    return `/reporting/tech-reporting/detail?${q.toString()}`;
  };

  const handleListPageChange = (selectedItem: { selected: number }) => {
    setListPage(selectedItem.selected + 1);
  };

  const toggleSort = (key: string) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const Th = ({
    label,
    sortKey,
  }: {
    label: string;
    sortKey: string;
  }) => (
    <th
      className="text-left text-xs font-semibold text-gray-700 px-3 py-2 border-b border-gray-200 cursor-pointer select-none whitespace-nowrap bg-gray-50"
      onClick={() => toggleSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon active={sort.key === sortKey} direction={sort.dir} />
      </span>
    </th>
  );

  return (
    <div
      className={`mobile_listing mx-auto mt-4 transition-all duration-300 pb-10 ${
        isCollapsed ? "w-full pl-20" : "container max-w-7xl"
      }`}
    >
      <Breadcrumb items={[{ label: "Tech Reporting", href: "/reporting/tech-reporting" }]} />

      <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 md:p-6 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-6">
          Tech Pay Totals Per Job
        </h1>

        {/* Filters */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4 flex flex-col lg:flex-row lg:flex-wrap gap-3 lg:items-end">
          <div className="min-w-[220px] flex-1 relative" ref={jobDropdownRef}>
            <label className="block text-xs font-medium text-gray-500 mb-1">Select Job</label>
            <button
              type="button"
              className="w-full h-[44px] min-h-[44px] px-3 pr-10 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#383d71]/30 cursor-pointer text-left truncate flex items-center justify-between"
              onClick={() => setIsJobDropdownOpen((o) => !o)}
              disabled={jobsLoading}
            >
              <span className="truncate">
                {selectedJob
                  ? `${selectedJob.jobName || "Untitled"} (#${selectedJob.id})`
                  : "— Choose a job —"}
              </span>
              <svg
                className={`w-4 h-4 shrink-0 transition-transform ${isJobDropdownOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isJobDropdownOpen && (
              <div className="absolute left-0 right-0 z-[9999] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="search"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    placeholder="Search job name..."
                    autoFocus
                    className="w-full h-[38px] px-3 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#383d71]/30"
                  />
                </div>
                <div className="max-h-[260px] overflow-auto">
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 truncate ${!selectedJobId ? "bg-gray-50" : ""}`}
                    onClick={() => {
                      setSelectedJobId("");
                      setIsJobDropdownOpen(false);
                      setJobSearch("");
                    }}
                  >
                    — Choose a job —
                  </button>
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((j) => (
                      <button
                        key={j.id}
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 truncate ${
                          String(j.id) === String(selectedJobId) ? "bg-gray-50" : ""
                        }`}
                        onClick={() => {
                          setSelectedJobId(String(j.id));
                          setIsJobDropdownOpen(false);
                          setJobSearch("");
                        }}
                      >
                        {j.jobName || "Untitled"} (#{j.id})
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-sm text-gray-500">No matching jobs</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-[220px] relative" ref={datePopoverRef}>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
            <button
              type="button"
              onClick={() => setDatePopoverOpen((o) => !o)}
              disabled={!selectedJobId}
              title={!selectedJobId ? "Select a job first" : undefined}
              className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
            >
              <span className="text-gray-800">{dateRangeLabel}</span>
              <span className="text-gray-400" aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
            </button>
            {selectedJobId && datePopoverOpen && (
              <div className="absolute z-20 mt-1 rounded-lg border border-gray-200 bg-white p-3 shadow-lg min-w-[260px]">
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Start</label>
                    <input
                      type="date"
                      className="w-full mt-0.5 rounded border border-gray-300 px-2 py-1.5 text-sm"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">End</label>
                    <input
                      type="date"
                      className="w-full mt-0.5 rounded border border-gray-300 px-2 py-1.5 text-sm"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="text-xs text-[#383d71] underline self-start"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
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
              value={payStatus}
              onChange={(e) => setPayStatus(e.target.value as PayStatusFilter)}
              disabled={!selectedJobId}
              className="w-full h-[44px] px-3 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#383d71]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
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

        {jobsLoading && (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        )}

        {!selectedJobId && !jobsLoading && (
          <p className="text-center text-gray-500 py-8 text-sm">Select a job above to load tech pay totals.</p>
        )}

        {selectedJobId && loading && (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        )}

        {selectedJobId && !loading && jobDetails && (
          <>
            <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4 shadow-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold text-gray-900">Job ID:</span>{" "}
                  <span className="text-[#383d71]">{displayJobId}</span>
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Total:</span>{" "}
                  {money(jobDetails.overallTotalPay)}
                </p>
                <p>
                  <span className="font-semibold text-gray-900">Pay Status:</span> {displayedPayStatus}
                </p>
              </div>
              {jobDetails.jobTitle && (
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">Job:</span> {jobDetails.jobTitle}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden mb-6 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">
                  Tech Pay Totals per JobID
                  {displayJobId !== "—" ? `: ${displayJobId}` : ""}
                </h2>
                {jobDetails.totalTechnicians != null && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {jobDetails.totalTechnicians} technician
                    {jobDetails.totalTechnicians === 1 ? "" : "s"} assigned
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr>
                      <Th label="Tech" sortKey="name" />
                      <Th label="Type" sortKey="type" />
                      <Th label="Work Order(s) Total" sortKey="workOrderCount" />
                      <Th label={`Total Tech Pay / JobID: ${displayJobId}`} sortKey="totalTechPay" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTechRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                          No technicians found for this job.
                        </td>
                      </tr>
                    ) : (
                      sortedTechRows.map((row, i) => (
                          <tr
                            key={row.technicianId}
                            className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
                          >
                            <td className="px-3 py-2.5 border-b border-gray-100">
                              <Link
                                href={buildDetailHref(row)}
                                className="text-[#383d71] font-medium underline hover:opacity-90"
                              >
                                {row.name}
                              </Link>
                            </td>
                            <td className="px-3 py-2.5 border-b border-gray-100">{row.type || "—"}</td>
                            <td className="px-3 py-2.5 border-b border-gray-100">
                              {row.workOrderCount ?? 0}
                            </td>
                            <td className="px-3 py-2.5 border-b border-gray-100 font-medium">
                              {money(row.totalTechPay)}
                            </td>
                          </tr>
                      ))
                    )}
                  </tbody>
                  {sortedTechRows.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-3 py-2.5 text-xs font-semibold text-gray-600">
                          Job Total
                        </td>
                        <td className="px-3 py-2.5 text-sm font-semibold text-gray-900">
                          {money(jobDetails.overallTotalPay)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              <div className="px-4 py-3 border-t border-gray-100 flex justify-center">
                <Pagination
                  currentPage={listPage}
                  totalPages={listTotalPages}
                  onPageChange={handleListPageChange}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
