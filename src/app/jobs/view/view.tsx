"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/app/component/loader';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSearchParams, usePathname } from 'next/navigation';
import { Tooltip } from 'react-tooltip';

import Link from 'next/link';
import Image from 'next/image';
import Eye from '../../../../public/eye.svg';
import Empty from '@/app/component/empty';
import { useSidebar } from '@/app/component/SidebarContext';
import Swal from 'sweetalert2';

/** Single URL or JSON string array from API */
function parseInsuranceFileUrls(raw: unknown): string[] {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) {
    return raw.map((u) => String(u).trim()).filter(Boolean);
  }
  const s = String(raw).trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map((u) => String(u).trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }
  return [s];
}

function fileLabelFromInsuranceUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const name = decodeURIComponent(path.split('/').pop() || url);
    return name.replace(/\s+/g, ' ').trim() || url;
  } catch {
    return url;
  }
}

/** Per-vehicle link row on technician (API may use VehicleTechnician or UserJob). */
function getVehicleTechnicianLink(tech: any): any {
  return tech?.VehicleTechnician ?? tech?.UserJob ?? null;
}

/** One table row per technician–vehicle assignment (same tech repeats for each vehicle). */
type TechnicianVehicleAssignmentRow = {
  tech: any;
  vehicle: any;
  vt: any;
};

function buildTechnicianVehicleAssignmentRows(vehicles: any[] | undefined): TechnicianVehicleAssignmentRow[] {
  if (!Array.isArray(vehicles) || vehicles.length === 0) return [];

  const rows: TechnicianVehicleAssignmentRow[] = [];

  for (const vehicle of vehicles) {
    const assigned = vehicle?.assignedTechnicians;
    if (!Array.isArray(assigned)) continue;

    for (const t of assigned) {
      if (t?.id == null) continue;
      rows.push({
        tech: t,
        vehicle,
        vt: getVehicleTechnicianLink(t),
      });
    }
  }

  rows.sort((a, b) => {
    const an = `${a.tech?.firstName ?? ''} ${a.tech?.lastName ?? ''}`.trim().toLowerCase();
    const bn = `${b.tech?.firstName ?? ''} ${b.tech?.lastName ?? ''}`.trim().toLowerCase();
    if (an !== bn) return an.localeCompare(bn);
    return (Number(a.vehicle?.id) || 0) - (Number(b.vehicle?.id) || 0);
  });

  return rows;
}

function assignmentRowKey(tech: any, vehicle: any, index: number): string {
  return `${tech?.id ?? 't'}-${vehicle?.id ?? vehicle?.vin ?? index}`;
}

type AssignmentSortKey =
  | 'techName'
  | 'techFlat'
  | 'rr'
  | 'vin'
  | 'make'
  | 'model'
  | 'modelYear';

function filterAssignmentRows(
  rows: TechnicianVehicleAssignmentRow[],
  query: string,
): TechnicianVehicleAssignmentRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const name = `${row.tech?.firstName ?? ''} ${row.tech?.lastName ?? ''}`.toLowerCase();
    const vin = String(row.vehicle?.vin ?? '').toLowerCase();
    const make = String(row.vehicle?.make ?? '').toLowerCase();
    const model = String(row.vehicle?.model ?? '').toLowerCase();
    return (
      name.includes(q) ||
      vin.includes(q) ||
      make.includes(q) ||
      model.includes(q)
    );
  });
}

