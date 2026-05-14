"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/app/component/breadcrumb";
import { useSidebar } from "@/app/component/SidebarContext";
import Loader from "@/app/component/loader";
import toast from "react-hot-toast";
import { ExportToCsv } from "export-to-csv-file";
import SortIcon from "@/app/component/sortIcon";
import { format } from "date-fns";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

if (pdfFonts && (pdfFonts as any).pdfMake?.vfs) {
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";

type AnalyticsVehicle = {
  id?: number;
  vin?: string;
  make?: string;
  model?: string;
  modelYear?: number | string;
  vehicleType?: string;
  totalLaborPayout?: number | string;
  technicians?: Array<{
    id: number;
    firstName?: string;
    lastName?: string;
    payoutShare?: number | string;
    techType?: string;
  }>;
};

type AnalyticsPayload = {
  totalCars?: number;
  totalTechPayout?: number | string;
  activeTechniciansCount?: number;
  jobStatus?: string;
  jobName?: string;
  /** Vehicles for the top "Individual vehicles worked" table. */
  individualVehiclesWorked?: AnalyticsVehicle[];
  /** Vehicles for the bottom "Group Vehicles Worked" table. */
  groupVehiclesWorked?: AnalyticsVehicle[];
};

function money(n: number | string | undefined | null) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(x);
}

function techName(t: { firstName?: string; lastName?: string }) {
  return `${t.firstName || ""} ${t.lastName || ""}`.trim() || "—";
}

/** Lead = first `technician`; tag = second `technician`, or first R&I if only one dent tech */
function leadAndTag(technicians: AnalyticsVehicle["technicians"]) {
  const list = technicians || [];
  const dentTechs = list.filter((t) => String(t.techType || "").toLowerCase() === "technician");
  const riTechs = list.filter((t) => String(t.techType || "").toLowerCase() === "r/i/r/r");
  const lead = dentTechs[0];
  let tag = dentTechs[1];
  if (!tag && dentTechs.length === 1 && riTechs[0]) tag = riTechs[0];
  return {
    lead: lead ? techName(lead) : "—",
    tag: tag ? techName(tag) : "—",
  };
}

/** Full VIN + make/model line for the individual-vehicles table. */
function vehicleTitleShort(v: AnalyticsVehicle) {
  const vin = String(v.vin || "").trim();
  const mm = [v.make, v.model].filter(Boolean).join(" ");
  if (!vin && !mm) return "—";
  if (!vin) return mm;
  return `${vin}${mm ? ` (${mm})` : ""}`;
}

/** VIN first, then year/make/model — used in Group Vehicles Worked tables. */
function vehicleTitleLong(v: AnalyticsVehicle) {
  const vin = String(v.vin || "").trim();
  const y = v.modelYear != null && v.modelYear !== "" ? `${v.modelYear} ` : "";
  const mm = [v.make, v.model].filter(Boolean).join(" ");
  const descriptor = `${y}${mm}`.trim();
  if (!vin && !descriptor) return "—";
  if (!vin) return descriptor;
  if (!descriptor) return vin;
  return `${vin} (${descriptor})`;
}

