"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import Loading from "@/app/component/loader";
import Breadcrumb from "@/app/component/breadcrumb";
import { useSidebar } from "@/app/component/SidebarContext";

const na = (v: any) => (v != null && String(v).trim() !== "" ? v : "N/A");

const money = (n: any) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(x);
};

function formatTechType(type: any) {
  if (!type) return "N/A";
  if (type === "R/I/R/R") return "R&I";
  return type;
}

function pickAmount(vt: any) {
  if (!vt) return null;
  const techPctAmt =
    vt.techPercentageCalculatedAmount != null &&
    String(vt.techPercentageCalculatedAmount).trim() !== "" &&
    String(vt.techPercentageCalculatedAmount).toLowerCase() !== "null"
      ? vt.techPercentageCalculatedAmount
      : null;
  const techFlat =
    vt.techFlatRate != null &&
    String(vt.techFlatRate).trim() !== "" &&
    String(vt.techFlatRate).toLowerCase() !== "null"
      ? vt.techFlatRate
      : null;
  const rPctAmt =
    vt.rPercentageCalculatedAmount != null &&
    String(vt.rPercentageCalculatedAmount).trim() !== "" &&
    String(vt.rPercentageCalculatedAmount).toLowerCase() !== "null"
      ? vt.rPercentageCalculatedAmount
      : null;
  const rRate =
    vt.rRate != null &&
    String(vt.rRate).trim() !== "" &&
    String(vt.rRate).toLowerCase() !== "null"
      ? vt.rRate
      : null;
  const value = techPctAmt ?? techFlat ?? rPctAmt ?? rRate;
  if (value == null) return null;
  const m = money(value);
  return m ?? `$${value}`;
}

function getDescriptionText(item: any): string {
  if (item == null) return "";
  if (typeof item === "string") {
    try {
      const parsed = JSON.parse(item);
      return parsed?.description ?? parsed?.name ?? String(item);
    } catch {
      return item;
    }
  }
  return (item as any)?.description ?? (item as any)?.name ?? String(item);
}

const InfoCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
    <div className="shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#383d71]">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="text-gray-900 break-words">{value}</div>
    </div>
  </div>
);