function sortAssignmentRows(
  rows: TechnicianVehicleAssignmentRow[],
  key: AssignmentSortKey,
  dir: 'asc' | 'desc',
): TechnicianVehicleAssignmentRow[] {
  const out = [...rows];
  const mult = dir === 'asc' ? 1 : -1;
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };
  out.sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'techName': {
        const sa = `${a.tech?.firstName ?? ''} ${a.tech?.lastName ?? ''}`.trim();
        const sb = `${b.tech?.firstName ?? ''} ${b.tech?.lastName ?? ''}`.trim();
        cmp = sa.localeCompare(sb, undefined, { sensitivity: 'base' });
        break;
      }
      case 'techFlat':
        cmp = num(a.vt?.techPercentageCalculatedAmount) - num(b.vt?.techPercentageCalculatedAmount);
        break;
      case 'rr':
        cmp = num(a.vt?.rPercentageCalculatedAmount) - num(b.vt?.rPercentageCalculatedAmount);
        break;
      case 'vin':
        cmp = String(a.vehicle?.vin ?? '').localeCompare(String(b.vehicle?.vin ?? ''), undefined, {
          sensitivity: 'base',
        });
        break;
      case 'make':
        cmp = String(a.vehicle?.make ?? '').localeCompare(String(b.vehicle?.make ?? ''), undefined, {
          sensitivity: 'base',
        });
        break;
      case 'model':
        cmp = String(a.vehicle?.model ?? '').localeCompare(String(b.vehicle?.model ?? ''), undefined, {
          sensitivity: 'base',
        });
        break;
      case 'modelYear':
        cmp = num(a.vehicle?.modelYear) - num(b.vehicle?.modelYear);
        break;
      default:
        cmp = 0;
    }
    return cmp * mult;
  });
  return out;
}