export default function TechReportingDashboard() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);

  const [sortInd, setSortInd] = useState<{ key: string; dir: "asc" | "desc" }>({
    key: "vin",
    dir: "asc",
  });
  const [sortGroup, setSortGroup] = useState<{ key: string; dir: "asc" | "desc" }>({
    key: "vehicle",
    dir: "asc",
  });

  const datePopoverRef = useRef<HTMLDivElement>(null);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

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
      // Auto-select the first job on initial load so analytics render immediately.
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

  const fetchAnalytics = async (
    jobId: string,
    opts?: { searchQuery?: string }
  ) => {
    if (!jobId) {
      setAnalytics(null);
      return;
    }
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }
      const params = new URLSearchParams({ jobId: String(jobId), page: "1", limit: "500" });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const q = (opts?.searchQuery ?? "").trim();
      if (q) params.set("search", q);

      const res = await fetch(`${baseUrl}/fetchjobtechnicienAnalyticsReport?${params.toString()}`, {
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
        toast.error(json?.message || "Failed to load analytics");
        setAnalytics(null);
        return;
      }
      const payload = json?.data ?? json;
      // Backend may return either the new split shape
      // ({ individualVehiclesWorked, groupVehiclesWorked }) or the older flat
      // `vehicles` array — accept both so we don't break on rollouts.
      const legacyVehicles: AnalyticsVehicle[] = Array.isArray(payload?.vehicles)
        ? payload.vehicles
        : [];
      const individual: AnalyticsVehicle[] = Array.isArray(payload?.individualVehiclesWorked)
        ? payload.individualVehiclesWorked
        : legacyVehicles;
      const group: AnalyticsVehicle[] = Array.isArray(payload?.groupVehiclesWorked)
        ? payload.groupVehiclesWorked
        : legacyVehicles;

      setAnalytics({
        totalCars: payload?.totalCars,
        totalTechPayout: payload?.totalTechPayout,
        activeTechniciansCount: payload?.activeTechniciansCount,
        jobStatus: payload?.jobStatus,
        jobName: payload?.jobName,
        individualVehiclesWorked: individual,
        groupVehiclesWorked: group,
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load analytics");
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Debounce search so we don't fire a request on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!selectedJobId) {
      setAnalytics(null);
      return;
    }
    fetchAnalytics(selectedJobId, { searchQuery: debouncedSearch });
  }, [selectedJobId, startDate, endDate, debouncedSearch]);

  const individualVehicles = analytics?.individualVehiclesWorked ?? [];
  const groupVehicles = analytics?.groupVehiclesWorked ?? [];

  /**
   * Backend `totalTechPayout` can double-count when both individual and group
   * vehicle lists are present. Prefer summing group rows (one row per vehicle, matches
   * "Group Vehicles Worked" footer); otherwise individual; else fall back to API.
   */
  const displayedTotalTechPayout = useMemo(() => {
    if (!analytics) return null;
    const group = Array.isArray(analytics.groupVehiclesWorked) ? analytics.groupVehiclesWorked : [];
    const groupSum = group.reduce((acc, v) => acc + (Number(v.totalLaborPayout) || 0), 0);
    if (group.length > 0) return groupSum;
    const ind = Array.isArray(analytics.individualVehiclesWorked)
      ? analytics.individualVehiclesWorked
      : [];
    const indSum = ind.reduce((acc, v) => acc + (Number(v.totalLaborPayout) || 0), 0);
    if (ind.length > 0) return indSum;
    const n = Number(analytics.totalTechPayout);
    return Number.isFinite(n) ? n : 0;
  }, [analytics]);

  const individualRows = useMemo(
    () =>
      individualVehicles.map((v) => {
        const { lead } = leadAndTag(v.technicians);
        return {
          ...v,
          _vinModel: vehicleTitleShort(v),
          _lead: lead,
          _type: v.vehicleType || "—",
          _payout: Number(v.totalLaborPayout) || 0,
        };
      }),
    [individualVehicles]
  );

  const sortedIndividual = useMemo(() => {
    const rows = [...individualRows];
    const { key, dir } = sortInd;
    const mul = dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (key === "vin") {
        va = a._vinModel.toLowerCase();
        vb = b._vinModel.toLowerCase();
      } else if (key === "lead") {
        va = a._lead.toLowerCase();
        vb = b._lead.toLowerCase();
      } else if (key === "type") {
        va = a._type.toLowerCase();
        vb = b._type.toLowerCase();
      } else if (key === "payout") {
        va = a._payout;
        vb = b._payout;
      }
      if (va < vb) return -1 * mul;
      if (va > vb) return 1 * mul;
      return 0;
    });
    return rows;
  }, [individualRows, sortInd]);

  /** Unique technicians (columns) across the Group Vehicles Worked array. */
  const groupTechColumns = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of groupVehicles) {
      for (const t of v.technicians || []) {
        const id = String(t.id);
        if (!m.has(id)) m.set(id, techName(t));
      }
    }
    return Array.from(m.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [groupVehicles]);

  const groupRows = useMemo(
    () =>
      groupVehicles.map((v) => {
        const shares: Record<string, number> = {};
        for (const t of v.technicians || []) {
          shares[String(t.id)] = Number(t.payoutShare) || 0;
        }
        return {
          vehicleId: v.id,
          vin: v.vin,
          vehicle: vehicleTitleLong(v),
          payout: Number(v.totalLaborPayout) || 0,
          shares,
        };
      }),
    [groupVehicles]
  );

  const sortedGroup = useMemo(() => {
    const rows = [...groupRows];
    const { key, dir } = sortGroup;
    const mul = dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      if (key === "vehicle") {
        va = a.vehicle.toLowerCase();
        vb = b.vehicle.toLowerCase();
      } else if (key === "payout") {
        va = a.payout;
        vb = b.payout;
      } else {
        va = a.shares[key] ?? 0;
        vb = b.shares[key] ?? 0;
      }
      if (va < vb) return -1 * mul;
      if (va > vb) return 1 * mul;
      return 0;
    });
    return rows;
  }, [groupRows, sortGroup]);

  const toggleSortInd = (key: string) => {
    setSortInd((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const toggleSortGroup = (key: string) => {
    setSortGroup((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const dateRangeLabel =
    startDate && endDate
      ? `${format(new Date(startDate + "T12:00:00"), "MMM d, yyyy")} – ${format(
          new Date(endDate + "T12:00:00"),
          "MMM d, yyyy"
        )}`
      : "Optional date range";

  const clearFilters = () => {
    // setSelectedJobId("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    // setAnalytics(null);
    // setDatePopoverOpen(false);
  };

  const exportCsv = () => {
    if (!selectedJobId || !analytics) {
      toast.error("Select a job and load analytics first.");
      return;
    }
    const jobSlug = String(analytics.jobName || selectedJobId).replace(/\s+/g, "-");
    const ind = sortedIndividual.map((r) => ({
      "Vehicle VIN / Model": r._vinModel,
      "Technician": r._lead,
      "Vehicle Type": r._type,
      "Payout (Labor)": r._payout,
    }));
    new ExportToCsv({
      filename: `tech-analytics-${jobSlug}-individual`,
      fieldSeparator: ",",
      quoteStrings: '"',
      showLabels: true,
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
    }).generateCsv(ind);

    const grp = sortedGroup.map((r) => {
      const row: Record<string, string | number> = {
        "Vehicle VIN / Model": r.vehicle,
        "Payout (Labor)": r.payout,
      };
      groupTechColumns.forEach((c) => {
        row[`${c.name} Payout Share`] = r.shares[c.id] ?? 0;
      });
      return row;
    });
    const totalRow: Record<string, string | number> = {
      "Vehicle VIN / Model": "Total",
      "Payout (Labor)": sortedGroup.reduce((acc, r) => acc + r.payout, 0),
    };
    groupTechColumns.forEach((c) => {
      totalRow[`${c.name} Payout Share`] = sortedGroup.reduce(
        (acc, r) => acc + (r.shares[c.id] ?? 0),
        0
      );
    });
    grp.push(totalRow);
    new ExportToCsv({
      filename: `tech-analytics-${jobSlug}-group`,
      fieldSeparator: ",",
      quoteStrings: '"',
      showLabels: true,
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
    }).generateCsv(grp);
    toast.success("Downloaded 2 CSV files (individual + group)");
  };

  const exportPdf = () => {
    if (!selectedJobId || !analytics) {
      toast.error("Select a job and load analytics first.");
      return;
    }
    const jobLabel = analytics.jobName || `Job ${selectedJobId}`;

    const individualPdfBlocks: any[] = [];
    if (sortedIndividual.length > 0) {
      const indBody: any[] = [
        [
          { text: "Vehicle VIN / Model", style: "th" },
          { text: "Technician", style: "th" },
          { text: "Type", style: "th" },
          { text: "Payout", style: "th" },
        ],
        ...sortedIndividual.map((r) => [
          r._vinModel,
          r._lead,
          r._type,
          money(r._payout),
        ]),
      ];
      individualPdfBlocks.push(
        { text: "Individual vehicles worked", style: "h2", margin: [0, 0, 0, 6] },
        { table: { headerRows: 1, widths: ["*", "auto", "auto", "auto"], body: indBody } }
      );
    }

    const gHead: any[] = [
      { text: "Vehicle VIN / Model", style: "th" },
      { text: "Payout (Labor)", style: "th" },
      ...groupTechColumns.map((c) => ({ text: `${c.name} Payout Share`, style: "th" })),
    ];
    const gBody: any[] = sortedGroup.map((r) => [
      r.vehicle,
      money(r.payout),
      ...groupTechColumns.map((c) => money(r.shares[c.id] ?? 0)),
    ]);
    const techTotals = groupTechColumns.map((c) =>
      sortedGroup.reduce((acc, r) => acc + (r.shares[c.id] ?? 0), 0)
    );
    const payoutTotal = sortedGroup.reduce((acc, r) => acc + r.payout, 0);
    gBody.push([
      { text: "Total", bold: true },
      { text: money(payoutTotal), bold: true },
      ...techTotals.map((t) => ({ text: money(t), bold: true })),
    ]);

    const docDefinition: any = {
      pageMargins: [28, 28, 28, 28],
      content: [
        { text: "Comprehensive Job & Technician Analytics", style: "h1" },
        { text: jobLabel, margin: [0, 4, 0, 12] },
        ...individualPdfBlocks,
        {
          text: "Group Vehicles Worked",
          style: "h2",
          margin: [0, sortedIndividual.length > 0 ? 16 : 0, 0, 6],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "auto", ...groupTechColumns.map(() => "auto")],
            body: [gHead, ...gBody],
          },
        },
      ],
      styles: {
        h1: { fontSize: 14, bold: true },
        h2: { fontSize: 11, bold: true },
        th: { bold: true, fillColor: "#eeeeee" },
      },
      defaultStyle: { fontSize: 9 },
    };
    pdfMake.createPdf(docDefinition).download(`tech-analytics-${selectedJobId}.pdf`);
    toast.success("PDF downloaded");
  };

  const Th = ({
    label,
    sortKey,
    activeKey,
    direction,
    onClick,
    highlight,
  }: {
    label: string;
    sortKey: string;
    activeKey: string;
    direction: "asc" | "desc";
    onClick: () => void;
    highlight?: boolean;
  }) => (
    <th
      className={`text-left text-xs font-semibold text-gray-700 px-3 py-2 border-b border-gray-200 cursor-pointer select-none whitespace-nowrap ${
        highlight ? "bg-sky-50" : "bg-gray-50"
      }`}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon active={activeKey === sortKey} direction={direction} />
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
        {/* Header row */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
            Comprehensive Job &amp; Technician Analytics
          </h1>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg bg-[#383d71] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95"
            >
              <span aria-hidden>📄</span>
              Export Report (CSV)
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="inline-flex items-center gap-2 rounded-lg border border-[#383d71] px-4 py-2.5 text-sm font-medium text-[#383d71] bg-white hover:bg-gray-50"
            >
              <span aria-hidden>📑</span>
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4 flex flex-col lg:flex-row lg:flex-wrap gap-3 lg:items-end">
          <div className="min-w-[220px] flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Select Job</label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#383d71]/30"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              disabled={jobsLoading}
            >
              <option value="">— Choose a job —</option>
              {jobs.map((j) => (
                <option key={j.id} value={String(j.id)}>
                  {j.jobName || "Untitled"} (#{j.id})
                </option>
              ))}
            </select>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
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

          <div className="min-w-[200px] flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div className="relative" title={!selectedJobId ? "Select a job first" : undefined}>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input
                type="search"
                placeholder={selectedJobId ? "Search Technician / VIN…" : "Select a job first"}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#383d71]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!selectedJobId}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 self-end"
          >
            Clear filters
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Cars in Job", value: analytics != null ? String(analytics.totalCars ?? 0) : "—" },
            {
              label: "Total Tech Payout",
              value: displayedTotalTechPayout != null ? money(displayedTotalTechPayout) : "—",
            },
            {
              label: "Active Technicians",
              value: analytics != null ? String(analytics.activeTechniciansCount ?? 0) : "—",
            },
            { label: "Job Status", value: analytics?.jobStatus || "—" },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-gray-500 mb-1">{c.label}</p>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            </div>
          ))}
        </div>

        {jobsLoading && (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        )}

        {!selectedJobId && !jobsLoading && (
          <p className="text-center text-gray-500 py-8 text-sm">Select a job above to load analytics.</p>
        )}

        {selectedJobId && analyticsLoading && (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        )}

        {selectedJobId && !analyticsLoading && analytics && (
          <>
            {analytics.jobName && (
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-semibold text-gray-800">{analytics.jobName}</span>
              </p>
            )}

            {/* Table 1 — Individual vehicles worked (no edit column) */}
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden mb-6 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 bg-white">
                <h2 className="text-base font-semibold text-gray-900">Individual vehicles worked</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr>
                      <Th
                        label="Vehicle VIN / Model"
                        sortKey="vin"
                        activeKey={sortInd.key}
                        direction={sortInd.dir}
                        onClick={() => toggleSortInd("vin")}
                      />
                      <Th
                        label="Technician"
                        sortKey="lead"
                        activeKey={sortInd.key}
                        direction={sortInd.dir}
                        onClick={() => toggleSortInd("lead")}
                        highlight
                      />
                      <Th
                        label="Vehicle Type"
                        sortKey="type"
                        activeKey={sortInd.key}
                        direction={sortInd.dir}
                        onClick={() => toggleSortInd("type")}
                      />
                      <Th
                        label="Payout (Labor)"
                        sortKey="payout"
                        activeKey={sortInd.key}
                        direction={sortInd.dir}
                        onClick={() => toggleSortInd("payout")}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedIndividual.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                          No vehicles match your search.
                        </td>
                      </tr>
                    ) : (
                      sortedIndividual.map((r, i) => (
                        <tr
                          key={r.id ?? i}
                          className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
                        >
                          <td className="px-3 py-2.5 border-b border-gray-100 text-gray-800">
                            {r.vin ? (
                              <Link
                                href={
                                  selectedJobId
                                    ? `/reporting/tech-view?vin=${encodeURIComponent(String(r.vin))}&jobId=${encodeURIComponent(selectedJobId)}`
                                    : `/reporting/tech-view?vin=${encodeURIComponent(String(r.vin))}`
                                }
                                className="text-[#383d71]  underline font-medium"
                              >
                                {r._vinModel}
                              </Link>
                            ) : (
                              r._vinModel
                            )}
                          </td>
                          <td className="px-3 py-2.5 border-b border-gray-100 bg-sky-50/80 text-gray-900">
                            {r._lead}
                          </td>
                          <td className="px-3 py-2.5 border-b border-gray-100">{r._type}</td>
                          <td className="px-3 py-2.5 border-b border-gray-100 font-medium">
                            {money(r._payout)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Group Vehicles Worked — single table, dynamic columns per technician */}
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Group Vehicles Worked</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  One row per vehicle: total labor payout plus each technician&apos;s share.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr>
                      <Th
                        label="Vehicle VIN / Model"
                        sortKey="vehicle"
                        activeKey={sortGroup.key}
                        direction={sortGroup.dir}
                        onClick={() => toggleSortGroup("vehicle")}
                      />
                      <Th
                        label="Payout (Labor)"
                        sortKey="payout"
                        activeKey={sortGroup.key}
                        direction={sortGroup.dir}
                        onClick={() => toggleSortGroup("payout")}
                      />
                      {groupTechColumns.map((col) => (
                        <Th
                          key={col.id}
                          label={`${col.name} Payout Share`}
                          sortKey={col.id}
                          activeKey={sortGroup.key}
                          direction={sortGroup.dir}
                          onClick={() => toggleSortGroup(col.id)}
                        />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGroup.length === 0 ? (
                      <tr>
                        <td
                          colSpan={Math.max(2, 2 + groupTechColumns.length)}
                          className="px-3 py-8 text-center text-gray-500"
                        >
                          No vehicles to show.
                        </td>
                      </tr>
                    ) : (
                      sortedGroup.map((r, i) => (
                        <tr
                          key={i}
                          className={i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}
                        >
                          <td className="px-3 py-2.5 border-b border-gray-100 text-gray-800">
                            {r.vin ? (
                              <Link
                                href={
                                  selectedJobId
                                    ? `/reporting/tech-view?vin=${encodeURIComponent(String(r.vin))}&jobId=${encodeURIComponent(selectedJobId)}`
                                    : `/reporting/tech-view?vin=${encodeURIComponent(String(r.vin))}`
                                }
                                className="text-[#383d71]  underline font-medium"
                              >
                                {r.vehicle}
                              </Link>
                            ) : (
                              r.vehicle
                            )}
                          </td>
                          <td className="px-3 py-2.5 border-b border-gray-100 font-medium">
                            {money(r.payout)}
                          </td>
                          {groupTechColumns.map((col) => (
                            <td key={col.id} className="px-3 py-2.5 border-b border-gray-100">
                              {money(r.shares[col.id] ?? 0)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                  {sortedGroup.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2.5 text-xs font-semibold text-gray-600">Total</td>
                        <td className="px-3 py-2.5 text-sm font-semibold text-gray-900">
                          {money(sortedGroup.reduce((acc, row) => acc + row.payout, 0))}
                        </td>
                        {groupTechColumns.map((col) => {
                          const sum = sortedGroup.reduce(
                            (acc, row) => acc + (row.shares[col.id] ?? 0),
                            0
                          );
                          return (
                            <td
                              key={col.id}
                              className="px-3 py-2.5 text-sm font-semibold text-gray-900"
                            >
                              {money(sum)}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