const StepBadge = ({
  number,
  label,
  active,
  done,
}: {
  number: number;
  label: string;
  active?: boolean;
  done?: boolean;
}) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
        done
          ? "bg-[#1e3e6f] text-white border-[#1e3e6f]"
          : active
          ? "bg-white text-[#1e3e6f] border-[#1e3e6f]"
          : "bg-white text-gray-400 border-gray-300"
      }`}
    >
      {done ? "✓" : number}
    </div>
    <span
      className={`text-sm font-medium ${done || active ? "text-gray-900" : "text-gray-400"}`}
    >
      {label}
    </span>
  </div>
);

const StepConnector = ({ done }: { done?: boolean }) => (
  <div
    className={`flex-1 h-0.5 mx-2 rounded ${done ? "bg-[#1e3e6f]" : "bg-gray-200"}`}
    aria-hidden
  />
);

const TechniciansBlock = ({ techs }: { techs: any[] }) => {
  if (!techs || techs.length === 0) {
    return (
      <p className="text-xs text-gray-500 italic px-3 py-2 bg-gray-50 rounded-md">
        No Dent Tech assigned.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {techs.map((tech: any) => {
        const vt = tech?.VehicleTechnician || tech?.vehicleTechnician || tech;
        const amount = pickAmount(vt);
        const isDeleted = Boolean(tech?.deletedStatus);
        const techType = tech?.techType ?? vt?.techType;
        const isRI = String(techType || "").toLowerCase() === "r/i/r/r";
        return (
          <div
            key={tech.id}
            className="border border-gray-200 rounded-lg bg-white p-3 hover:border-[#1e3e6f]/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-full bg-blue-100 text-[#383d71] flex items-center justify-center font-semibold text-sm uppercase">
                  {String(tech?.firstName || "?").slice(0, 1)}
                  {String(tech?.lastName || "").slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p
                    className={`font-semibold text-md capitalize truncate ${
                      isDeleted ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {tech.firstName} {tech.lastName}
                  </p>
                  {/* <p className="text-[12px] text-gray-500">{formatTechType(techType)}</p> */}
                </div>
              </div>
              <span
                className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${
                  isRI ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"
                }`}
              >
                {isRI ? "R&I" : "Dent Tech"}
              </span>
            </div>
            <div className="space-y-1 text-md">
              {tech?.email && (
                <p className="text-gray-700 truncate">
                  <span className="text-gray-500 mr-1">Email:</span>
                  <a
                    className="text-[#383d71] hover:underline break-all"
                    href={`mailto:${tech.email}`}
                  >
                    {tech.email}
                  </a>
                </p>
              )}
              {tech?.phoneNumber && (
                <p className="text-gray-700">
                  <span className="text-gray-500 mr-1">Phone:</span>
                  <a className="text-[#383d71] hover:underline" href={`tel:${tech.phoneNumber}`}>
                    {tech.phoneNumber}
                  </a>
                </p>
              )}
              {vt?.payoutShare != null && String(vt.payoutShare).trim() !== "" && (
                <p className="text-gray-700">
                  <span className="text-gray-500 mr-1">Payout Share:</span>
                  <span className="font-medium text-gray-900">
                    {money(vt.payoutShare) || `$${vt.payoutShare}`}
                  </span>
                </p>
              )}
              {amount && (
                <p className="text-gray-700">
                  <span className="text-gray-500 mr-1">Amount:</span>
                  <span className="font-medium text-gray-900">{amount}</span>
                </p>
              )}
              {isDeleted && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 mt-1">
                  Deleted Tech
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const JobDescriptionBlock = ({ items }: { items: any[] }) => {
  const valid = Array.isArray(items)
    ? items
        .map((it) => getDescriptionText(it))
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  if (valid.length === 0) {
    return (
      <p className="text-xs text-gray-500 italic px-3 py-2 bg-gray-50 rounded-md">
        No work-order descriptions added.
      </p>
    );
  }
  return (
    <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-800 marker:text-gray-400">
      {valid.map((t, i) => (
        <li key={i} style={{ wordBreak: "break-word" }}>
          {t}
        </li>
      ))}
    </ol>
  );
};

const ImagesBlock = ({
  images,
  onPreview,
}: {
  images: any;
  onPreview: (url: string) => void;
}) => {
  const urls: string[] = Array.isArray(images)
    ? images.map((u) => String(u || "").trim()).filter(Boolean)
    : [];
  if (urls.length === 0) {
    return (
      <p className="text-xs text-gray-500 italic px-3 py-2 bg-gray-50 rounded-md">
        No images uploaded.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
      {urls.map((url, i) => (
        <button
          key={`${url}-${i}`}
          type="button"
          onClick={() => onPreview(url)}
          className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-[#1e3e6f] focus:outline-none focus:ring-2 focus:ring-[#1e3e6f]/50"
          aria-label={`Preview image ${i + 1}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`vehicle-img-${i + 1}`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            View
          </span>
        </button>
      ))}
    </div>
  );
};