async function downloadInsuranceFile(url: string) {
  const filename = fileLabelFromInsuranceUrl(url);
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export default function ViewDetails() {
  const { isCollapsed } = useSidebar();
  const [jobData, setJobsData] = useState<any>(null);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedAssignmentKeys, setSelectedAssignmentKeys] = useState<string[]>([]);
  const [isSubmittingPaid, setIsSubmittingPaid] = useState<boolean>(false);
  const [submittingRowKey, setSubmittingRowKey] = useState<string | null>(null);
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState('');
  const [assignmentSortKey, setAssignmentSortKey] = useState<AssignmentSortKey>('techName');
  const [assignmentSortDir, setAssignmentSortDir] = useState<'asc' | 'desc'>('asc');

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isSingleTechnician = searchParams!.has('ActiveWorkOrder');
  const isSingleTechnicianWorkOrder = searchParams!.has('workorder');

  const fetchCustomerData = async (jobId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/fetchSingleJobs?jobid=${jobId}`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        setJobsData(data.jobs);  // Set the  CustomerData data
      } else {
        toast.error(data.error || 'Error fetching dent tech data');
      }
    } catch (error) {
      toast.error('An error occurred while fetching dent tech data');
    }
  };

  React.useEffect(() => {
    const type = localStorage.getItem('types');
    setUserType(type);
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const jobId = searchParams.get('jobId') || '';

    if (jobId) {
      setIsEdit(true);  // Set to true if `fetchCustomerData` exists in the URL
      fetchCustomerData(jobId);
    } else {
      setIsEdit(false);
    }
  }, []);

  useEffect(() => {
    setSelectedAssignmentKeys([]);
    setAssignmentSearchQuery('');
    setAssignmentSortKey('techName');
    setAssignmentSortDir('asc');
  }, [jobData?.id]);

  const calculateTotalCost = (jobData: any) => {
    let subtotalcost = 0;

    // Check if jobDescription exists and is an array
    if (jobData?.jobDescription && Array.isArray(jobData.jobDescription)) {
      subtotalcost = jobData.jobDescription.reduce((total: number, item: any) => {
        let parsedItem = item;

        // Only parse if item is a string
        if (typeof item === 'string') {
          try {
            parsedItem = JSON.parse(item); // Parse the stringified JSON
          } catch (error) {
            console.error("Error parsing job description:", error);
            return total; // Skip this item if parsing fails
          }
        }

        // Check if parsedItem has a cost property and is a number
        const cost = parseFloat(parsedItem?.cost || '0');
        return total + (isNaN(cost) ? 0 : cost);
      }, 0);
    }

    // Extract simpleFlatRate and amountPercentage from jobData or fallback technician
    const simpleFlatRate = parseFloat(jobData?.simpleFlatRate || '0');
    const amountPercentage = parseFloat(jobData?.amountPercentage || '0');

    const finalSimpleFlatRate = isNaN(simpleFlatRate) || simpleFlatRate <= 0
      ? parseFloat(jobData?.technicians?.[0]?.simpleFlatRate || '0')
      : simpleFlatRate;

    const finalAmountPercentage = isNaN(amountPercentage) || amountPercentage <= 0
      ? parseFloat(jobData?.technicians?.[0]?.amountPercentage || '0')
      : amountPercentage;

    // Calculate percentage amount if applicable
    const percentageAmount = (!isNaN(finalAmountPercentage) && finalAmountPercentage > 0)
      ? (subtotalcost * finalAmountPercentage) / 100
      : 0;

    // Logic: Add either simpleFlatRate or percentageAmount — whichever is greater than zero, but NOT both
    let totalCost = subtotalcost;

    if (finalSimpleFlatRate > 0) {
      totalCost += finalSimpleFlatRate;
    } else if (percentageAmount > 0) {
      totalCost += percentageAmount;
    }

    return totalCost;
  };

  const technicianVehicleAssignmentRows = useMemo(() => {
    if (!jobData) return [];
    const vehiclesRaw =
      Array.isArray(jobData.vehicles)
        ? jobData.vehicles
        : Array.isArray(jobData.technicians)
          ? jobData.technicians
          : [];
    return buildTechnicianVehicleAssignmentRows(vehiclesRaw);
  }, [jobData?.vehicles, jobData?.technicians, jobData]);

  const displayedAssignmentRows = useMemo(() => {
    const filtered = filterAssignmentRows(technicianVehicleAssignmentRows, assignmentSearchQuery);
    return sortAssignmentRows(filtered, assignmentSortKey, assignmentSortDir);
  }, [
    technicianVehicleAssignmentRows,
    assignmentSearchQuery,
    assignmentSortKey,
    assignmentSortDir,
  ]);

  if (!jobData) {
    return <div><Loading /></div>;
  }
  const getBaseBreadcrumb = () => {
    const isCompletedJob = searchParams!.has('completedJob');
    const isActiveJob = searchParams!.has('activeJob');
    const isJobStatus = searchParams!.has('jobStatus');

    if (isCompletedJob) {
      return { label: 'Completed Work Orders', href: '/jobs/complete-job/listing' };
    }

    if (isActiveJob) {
      return { label: 'Job Detail', href: '/jobs/active-job' };
    }

    if (isJobStatus) {
      const jobStatus = searchParams!.get('jobStatus');
      return {
        label: `${jobStatus?.charAt(0).toUpperCase()}${jobStatus?.slice(1)} All IFS Work Orders`,
        href: `/reporting/job-status`,
      };
    }

    if (pathname!.includes('/reporting/job-status')) {
      return { label: 'All Work Orders', href: '/reporting/job-status' };
    }

    return {
      label: isSingleTechnician ? 'Job List' : 'Single Technician Work Order',
      href: isSingleTechnician ? '/jobs/active-job' : '/single-technicians/jobs',
    };
  };

  const baseBreadcrumb = getBaseBreadcrumb();
  const backHref = baseBreadcrumb.href;

  const assignmentRowKeys = displayedAssignmentRows.map((row, index) =>
    assignmentRowKey(row.tech, row.vehicle, index),
  );
  const selectableAssignmentRowKeys = displayedAssignmentRows
    .map((row, index) => ({
      key: assignmentRowKey(row.tech, row.vehicle, index),
      isPaid: row?.vt?.paidStatus === true || row?.vt?.paid === true,
    }))
    .filter((entry) => !entry.isPaid)
    .map((entry) => entry.key);
  const allAssignmentRowsSelected =
    selectableAssignmentRowKeys.length > 0 &&
    selectableAssignmentRowKeys.every((k) => selectedAssignmentKeys.includes(k));

  const toggleAssignmentRow = (key: string) => {
    setSelectedAssignmentKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleAllAssignmentRows = () => {
    if (allAssignmentRowsSelected) setSelectedAssignmentKeys([]);
    else setSelectedAssignmentKeys([...selectableAssignmentRowKeys]);
  };

  const handleAssignmentSort = (key: AssignmentSortKey) => {
    if (key === assignmentSortKey) {
      setAssignmentSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setAssignmentSortKey(key);
      setAssignmentSortDir('asc');
    }
  };

  const applyPaidStatusToLocalRows = (rows: TechnicianVehicleAssignmentRow[]) => {
    const vehicleIds = new Set(rows.map((r) => Number(r.vehicle?.id)).filter((id) => !Number.isNaN(id)));
    const technicianIds = new Set(rows.map((r) => Number(r.tech?.id)).filter((id) => !Number.isNaN(id)));
    setJobsData((prev: any) => {
      if (!prev || !Array.isArray(prev.vehicles)) return prev;
      return {
        ...prev,
        vehicles: prev.vehicles.map((vehicle: any) => {
          const vehicleMatched = vehicleIds.has(Number(vehicle?.id));
          if (!vehicleMatched || !Array.isArray(vehicle.assignedTechnicians)) return vehicle;
          return {
            ...vehicle,
            assignedTechnicians: vehicle.assignedTechnicians.map((tech: any) => {
              if (!technicianIds.has(Number(tech?.id))) return tech;
              return {
                ...tech,
                VehicleTechnician: { ...(tech?.VehicleTechnician || {}), paidStatus: true, paidAt: new Date().toISOString() },
                UserJob: { ...(tech?.UserJob || {}), paidStatus: true, paidAt: new Date().toISOString() },
              };
            }),
          };
        }),
      };
    });
  };

  const markRowsAsPaid = async (rows: TechnicianVehicleAssignmentRow[]) => {
    if (!rows.length) {
      toast.error('No rows available to mark as paid.');
      return false;
    }
    const jobId = Number(jobData?.id);
    if (!jobId) {
      toast.error('Job ID missing.');
      return false;
    }

    const items = Array.from(
      new Map(
        rows
          .map((r) => ({
            vehicleId: Number(r.vehicle?.id),
            technicianId: Number(r.tech?.id),
          }))
          .filter((item) => !Number.isNaN(item.vehicleId) && !Number.isNaN(item.technicianId))
          .map((item) => [`${item.vehicleId}-${item.technicianId}`, item]),
      ).values(),
    );

    if (!items.length) {
      toast.error('Vehicle/technician IDs missing for selected rows.');
      return false;
    }

    try {
      setIsSubmittingPaid(true);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/markVehicleTechnicianPaid', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jobId,
          paid: true,
          items,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status === false) {
        throw new Error(data?.message || data?.error || 'Failed to mark payment as paid');
      }

      applyPaidStatusToLocalRows(rows);
      await fetchCustomerData(String(jobId));
      toast.success('Payment marked as paid successfully.');
      return true;
    } catch (error: any) {
      toast.error(error?.message || 'Error while marking payment as paid.');
      return false;
    } finally {
      setIsSubmittingPaid(false);
    }
  };

  const handleMarkTechniciansPaid = async () => {
    if (selectedAssignmentKeys.length === 0) {
      toast.error('Please select at least one dent tech first.');
      return;
    }

    const rowsToMark = displayedAssignmentRows.filter((row, index) =>
      selectedAssignmentKeys.includes(assignmentRowKey(row.tech, row.vehicle, index)),
    );
    if (!rowsToMark.length) {
      toast.error('Please select at least one dent tech first.');
      return;
    }

    const result = await Swal.fire({
      title: 'Mark all payments as paid?',
      html: `
        <p style="margin:0;font-size:15px;line-height:1.65;color:#4b5563;text-align:center">
          Are you sure you want to mark <strong style="color:#111827;font-weight:600">all dent tech payments</strong> as paid for this job?
        </p>
      `,
      icon: 'question',
      iconColor: '#383d71',
      showCancelButton: true,
      focusCancel: true,
      confirmButtonColor: '#383d71',
      cancelButtonColor: '#e5e7eb',
      confirmButtonText: 'Yes, mark paid',
      cancelButtonText: 'No',
      width: 460,
      backdrop: 'rgba(15, 23, 42, 0.55)',
      buttonsStyling: true,
      customClass: {
        popup: 'swal-job-paid-confirm',
      },
    });
    if (result.isConfirmed) {
      const ok = await markRowsAsPaid(rowsToMark);
      if (ok) setSelectedAssignmentKeys([]);
    }
  };

  const handleSingleRowMarkPaid = async (row: TechnicianVehicleAssignmentRow, rowKey: string) => {
    setSubmittingRowKey(rowKey);
    try {
      await markRowsAsPaid([row]);
    } finally {
      setSubmittingRowKey(null);
    }
  };

  const SortTh = ({ columnKey, label }: { columnKey: AssignmentSortKey; label: string }) => (
    <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 -mx-1 text-left font-semibold text-gray-700 hover:bg-gray-100 hover:text-[#383d71] transition-colors"
        onClick={() => handleAssignmentSort(columnKey)}
        aria-sort={
          assignmentSortKey === columnKey
            ? assignmentSortDir === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none'
        }
      >
        <span>{label}</span>
        {assignmentSortKey === columnKey ? (
          <span className="text-[#383d71]" aria-hidden>
            {assignmentSortDir === 'asc' ? '↑' : '↓'}
          </span>
        ) : (
          <span className="text-gray-300 font-normal" aria-hidden>
            ↕
          </span>
        )}
      </button>
    </th>
  );

  const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-100">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#383d71]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <div className="text-gray-900">{value}</div>
      </div>
    </div>
  );

  return (
    <div className={`mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          getBaseBreadcrumb(),
          isEdit ? { label: 'View Details' } : { label: 'Create Technician', href: '/technicians/create-technician' },
        ]}
      />

      <div className="mx-auto">
        {/* Header: back + View Details */}
        {/* <div className="flex items-center gap-3 mb-4">
          <Link href={backHref} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <svg className="w-8 h-8 bg-[#383d71] text-white rounded-lg p-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span className="font-semibold text-lg">View Details</span>
          </Link>
        </div> */}

        {/* Job Detail section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center gap-2 bg-[#1e3e6f] text-white px-6 py-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span className="font-bold text-base">Job Detail</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            <InfoCard icon={<span className="text-sm font-bold">#</span>} label="Job ID" value={jobData?.id ?? '–'} />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              label="Job Title"
              value={jobData?.jobName || '–'}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              label="Customer Name"
              value={<span className="capitalize">{jobData?.customer?.fullName || '–'}</span>}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              label="Customer Email"
              value={<a className="hover:underline text-[#383d71]" href={`mailto:${jobData?.customer?.email}`}>{jobData?.customer?.email || 'N/A'}</a>}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
              label="Customer Ph. Number"
              value={<a className="hover:underline text-[#383d71]" href={`tel:${jobData?.customer?.phoneNumber}`}>{jobData?.customer?.phoneNumber || 'N/A'}</a>}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A7 7 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              label="Technician Name"
              value={<span className="capitalize">{`${jobData?.technician?.firstName || ''} ${jobData?.technician?.lastName || ''}`.trim() || 'N/A'}</span>}
            />
            {isSingleTechnician && (
              <InfoCard
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A7 7 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                label="Manager Name"
                value={<span className="capitalize">{`${jobData?.manager?.firstName || ''} ${jobData?.manager?.lastName || ''}`.trim() || 'N/A'}</span>}
              />
            )}
            {isSingleTechnician && (
              <InfoCard
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                label="Manager Ph. Number"
                value={<a className="hover:underline text-[#383d71]" href={`tel:${jobData?.manager?.phoneNumber}`}>{jobData?.manager?.phoneNumber || 'N/A'}</a>}
              />
            )}
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              label="Start Date"
              value={jobData?.startDate ? new Date(jobData.startDate).toLocaleDateString() : '–'}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              label="End Date"
              value={jobData?.endDate ? new Date(jobData.endDate).toLocaleDateString() : '–'}
            />
            {/* <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Vehicle Price"
              value={`$${jobData?.estimatedCost ?? '0'}`}
            /> */}
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              label="Created By"
              value={jobData?.createdBy || '–'}
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              label="Estimated By"
              value={jobData?.estimatedBy || '–'}
            />
            {isSingleTechnician && (
              <InfoCard
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1a5.002 5.002 0 01-4.546-2.916M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                label="Vehicle Type Pricing"
                value={
                  Array.isArray(jobData?.vehicleTypePricing) && jobData.vehicleTypePricing.length > 0 ? (
                    <div className="space-y-1 grid grid-cols-3">
                      {jobData.vehicleTypePricing.map((item: any, index: number) => (
                        <div key={`${item?.vehicleType || 'type'}-${index}`} className="text-sm">
                          <span className="font-medium">{item?.vehicleType || 'Vehicle'}</span>: ${item?.amount ?? 0}
                        </div>
                      ))}
                    </div>
                  ) : '–'
                }
              />
            )}
            {jobData?.insurancePercentage && (
              <InfoCard
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11h10M7 15h6M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-3.172a2 2 0 01-1.414-.586l-.828-.828A2 2 0 0012.172 3H11.83a2 2 0 00-1.414.586l-.828.828A2 2 0 018.172 5H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                label="Insurance Percentage"
                value={jobData?.insurancePercentage ? `${jobData.insurancePercentage}%` : '–'}
              />
            )}
            {parseInsuranceFileUrls(jobData?.insuranceFile).length > 0 && (
              <InfoCard
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.656-5.656L5.757 10.76a6 6 0 108.486 8.485L20.5 13" /></svg>}
                label="Insurance File"
                value={
                  <ul className="space-y-2">
                    {parseInsuranceFileUrls(jobData.insuranceFile).map((url, idx) => {
                      const label = fileLabelFromInsuranceUrl(url);
                      return (
                        <li key={`${url}-${idx}`}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#383d71] font-medium hover:underline break-all"
                            onClick={(e) => {
                              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                              e.preventDefault();
                              void downloadInsuranceFile(url);
                            }}
                          >
                            {label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                }
              />
            )}
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
              label="Job Status"
              value={
                <span className={jobData?.jobStatus ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                  {jobData?.jobStatus ? 'Completed' : 'Inprogress'}
                </span>
              }
            />
            <InfoCard
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              label="Notes"
              value={jobData?.notes || '–'}
            />
          </div>
        </div>

        {/* Vehicle List */}
        <div className="shadow-lg p-4 bg-white rounded-lg mt-4 mb-5">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-bold rounded-t-lg m-0">Tech and assigned vehicles report</h3>
              <div className="flex flex-row gap-3">
                <div className="w-[500px]">
                  <label htmlFor="assignment-table-search" className="sr-only">
                    Search tech and vehicles
                  </label>
                  <input
                    id="assignment-table-search"
                    type="search"
                    value={assignmentSearchQuery}
                    onChange={(e) => setAssignmentSearchQuery(e.target.value)}
                    placeholder="Search by dent tech name, VIN, make, or model…"
                    autoComplete="off"
                    className="w-full max-w-xl rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 shadow-sm focus:border-[#383d71] focus:outline-none focus:ring-2 focus:ring-[#383d71]/25"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleMarkTechniciansPaid}
                  disabled={isSubmittingPaid}
                  className="primary-bg shrink-0 px-5 py-2 rounded text-white font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingPaid ? 'Updating...' : 'Mark as paid'}
                </button>
              </div>

            </div>

          </div>
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-b-lg shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-12 text-left text-sm font-semibold text-gray-700 px-4 py-3">
                    {selectableAssignmentRowKeys.length > 0 ? (
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-[#383d71] focus:ring-[#383d71]"
                        checked={allAssignmentRowsSelected}
                        onChange={toggleAllAssignmentRows}
                        aria-label="Select all visible rows"
                      />
                    ) : null}
                  </th>
                  <SortTh columnKey="techName" label="Assigned Dent Tech" />
                  <SortTh columnKey="techFlat" label="Tech Flat Rate" />
                  <SortTh columnKey="rr" label="R&I" />
                  <SortTh columnKey="vin" label="VIN" />
                  <SortTh columnKey="make" label="Make" />
                  <SortTh columnKey="model" label="Model" />
                  <SortTh columnKey="modelYear" label="Model Year" />
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Tech Payment Status</th>
                  <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3">Invoice Status</th>
                  <th className="text-right text-sm font-semibold text-gray-700 px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {technicianVehicleAssignmentRows.length > 0 ? (
                  displayedAssignmentRows.length > 0 ? (
                    displayedAssignmentRows.map((row, index) => {
                      const { tech, vehicle, vt } = row;
                      const key = assignmentRowKey(tech, vehicle, index);
                      const isPaid = vt?.paidStatus === true || vt?.paid === true;
                      return (
                        <tr key={key} className="hover:bg-gray-50/50">
                          <td className="px-4 py-4 align-middle">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-[#383d71] focus:ring-[#383d71]"
                              checked={selectedAssignmentKeys.includes(key)}
                              disabled={isPaid}
                              onChange={() => toggleAssignmentRow(key)}
                              aria-label={`Select row ${tech?.firstName ?? ''} ${vehicle?.vin ?? ''}`}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">

                              <span
                                className={`capitalize font-medium ${tech?.deletedStatus
                                    ? "text-red-600"
                                    : "text-gray-900"
                                  }`}
                              >
                                {`${tech?.firstName ?? ''} ${tech?.lastName ?? ''}`.trim() || '–'}
                              </span>

                              {tech?.deletedStatus && (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                                  Deleted Tech
                                </span>
                              )}

                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {vt?.techPercentageCalculatedAmount != null && vt.techPercentageCalculatedAmount !== '' ? (
                              <div>${vt.techPercentageCalculatedAmount}</div>
                            ) : (
                              '–'
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {vt?.rPercentageCalculatedAmount != null && vt.rPercentageCalculatedAmount !== '' ? (
                              <div>${vt.rPercentageCalculatedAmount}</div>
                            ) : (
                              '–'
                            )}
                          </td>
                          <td className="px-6 py-4">{vehicle?.vin ?? '–'}</td>
                          <td className="px-6 py-4">{vehicle?.make ?? 'N/A'}</td>
                          <td className="px-6 py-4">{vehicle?.model ?? '–'}</td>
                          <td className="px-6 py-4">{vehicle?.modelYear ?? '–'}</td>
                          <td className="px-6 py-4">
                            {isPaid ? (
                              <span className="inline-flex items-center rounded bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700">
                                Paid
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSingleRowMarkPaid(row, key)}
                                disabled={isSubmittingPaid}
                                className="primary-bg pl-5 pr-5 p-2 rounded cursor-pointer text-white disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {submittingRowKey === key ? 'Updating...' : 'Unpaid'}
                              </button>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {(() => {
                              const invoiceStatus = vehicle?.invoice?.[0]?.status?.toLowerCase();

                              const isPaid = invoiceStatus === 'paid';

                              return (
                                <span
                                  className={`inline-flex items-center rounded px-3 py-1.5 text-sm font-medium ${isPaid
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}
                                >
                                  {isPaid ? 'Paid' : 'Unpaid'}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/vehicle/view?vehicleId=${vehicle?.id}`}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-[#000] transition-colors"
                              data-tooltip-id="view-vehicle"
                              data-tooltip-content="View vehicle"
                            >
                              <Image alt="View" src={Eye} className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-gray-500">
                        No rows match your search. Try another dent tech name, VIN, make, or model.
                      </td>
                    </tr>
                  )
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-500"><Empty /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <Tooltip id="view-vehicle" place="top" />
        <ToastContainer />
        {previewImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setPreviewImage(null)} // Close on backdrop click
          >
            <img src={previewImage} alt="Preview" className="max-w-[90%] max-h-[90%] rounded shadow-lg" />
          </div>
        )}
      </div>
    </div>
  );
}