export default function TechView() {
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [vin, setVin] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);

  const fetchVehicleByVin = async (vinValue: string, jobIdValue?: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const jid = jobIdValue != null ? String(jobIdValue).trim() : "";
      const query =
        `vin=${encodeURIComponent(vinValue)}` +
        (jid ? `&jobId=${encodeURIComponent(jid)}` : "");

      const res = await fetch(`/api/fetchSingleVehicleInfoByVin?${query}`, {
        method: "GET",
        headers,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || data?.message || "Failed to load vehicle");
        setVehicles([]);
        return;
      }
      const list: any[] = Array.isArray(data?.vehicles)
        ? data.vehicles
        : Array.isArray(data?.data?.vehicles)
        ? data.data.vehicles
        : Array.isArray(data?.vehicle)
        ? data.vehicle
        : data?.vehicle?.vehicle
        ? [data.vehicle.vehicle]
        : data?.vehicle
        ? [data.vehicle]
        : data?.data
        ? [data.data]
        : Array.isArray(data)
        ? data
        : [];
      setVehicles(list.filter((v) => v && typeof v === "object"));
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while fetching vehicle data");
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const v = searchParams?.get("vin") || "";
    const jobId = searchParams?.get("jobId") || "";
    setVin(v);
    if (!v) {
      toast.error("Missing VIN");
      setLoading(false);
      return;
    }
    fetchVehicleByVin(v, jobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleDeleteVehicle = async (vehicleId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You can't undo this action!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please sign in again.");
      return;
    }

    setDeletingVehicleId(vehicleId);
    try {
      const res = await fetch("/api/deleteVehicle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vehicleId, deletedStatus: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(typeof data?.message === "string" ? data.message : "Vehicle deleted successfully");
        setVehicles((prev) => prev.filter((x) => String(x?.id) !== String(vehicleId)));
      } else {
        toast.error(data?.error || data?.message || "Failed to delete vehicle");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while deleting the vehicle");
    } finally {
      setDeletingVehicleId(null);
    }
  };

  const totalTechs = useMemo(() => {
    let count = 0;
    for (const v of vehicles) {
      const t = Array.isArray(v?.assignedTechnicians) ? v.assignedTechnicians : [];
      count += t.length;
    }
    return count;
  }, [vehicles]);

  const uniqueJobsCount = useMemo(() => {
    const set = new Set<string>();
    for (const v of vehicles) {
      const k = String(v?.jobId ?? v?.job?.id ?? v?.jobName ?? v?.job?.jobName ?? "—");
      set.add(k);
    }
    return set.size;
  }, [vehicles]);

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className={`relative mobile_listing mx-auto mt-4 ${isCollapsed ? "w-full pl-20" : "container"}`}>
        <Breadcrumb
          items={[
            { label: "Tech Reporting", onClick: () => router.back() },
            { label: "Technician View", href: "" },
          ]}
        />
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500 text-sm">
          No vehicles found for VIN <span className="font-mono">{vin || "—"}</span>.
        </div>
      </div>
    );
  }

  const firstVehicle = vehicles[0];
  const fv = firstVehicle;
  const fj = fv?.job || {};
  const topCustomer = fv?.customer || fv?.Customer || fj?.customer || {};

  return (
    <div
      className={`relative mobile_listing mx-auto mt-4 transition-all duration-300 ${
        isCollapsed ? "w-full pl-20" : "container"
      }`}
    >
      <Breadcrumb
        items={[
          { label: "Tech Reporting", onClick: () => router.back() },
          { label: "Technician View", href: "" },
        ]}
      />

      {/* Top summary banner */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">VIN</p>
            <p className="font-mono text-base text-gray-900 break-all">
              {vin || na(firstVehicle?.vin)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-blue-50 text-[#1e3e6f] text-xs font-medium px-3 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {uniqueJobsCount} Job{uniqueJobsCount > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 text-xs font-medium px-3 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              {vehicles.length} Vehicle Record{vehicles.length > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 5.87a4 4 0 10-8 0m8 0a4 4 0 108 0m-8 0v.01" />
              </svg>
              {totalTechs} Technician Assignment{totalTechs !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Stepper */}
        {/* <div className="flex items-center justify-between gap-2">
          <StepBadge number={1} label="Job & Vehicle" done />
          <StepConnector done />
          <StepBadge number={2} label="Work / Images" done />
          <StepConnector done={totalTechs > 0} />
          <StepBadge
            number={3}
            label={`Technicians (${totalTechs})`}
            active={totalTechs === 0}
            done={totalTechs > 0}
          />
        </div> */}
      </div>

      {/* Job — once (primary work order) */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
        <div className="flex items-center gap-2 bg-[#1e3e6f] text-white px-6 py-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-bold text-base">Job</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            label="Job Title"
            value={na(fv?.jobName || fj?.jobName)}
          />
          <InfoCard icon={<span className="text-sm font-bold">#</span>} label="Job ID" value={na(fv?.jobId || fj?.id)} />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Job Status"
            value={
              <span
                className={
                  String(fj?.jobStatus).toLowerCase() === "completed" || fj?.jobStatus === true
                    ? "bg-[#E6F9DD] text-[#1A932E] px-2 py-1 rounded font-medium mt-1 block w-fit"
                    : "bg-[#FFF4D6] text-[#9A6300] px-2 py-1 rounded font-medium mt-1 block w-fit"
                }
              >
                {typeof fj?.jobStatus === "boolean"
                  ? fj.jobStatus
                    ? "Completed"
                    : "In Progress"
                  : na(fj?.jobStatus)}
              </span>
            }
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            label="Customer"
            value={<span className="capitalize">{na(topCustomer?.fullName)}</span>}
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            label="Customer Email"
            value={
              topCustomer?.email ? (
                <a className="hover:underline text-[#383d71]" href={`mailto:${topCustomer.email}`}>
                  {topCustomer.email}
                </a>
              ) : (
                "N/A"
              )
            }
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            label="Start Date"
            value={fv?.startDate ? new Date(fv.startDate).toLocaleDateString() : "N/A"}
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            label="End Date"
            value={fv?.endDate ? new Date(fv.endDate).toLocaleDateString() : "N/A"}
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Job Type"
            value={na(fj?.jobType)}
          />
        </div>
      </div>

      {/* Work order · Vehicle detail — once (same VIN / primary record) */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="flex items-center gap-2 bg-[#1e3e6f] text-white px-6 py-3">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <span className="font-bold text-base">Work Order · Vehicle Detail</span>
        </div>
        {/* {vehicles.length > 1 && (
          <p className="text-xs text-amber-800 bg-amber-50 border-b border-amber-100 px-6 py-2">
            Multiple work orders share this VIN. Specs below are from the first record; each card
            further down lists that record&apos;s description, images, and technicians.
          </p>
        )} */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {/* <InfoCard icon={<span className="text-sm font-bold">#</span>} label="Vehicle ID" value={na(fv?.id)} /> */}
          <InfoCard icon={<span className="text-sm font-bold">#</span>} label="VIN" value={<span className="font-mono text-sm break-all">{na(fv?.vin)}</span>} />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
            label="Make"
            value={na(fv?.make)}
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
            label="Model"
            value={na(fv?.model)}
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            label="Model Year"
            value={na(fv?.modelYear)}
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
            label="Vehicle Type"
            value={na(fv?.vehicleType)}
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            label="Body Class"
            value={na(fv?.bodyClass)}
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            }
            label="Color"
            value={fv?.color && String(fv.color).trim() !== "" ? fv.color : <span className="text-gray-500">N/A</span>}
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
            label="Manufacturer"
            value={na(fv?.manufacturerName)}
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            label="Vehicle Descriptor"
            value={na(fv?.vehicleDescriptor)}
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Plant Country"
            value={na(fv?.plantCountry)}
          />
          {/* <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Plant State"
            value={na(fv?.plantState)}
          /> */}
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            label="Plant Company"
            value={na(fv?.plantCompanyName)}
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            label="Estimated By"
            value={na(fv?.estimatedBy)}
          />
          {/* <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Labour Cost"
            value={
              fv?.labourCost != null && String(fv.labourCost).trim() !== ""
                ? money(fv.labourCost) || `$${fv.labourCost}`
                : "N/A"
            }
          />
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Vehicle Status"
            value={
              <span
                className={
                  fv?.vehicleStatus
                    ? "bg-[#E6F9DD] text-[#1A932E] px-3 py-1 rounded font-medium"
                    : "bg-[#FFE4E1] text-[#FF0000] px-3 py-1 rounded font-medium"
                }
              >
                {fv?.vehicleStatus ? "Completed" : "In Progress"}
              </span>
            }
          /> */}
          <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            label="Created By"
            value={na(fv?.createdBy)}
          />
          {/* <InfoCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            label="Notes"
            value={na(fv?.notes)}
          /> */}
        </div>
      </div>

      {/* Per work order: description, images, technicians */}
      {vehicles.map((v: any, i: number) => {
        const job = v?.job || {};
        const techs: any[] = Array.isArray(v?.assignedTechnicians)
          ? v.assignedTechnicians
          : Array.isArray(v?.technicians)
          ? v.technicians
          : [];
        const ymm =
          [v?.modelYear, v?.make, v?.model].filter(Boolean).join(" ") || "Vehicle";
        const notesRaw = v?.notes ?? job?.notes;
        const notesStr =
          notesRaw != null && String(notesRaw).trim() !== "" && String(notesRaw).toLowerCase() !== "null"
            ? String(notesRaw).trim()
            : "";
        return (
          <div
            key={v.id ?? i}
            className="bg-white rounded-lg shadow-md overflow-hidden mb-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-800 min-w-0">
                <span className="font-semibold text-[#1e3e6f]">Record #{i + 1}</span>
                <span className="text-gray-400 hidden sm:inline">|</span>
                <span>
                  Vehicle ID <span className="font-mono font-medium">#{na(v?.id)}</span>
                </span>
                <span className="text-gray-400 hidden sm:inline">|</span>
                <span className="truncate max-w-[min(100%,18rem)]" title={String(v?.jobName || job?.jobName || "")}>
                  Job: {na(v?.jobName || job?.jobName)}
                </span>
                <span className="text-gray-400 hidden md:inline">|</span>
                <span className="text-gray-600 truncate max-w-[min(100%,14rem)] hidden md:inline" title={ymm}>
                  {ymm}
                </span>
              </div>
              {v?.id != null && String(v.id).trim() !== "" && (
                <div className="shrink-0 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/vehicle/create-vehicle?vahicleId=${encodeURIComponent(String(v.id))}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#1e3e6f] bg-white px-3 py-1.5 text-sm font-medium text-[#1e3e6f] hover:bg-[#1e3e6f] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    disabled={deletingVehicleId === String(v.id)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit vehicle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVehicle(String(v.id))}
                    disabled={deletingVehicleId === String(v.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-600 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    {deletingVehicleId === String(v.id) ? "Deleting…" : "Delete vehicle"}
                  </button>
                </div>
              )}
            </div>

            {/* Job Description + Images + Technicians */}
            <div className="px-6 pb-6 space-y-4 mt-4">
              {/* Job Description */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <svg className="w-4 h-4 text-[#1e3e6f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-gray-900">Work Description</h4>
                </div>
                <div className="p-3">
                  <JobDescriptionBlock items={v?.jobDescription} />
                </div>
              </div>

              {/* Notes (vehicle or job) */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <svg className="w-4 h-4 text-[#1e3e6f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  <h4 className="text-sm font-semibold text-gray-900">Notes</h4>
                </div>
                <div className="p-3">
                  {notesStr ? (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap" style={{ wordBreak: "break-word" }}>
                      {notesStr}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 italic px-3 py-2 bg-gray-50 rounded-md">No notes added.</p>
                  )}
                </div>
              </div>

              {/* Images */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <svg className="w-4 h-4 text-[#1e3e6f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-gray-900">Images</h4>
                  {Array.isArray(v?.images) && v.images.length > 0 && (
                    <span className="text-[10px] bg-blue-100 text-[#1e3e6f] rounded-full px-2 py-0.5">
                      {v.images.length}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <ImagesBlock images={v?.images} onPreview={(u) => setPreviewImage(u)} />
                </div>
              </div>

              {/* Assigned Technicians */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <svg className="w-4 h-4 text-[#1e3e6f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 5.87a4 4 0 10-8 0m8 0a4 4 0 108 0m-8 0v.01" />
                  </svg>
                  <h4 className="text-sm font-semibold text-gray-900">Assigned Dent Tech</h4>
                  <span className="text-[10px] bg-blue-100 text-[#1e3e6f] rounded-full px-2 py-0.5">
                    {techs.length}
                  </span>
                </div>
                <div className="p-3">
                  <TechniciansBlock techs={techs} />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Image lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white bg-white/15 hover:bg-white/25 rounded-full w-10 h-10 flex items-center justify-center text-2xl leading-none"
            aria-label="Close preview"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="preview"
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
