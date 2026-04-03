// components/JobTable.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import Pagination from '../../component/pagination';
import axios from 'axios';
import Swal from 'sweetalert2';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSidebar } from "@/app/component/SidebarContext";
import { Tooltip } from 'react-tooltip';

import Papa from 'papaparse';
import Link from 'next/link';
import Image from 'next/image';
import Eye from '../../../../public/eye.svg';
import { FormControl, FormLabel, TextField } from '@mui/material';
import InvoiceGenerator from '@/app/component/invoice-genrated';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

function escapeHtmlForSwal(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Mismatch vehicle type (used by helpers below) ───────────────────────────
interface MismatchVehicle {
  vin: string;
  make: string;
  model: string;
}
interface MismatchData {
  missingInScanned: MismatchVehicle[];
  missingInInsurance: MismatchVehicle[];
}

const INSURANCE_PAGE_LIMIT = 500;

function normalizeVinKey(vin: unknown): string {
  if (vin == null) return '';
  return String(vin).trim().replace(/\s+/g, '').toUpperCase();
}

/** Same normalization as vehicle create: insurance percentage jobs only. */
function isInsuranceJobTypeForInvoice(jobType: unknown): boolean {
  const s = String(jobType || '')
    .toLowerCase()
    .replace(/_/g, '')
    .replace(/-/g, '')
    .replace(/\s+/g, '');
  return s === 'insurancepercentage';
}

function vehicleToMismatchRow(v: Record<string, unknown>): MismatchVehicle {
  return {
    vin: String(v?.vin ?? ''),
    make: String(v?.make ?? ''),
    model: String(v?.model ?? ''),
  };
}

function computeVinMismatch(selectedJobs: any[], insuranceVehicles: any[]): MismatchData {
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

async function fetchAllInsuranceVehiclesByJob(jobId: string, token: string): Promise<any[]> {
  let page = 1;
  let all: any[] = [];
  let hasMore = true;
  while (hasMore) {
    const url = `${apiUrl}/fetchInsuranceVehiclesByJob?jobId=${encodeURIComponent(jobId)}&page=${page}&limit=${INSURANCE_PAGE_LIMIT}`;
    const response = await axios.get(url, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const data = response.data;
    const newVehicles =
      data?.jobs?.vehicles ??
      data?.response?.vehicles ??
      data?.vehicles ??
      [];
    const arr = Array.isArray(newVehicles) ? newVehicles : [];
    all = [...all, ...arr];
    const totalPages = data?.jobs?.totalPages ?? data?.response?.totalPages ?? data?.totalPages;
    if (totalPages != null && totalPages !== '') {
      hasMore = page < Number(totalPages);
    } else {
      hasMore = arr.length >= INSURANCE_PAGE_LIMIT;
    }
    page += 1;
    if (!hasMore) break;
  }
  return all;
}

// ─── Modal 2: Missing Vehicles detail ────────────────────────────────────────
const MissingVehiclesModal: React.FC<{
  mismatchData: MismatchData;
  onClose: () => void;
  onProceed: () => void;
}> = ({ mismatchData, onClose, onProceed }) => {
  const [activeTab, setActiveTab] = useState<'scanned' | 'insurance'>('scanned');
  const rows = activeTab === 'scanned' ? mismatchData.missingInScanned : mismatchData.missingInInsurance;
  const scannedCount = mismatchData.missingInScanned.length;
  const insuranceCount = mismatchData.missingInInsurance.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Vehicle Mismatches</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Review the vehicles that don&apos;t match between the two lists.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex rounded-full bg-gray-100 p-1 gap-1">
            <button
              onClick={() => setActiveTab('scanned')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === 'scanned' ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Missing in Scanned ({scannedCount})
            </button>
            <button
              onClick={() => setActiveTab('insurance')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === 'insurance' ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Missing in Insurance ({insuranceCount})
            </button>
          </div>
        </div>

        <p className="px-6 mt-4 text-sm text-gray-500">
          {activeTab === 'scanned'
            ? 'These vehicles appear in the insurance list but were not found in the scanned vehicles.'
            : 'These vehicles appear in the scanned list but were not found in the insurance list.'}
        </p>

        {/* Table */}
        <div className="px-6 mt-3 max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-700 w-[45%]">VIN</th>
                <th className="text-left py-2 font-medium text-gray-700 w-[25%]">Make</th>
                <th className="text-left py-2 font-medium text-gray-700 w-[30%]">Model</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={3} className="py-6 text-center text-gray-400">No vehicles found</td></tr>
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

        {/* Footer */}
        <div className="flex gap-3 px-6 py-5">
          <button onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onProceed} className="flex-1 py-2.5 px-4 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors">
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal 1: Mismatch Detected ──────────────────────────────────────────────
const VehicleMismatchAlert: React.FC<{
  mismatchData: MismatchData;
  onProceed: () => void;
  onCancel: () => void;
  /** Refetch insurance list + recompute VIN mismatch (superadmin insurance job flow). */
  onViewMissingVehicles: () => Promise<void>;
}> = ({ mismatchData, onProceed, onCancel, onViewMissingVehicles }) => {
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const scannedCount = mismatchData.missingInScanned.length;
  const insuranceCount = mismatchData.missingInInsurance.length;

  return (
    <>
      {!showMissingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Vehicle Mismatch Detected</h2>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              There are differences between the scanned vehicles and the uploaded insurance vehicle list.
            </p>
            <div className="space-y-2 mb-5">
              {scannedCount > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-700">
                    <span className="font-semibold">{scannedCount}</span> vehicle(s) in insurance list but NOT in scanned list
                  </span>
                </div>
              )}
              {insuranceCount > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-700">
                    <span className="font-semibold">{insuranceCount}</span> vehicle(s) in scanned list but NOT in insurance list
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
              className="w-full py-3 px-4 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {viewLoading ? 'Loading…' : 'View Missing Vehicles'}
            </button>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={onProceed} className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      {showMissingModal && (
        <MissingVehiclesModal
          mismatchData={mismatchData}
          onClose={() => setShowMissingModal(false)}
          onProceed={onProceed}
        />
      )}
    </>
  );
};

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface VehcileInfo {
  id: string;
  jobName: string;
  name: string;
  email: string;
  pdr: string;
  deletedStatus?: boolean;
  generatedInvoiceDate: string;
  Role: { name: string };
}

const JobTable: React.FC = () => {
  const [activeJob, setActiveJob] = useState<any[]>([]);
  const [dentTechTotalAmount, setDentTechTotalAmount] = useState<any[]>([]);
  const [rRTotalAmount, setRRTotalAmount] = useState<any[]>([]);
  const [totalEstimateAmount, setTotalEstimateAmount] = useState<any[]>([]);
  const [totalJobAmount, setTotalJobAmount] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isCollapsed } = useSidebar();
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [roleType, setRoleType] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState<string>('');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('');
  const [pdrValues, setPdrValues] = useState<Record<string, string>>({});
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [customerJobs, setCustomerJobs] = useState<any[]>([]);
  const [originalJobs, setOriginalJobs] = useState<any[]>([]);
  const [invoiceDates, setInvoiceDates] = useState<Record<string, string>>({});
  const [pdrErrors, setPdrErrors] = useState<{ [vehicleId: string]: string }>({});
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  // ─── Mismatch modal state ─────────────────────────────────────────────────
  const [showMismatchAlert, setShowMismatchAlert] = useState(false);
  const [mismatchData, setMismatchData] = useState<MismatchData>({
    missingInScanned: [],
    missingInInsurance: [],
  });
  // Store pending invoice call args so "Proceed Anyway" can trigger it
  const [pendingInvoiceArgs, setPendingInvoiceArgs] = useState<{
    isPrint: boolean;
    selectedJobs: any[];
    token: string | null;
    roleType: string;
    userId: string | null;
  } | null>(null);
  /** When true, "View Missing Vehicles" refetches insurance vehicles and recomputes VIN mismatch. */
  const [mismatchUseInsuranceCompare, setMismatchUseInsuranceCompare] = useState(false);

  const handlePdrChange = (jobId: string, value: string) => {
    setPdrValues(prev => ({ ...prev, [jobId]: value }));
    if (value && !isNaN(Number(value))) {
      setPdrErrors(prev => ({ ...prev, [jobId]: '' }));
    }
  };

  useEffect(() => {
    const storedRoleType = localStorage.getItem('types');
    setRoleType(storedRoleType);
  }, []);

  const handleSearch = (searchTerm: string) => { console.log('Searching for:', searchTerm); };

  const handleDeleteSuccess = (deletedId: string) => {
    setActiveJob((prev) => prev.filter((cust) => cust.id !== deletedId));
  };

  const fetchJobs = async (page = 1, query = '', limit = pageSize) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types') || "";
      const userId = localStorage.getItem('userID');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoint = query.trim()
        ? roleType === 'superadmin' || roleType === 'manager'
          ? `${apiUrl}/searchVehicalInfo?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
          : `${apiUrl}/searchVehicalInfo?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : roleType === 'superadmin' || roleType === 'manager'
          ? `${apiUrl}/fetchInVoiceVehicleInfo?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`
          : `${apiUrl}/fetchInVoiceVehicleInfo?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;

      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();

      if (response.ok) {
        const fetchedTechnicians: VehcileInfo[] = query.trim()
          ? data.data.vehicles || []
          : data.response.vehicles || [];

        const initialPdrValues: Record<string, string> = {};
        const initialInvoiceDates: Record<string, string> = {};
        fetchedTechnicians.forEach(job => {
          if (job.pdr) initialPdrValues[job.id] = job.pdr.toString();
          if (job.generatedInvoiceDate) {
            const date = new Date(job.generatedInvoiceDate);
            initialInvoiceDates[job.id] = date.toISOString().split('T')[0];
          }
        });
        setPdrValues(initialPdrValues);
        setInvoiceDates(initialInvoiceDates);

        const updatedJobs = customerFilter ? [...fetchedTechnicians, ...customerJobs] : fetchedTechnicians;
        setOriginalJobs(updatedJobs);
        setActiveJob(updatedJobs);
        setDentTechTotalAmount(data.response?.totalDantTechCost ?? data.data.totalDantTechCost ?? '0');
        setRRTotalAmount(data.response?.totalRrCost ?? data.data.totalRrCost ?? '0');
        setTotalEstimateAmount(data.response?.totalEstimateCost ?? data.data.totalEstimateCost ?? '0');
        setTotalJobAmount(data.response?.totalJobEstimateCost ?? data.data.totalJobEstimateCost ?? '0');
        setTotalPages(data.response?.totalPages || 1);
        setTotalJobs(data.response?.totalVehicles ?? data.data.totalVehicles ?? '0');
      } else {
        if (data.error === 'Invalid Token') router.push('/');
        else console.error('Error fetching job data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => { fetchJobs(currentPage, searchTerm, pageSize); }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, pageSize]);

  const handleSort = (column: string) => {
    const direction = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(direction);
    setSortBy(column);
    setActiveJob(prevJobs => {
      return [...prevJobs].sort((a, b) => {
        if (column === 'jobName') {
          const nameA = a?.jobName || ''; const nameB = b?.jobName || '';
          return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        if (column === 'fullName') {
          const nameA = a?.customer?.fullName || ''; const nameB = b?.customer?.fullName || '';
          return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        const valueA = a[column] || ''; const valueB = b[column] || '';
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }
        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    });
  };

  const handlePageChange = (data: { selected: number }) => { setCurrentPage(data.selected + 1); };

  const [permissions, setPermissions] = useState<any[]>([]);
  useEffect(() => {
    const storedPermissions = localStorage.getItem("permissions");
    if (storedPermissions) {
      try {
        const parsedPermissions = JSON.parse(storedPermissions);
        setPermissions(Array.isArray(parsedPermissions) ? parsedPermissions : []);
      } catch (error) { console.error("Failed to parse permissions:", error); }
    }
  }, []);

  const hasPermission = (action: string) => {
    if (permissions.length === 0) return true;
    return permissions.some((perm) => perm.permissionName === 'Activejobs' && perm.action === action && perm.isActive);
  };
  const canCreate = hasPermission("approve");

  const downloadCSV = () => {
    const selectedJobs = activeJob.filter(c => selectedIds.includes(c.id));
    if (selectedJobs.length === 0) { toast.error("Please select at least one work order to export."); return; }
    const csvOptions = { filename: 'Invoice', fieldSeparator: ',', quoteStrings: '"', decimalSeparator: '.', showLabels: true, showTitle: true, title: 'Invoice', useTextFile: false, useBom: true, useKeysAsHeaders: true };
    const csvExporter = new ExportToCsv(csvOptions);
    const formattedData = selectedJobs.map((jobData) => {
      const technicianRates = jobData.assignedTechnicians.map((tech: any) => {
        const vt = tech.VehicleTechnician || {};
        return `${tech.firstName} ${tech.lastName} - TechnicianFlatRate: ${vt.techFlatRate || ''}, RIRR: ${vt.rRate || ''}`;
      }).join(', ');
      return {
        id: jobData.id, vin: jobData.vin, customer: `${jobData?.customer?.fullName}`, jobName: jobData.jobName,
        assignCustomer: jobData?.customer?.id, bodyClass: jobData.bodyClass, color: jobData.color, make: jobData.make,
        model: jobData.model, vehicleType: jobData.vehicleType, modelYear: jobData.modelYear,
        vehicleDescriptor: jobData.vehicleDescriptor, manufacturerName: jobData.manufacturerName,
        plantCompanyName: jobData.plantCompanyName, plantCountry: jobData.plantCountry, plantState: jobData.plantState,
        deletedStatus: jobData.deletedStatus, notes: jobData.notes,
        technicians: jobData.assignedTechnicians.map((tech: any) => `${tech.firstName} ${tech.lastName}`).join(', '),
        assignTechnicians: jobData.assignedTechnicians.map((techId: any) => `${techId.id}`).join(', '),
        jobDescription: jobData.jobDescription.join(''), technicianRates,
      };
    });
    csvExporter.generateCsv(formattedData);
  };

  const handleImportCSV = (file: File) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const reader = new FileReader();
    reader.onload = async (e) => {
      let text = (e.target?.result as string).replace(/^\uFEFF/, '').trimStart();
      const manualHeaders = ['id', 'vin', 'customer', 'jobName', 'assignCustomer', 'bodyClass', 'color', 'make', 'model', 'vehicleType', 'modelYear', 'vehicleDescriptor', 'manufacturerName', 'plantCompanyName', 'plantCountry', 'plantState', 'deletedStatus', 'notes', 'technicians', 'assignTechnicians', 'jobDescription', 'technicianRates'];
      Papa.parse(text, {
        header: false, skipEmptyLines: true,
        complete: async (result) => {
          const rows = result.data as string[][];
          const cleanedData = rows.slice(1).map((row) => {
            const obj: any = {};
            manualHeaders.forEach((key, idx) => { let value = row[idx]; value = typeof value === 'string' ? value.trim() : value; obj[key] = value; });
            return obj;
          }).filter((row) => { const isHeaderRow = Object.entries(row).every(([key, val]) => key === val); const hasData = Object.values(row).some((val) => val && val !== ''); return !isHeaderRow && hasData; });
          try {
            const payloadData = cleanedData.map(row => {
              const technicianNames = row.technicians ? row.technicians.split(',').map((name: any) => name.trim()) : [];
              const technicianIds = row.assignTechnicians ? row.assignTechnicians.split(',').map((id: any) => id.trim()) : [];
              const rateChunks = row.technicianRates ? row.technicianRates.match(/([^-]+- TechnicianFlatRate:\s*[^,]*, RIRR:\s*[^,]*)(?=, [^-]+- TechnicianFlatRate:|$)/g) : [];
              const technicians = technicianNames.map((name: any, index: number) => {
                let techFlatRate = '', rRate = '';
                if (rateChunks && rateChunks[index]) { const match = rateChunks[index].match(/- TechnicianFlatRate:\s*(.*?), RIRR:\s*(.*)/); techFlatRate = match?.[1]?.trim() || ''; rRate = match?.[2]?.trim() || ''; }
                return { id: technicianIds[index] || null, name, techFlatRate, rRate };
              });
              const jobDescriptions = row.jobDescription ? row.jobDescription.split(',').map((desc: any) => desc.trim()) : [];
              return { ...row, technicians, jobDescription: jobDescriptions, assignTechnicians: undefined };
            }).filter(row => !manualHeaders.some(header => row[header] === header));
            await axios.post(`/api/importVehicle`, { data: payloadData }, { headers });
            toast.success('CSV Import Successful!');
            fetchJobs(currentPage, searchTerm, pageSize);
          } catch (error: unknown) {
            if (axios.isAxiosError(error)) toast.error(error.response?.data?.error || error.message);
            else if (error instanceof Error) toast.error(error.message);
            else toast.error('An unknown error occurred');
          }
          setLoading(false);
        },
        error: (err: any) => { toast.error('Error parsing CSV file'); setLoading(false); },
      });
    };
    reader.readAsText(file);
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDateChange = async (dateRange: [Date, Date] | null) => {
    const token = localStorage.getItem('token');
    const roleType = localStorage.getItem('types') || "";
    const userId = localStorage.getItem('userID');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const formatDate = (date: Date) => { const day = date.getDate().toString().padStart(2, '0'); const month = (date.getMonth() + 1).toString().padStart(2, '0'); const year = date.getFullYear(); return `${day}-${month}-${year}`; };
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = formatDate(dateRange[0]); const endDate = formatDate(dateRange[1]);
      try {
        setLoading(true);
        let apiPoint = `${apiUrl}/vehicleFilter?roleType=${encodeURIComponent(roleType)}`;
        const requestBody: { [key: string]: any } = { startDate, endDate, roleType, vehicleStatus: 'false' };
        if (roleType !== 'superadmin' && roleType !== 'manager') requestBody.technicianId = userId;
        const response = await axios.post(apiPoint, requestBody, { headers: { 'Authorization': `Bearer ${token}` } });
        setActiveJob(response.data.vehicles.updatedVehicles);
      } catch (error) { console.error("Error fetching filtered jobs:", error); } finally { setLoading(false); }
    }
  };

  const handleNewJobClick = async (jobId: string) => {
    setSelectedJobFilter(jobId); setSelectedCustomer('');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');
    const roleType = localStorage.getItem('types') || "";
    if (!jobId) { fetchJobs(currentPage, searchTerm, pageSize); return; }
    const payload = { roleType, jobId };
    try {
      if (!token) return;
      const response = await fetch(`${apiUrl}/vehicleJobNameFilter`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (response.ok) {
        setOriginalJobs(data.vehicles.updatedVehicles);
        const filteredJobs = data.vehicles.updatedVehicles.filter((job: any) => selectedStatus === 'completed' ? job.vehicleStatus === true : selectedStatus === 'inProgress' ? job.vehicleStatus === false : true);
        setDentTechTotalAmount(data.vehicles?.totalDantTechCost);
        setRRTotalAmount(data.vehicles?.totalRrCost);
        setTotalEstimateAmount(data.vehicles?.totalEstimateCost);
        setTotalJobAmount(data.vehicles?.totalJobEstimateCost || '0');
        setActiveJob(filteredJobs);
      }
    } catch (error) { console.error("Error during API request:", error); }
  };

  const fetchCustomerData = async (customerId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`/api/customerJobNamefetch?customerId=${encodeURIComponent(customerId)}`, { method: 'GET', headers });
      const data = await response.json();
      if (response.ok) {
        return { jobs: data.jobs || [], vehicles: data.jobs?.flatMap((job: any) => job.vehicles) || [], allTechnicians: data.jobs?.flatMap((job: any) => job.technicians) || [] };
      } else { toast.error(data.error || 'Error fetching customer data'); return { jobs: [], vehicles: [], allTechnicians: [] }; }
    } catch (error) { toast.error('An error occurred while fetching customer data'); return { jobs: [], vehicles: [], allTechnicians: [] }; }
  };

  const handleNewCustomerClick = async (customerId: string) => {
    setSelectedCustomer(customerId); setSelectedJobFilter('');
    if (!customerId) { fetchJobs(currentPage, searchTerm, pageSize); return; }
    try {
      setLoading(true);
      const { jobs, vehicles } = await fetchCustomerData(customerId);
      setCustomerJobs(vehicles); setActiveJob(vehicles);
    } catch (error) { toast.error("Failed to load customer data"); } finally { setLoading(false); }
  };

  const handleStatusChange = (status: string) => { setSelectedStatus(status); };

  const handleClearFilters = () => {
    setSelectedJobFilter(''); setSelectedCustomer(''); setSelectedStatus(''); setSearchTerm(''); setCurrentPage(1);
    fetchJobs(1, '', pageSize);
  };

  useEffect(() => {
    if (selectedStatus === '') { setActiveJob(originalJobs); }
    else {
      const filtered = originalJobs.filter(job => {
        if (selectedStatus === 'completed') return job.vehicleStatus === true;
        else if (selectedStatus === 'inProgress') return job.vehicleStatus === false;
        return true;
      });
      setActiveJob(filtered);
    }
  }, [selectedStatus, originalJobs]);

  const handleSavePdr = async (vehicleId: string, pdrValue: string) => {
    const token = localStorage.getItem('token'); const roleType = localStorage.getItem('types') || ""; const userId = localStorage.getItem('userID');
    try {
      const dateToUse = invoiceDates[vehicleId] || new Date().toISOString().split('T')[0];
      const payload = [{ vehicleId, pdr: pdrValue ? Number(pdrValue) : null, generatedInvoiceDate: dateToUse, roleType, userId }];
      const response = await fetch(`${apiUrl}/updateVehiclePdr`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('Failed to update PDR');
      toast.success("vehicles updated successfully!");
      if (selectedJobFilter) handleNewJobClick(selectedJobFilter);
      else if (selectedCustomer) handleNewCustomerClick(selectedCustomer);
      else fetchJobs(currentPage, searchTerm, pageSize);
    } catch (error) { console.error('Error updating PDR:', error); }
  };

  const handleDateAutoSave = async (vehicleId: string, dateValue: string) => {
    const token = localStorage.getItem('token'); const roleType = localStorage.getItem('types') || ""; const userId = localStorage.getItem('userID');
    setInvoiceDates(prev => ({ ...prev, [vehicleId]: dateValue }));
    try {
      const payload = [{ vehicleId, pdr: pdrValues[vehicleId] ? Number(pdrValues[vehicleId]) : null, generatedInvoiceDate: dateValue, roleType, userId }];
      const response = await fetch(`${apiUrl}/updateVehiclePdr`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('Failed to update date');
      toast.success("Date updated successfully!");
      if (selectedJobFilter) handleNewJobClick(selectedJobFilter);
      else if (selectedCustomer) handleNewCustomerClick(selectedCustomer);
      else fetchJobs(currentPage, searchTerm, pageSize);
    } catch (error) { toast.error('Failed to update date'); }
  };

  // ─── Internal invoice API caller (shared by direct path & "Proceed Anyway") ──
  const _callInvoiceApi = async (
    isPrint: boolean,
    selectedJobs: any[],
    token: string | null,
    roleType: string,
    userId: string | null
  ) => {
    try {
      if (!isPrint) setIsGeneratingInvoice(true);
      const payload = {
        vehicles: selectedJobs.map(job => ({
          vehicleId: job.id,
          jobId: job.jobId || job.id,
          customerId: job.customer?.id,
          roleType,
          userId,
          generatedInvoiceStatus: true,
          ...(isPrint && { print: 'print' }),
          ...(isPrint && { generatedInvoiceStatus: false }),
        })),
      };
      const response = await axios.post(`${apiUrl}/createInvoice`, payload, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (response.data) {
        toast.success('Invoice generated successfully!');
        const pdfLink = response.data.invoice.invoiceUrl;
        if (isPrint) {
          window.open(pdfLink, '_blank');
        } else {
          const subject = 'Your Invoice is Ready';
          const body = `Dear Customer,\n\nPlease find your invoice below:\n\n${pdfLink}\n\nBest regards.`;
          window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }
        fetchJobs(currentPage, searchTerm, pageSize);
      } else {
        toast.error(response.data.message || 'Failed to generate invoice');
      }
    } catch (error: unknown) {
      console.error('Error generating invoice:', error);

      let errMsg = '';
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        errMsg =
          typeof data === 'string'
            ? data
            : String(
              (data as { error?: string; message?: string })?.error ??
              (data as { message?: string })?.message ??
              ''
            );
      }

      const lower = errMsg.toLowerCase();
      const isCustomerEmailMissing =
        errMsg &&
        (lower.includes('customer email is missing') ||
          (lower.includes('email') && lower.includes('missing') && lower.includes('customer')));

      if (isCustomerEmailMissing) {
        const idFromApi = errMsg.match(/customerId\(s\):\s*([\d,\s]+)/i);
        const firstParsedId =
          idFromApi?.[1]
            ?.split(/[,\s]+/)
            .map((s) => s.trim())
            .find(Boolean) ?? '';
        const customerIdForEdit =
          firstParsedId ||
          String(selectedJobs[0]?.customer?.id ?? selectedJobs[0]?.customerId ?? '');

        const safeErr = escapeHtmlForSwal(errMsg);
        const result = await Swal.fire({
          title: 'Customer email required',
          html: `
            <div style="text-align:left;font-family:inherit;margin-top:4px">
              <div style="border-radius:14px;background:linear-gradient(145deg,#eef2ff 0%,#f5f3ff 45%,#fff7ed 100%);border:1px solid #c7d2fe;padding:18px 16px;margin-bottom:14px;box-shadow:0 4px 20px rgba(56,61,113,0.08)">
                <div style="display:flex;align-items:flex-start;gap:12px">
                  <div style="flex-shrink:0;width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#383d71,#5b5f99);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(56,61,113,0.35)">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <div>
                    <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0f172a;letter-spacing:-0.02em">Invoice needs a customer email</p>
                    <p style="margin:0;font-size:13px;line-height:1.55;color:#475569">Add a valid email on the customer profile, then try generating the invoice again.</p>
                  </div>
                </div>
              </div> 
            </div>
          `,
          icon: 'warning',
          iconColor: '#f59e0b',
          showCancelButton: true,
          cancelButtonText: 'No',
          confirmButtonText: 'Add customer email',
          width: 460,
          padding: '1.75rem 1.5rem 1.5rem',
          buttonsStyling: false,
          customClass: {
            popup: 'swal-invoice-email-popup',
            title: '!text-[#0f172a] !text-xl !font-bold !pb-2 !pt-0', 
            cancelButton:
              '!bg-[#f1f5f9] hover:!bg-[#e2e8f0] !text-[#475569] !rounded-xl !px-5 !py-3 !text-sm !font-semibold !border !border-slate-200 !m-1',
              confirmButton:
              '!bg-[#383d71] hover:!bg-[#2d3159] !text-white !rounded-xl !px-5 !py-3 !text-sm !font-semibold !shadow-lg !shadow-[#383d71]/25 !m-1 !min-w-[200px]',
            actions: '!gap-2 !mt-2',
            htmlContainer: '!m-0 !pt-0',
          },
        });

        if (result.isConfirmed && customerIdForEdit) {
          router.push(`/customer/create?customerId=${encodeURIComponent(customerIdForEdit)}`);
        }
        return;
      }

      toast.error(
        errMsg || 'An error occurred while generating invoice'
      );
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  // ─── Main generate invoice handler ────────────────────────────────────────
  const handleGenerateInvoice = async (isPrint = false) => {
    const token = localStorage.getItem('token');
    const roleType = localStorage.getItem('types') || '';
    const userId = localStorage.getItem('userID');
    const selectedJobs = activeJob.filter(job => selectedIds.includes(job.id));

    if (selectedJobs.length === 0) {
      toast.error('Please select at least one vehicle to generate invoice'); return;
    }
    if (roleType !== 'single-technician') {
      const vehiclesWithoutPdr = selectedJobs.filter(job => !job.pdr || isNaN(Number(job.pdr)));
      if (vehiclesWithoutPdr.length > 0) {
        toast.error('Please enter PDR values for all selected vehicles before generating invoice'); return;
      }
    }

    const jobIdForCompare = String(
      selectedJobs[0]?.jobId ?? selectedJobs[0]?.job?.id ?? ''
    );
    const jobTypeFromSelected =
      selectedJobs[0]?.job?.jobType ??
      selectedJobs[0]?.job?.job_type ??
      selectedJobs[0]?.jobType ??
      '';

    const jobIdsUnique = Array.from(
      new Set(
        selectedJobs
          .map((j) => String(j.jobId ?? j.job?.id ?? '').trim())
          .filter(Boolean)
      )
    );
    if (jobIdsUnique.length > 1) {
      toast.error('Select vehicles from the same job to compare insurance list and generate invoice.');
      return;
    }

    const useInsuranceVinCompare =
      roleType === 'superadmin' &&
      !!jobIdForCompare &&
      isInsuranceJobTypeForInvoice(jobTypeFromSelected);

    // ── Superadmin + insurance job: compare selected VINs vs fetchInsuranceVehiclesByJob ──
    if (useInsuranceVinCompare) {
      setIsGeneratingInvoice(true);
      try {
        const insuranceVehicles = await fetchAllInsuranceVehiclesByJob(jobIdForCompare, token!);
        const { missingInScanned, missingInInsurance } = computeVinMismatch(
          selectedJobs,
          insuranceVehicles
        );
        if (missingInScanned.length > 0 || missingInInsurance.length > 0) {
          setMismatchUseInsuranceCompare(true);
          setPendingInvoiceArgs({ isPrint, selectedJobs, token, roleType, userId });
          setMismatchData({ missingInScanned, missingInInsurance });
          setShowMismatchAlert(true);
          return;
        }
      } catch (error) {
        console.error('Insurance VIN compare failed:', error);
        toast.error('Could not load insurance vehicles for comparison. Try again.');
        return;
      } finally {
        setIsGeneratingInvoice(false);
      }
      await _callInvoiceApi(isPrint, selectedJobs, token, roleType, userId);
      return;
    }

    setMismatchUseInsuranceCompare(false);

    // ── Step 1: Check for mismatches (backend) for other roles / job types ────
    try {
      const mismatchResponse = await axios.post(
        `${apiUrl}/checkVehicleMismatch`,
        { vehicleIds: selectedJobs.map(job => job.id), roleType, userId },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );
      const { missingInScanned = [], missingInInsurance = [] } = mismatchResponse.data || {};

      if (missingInScanned.length > 0 || missingInInsurance.length > 0) {
        // Store args so "Proceed Anyway" can call _callInvoiceApi
        setPendingInvoiceArgs({ isPrint, selectedJobs, token, roleType, userId });
        setMismatchData({ missingInScanned, missingInInsurance });
        setShowMismatchAlert(true);
        return; // Do NOT call invoice API yet
      }
    } catch (err) {
      // If mismatch check fails, proceed directly (silent fail)
      console.warn('Mismatch check failed, proceeding:', err);
    }

    // ── Step 2: No mismatches → call invoice API directly ────────────────────
    await _callInvoiceApi(isPrint, selectedJobs, token, roleType, userId);
  };

  const handleFillAllPdr = async () => {
    if (selectedIds.length === 0) { toast.error("Please select at least one vehicle to fill PDR"); return; }
    let pdrValueToFill = '';
    for (const id of selectedIds) { if (pdrValues[id] && pdrValues[id].trim() !== '') { pdrValueToFill = pdrValues[id]; break; } }
    if (!pdrValueToFill) { toast.error("Please enter a PDR value for at least one selected vehicle"); return; }
    if (isNaN(Number(pdrValueToFill))) { toast.error("PDR value must be a number"); return; }
    try {
      const token = localStorage.getItem('token'); const roleType = localStorage.getItem('types') || ""; const userId = localStorage.getItem('userID');
      const payload = selectedIds.map(vehicleId => ({ vehicleId, pdr: Number(pdrValueToFill), generatedInvoiceDate: invoiceDates[vehicleId] || new Date().toISOString().split('T')[0], roleType, userId }));
      const response = await fetch(`${apiUrl}/updateVehiclePdr`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('Failed to update PDR for selected vehicles');
      toast.success("PDR updated successfully for all selected vehicles!");
      const updatedPdrValues = { ...pdrValues }; selectedIds.forEach(id => { updatedPdrValues[id] = pdrValueToFill; }); setPdrValues(updatedPdrValues);
      fetchJobs(currentPage, searchTerm, pageSize);
    } catch (error) { toast.error("Failed to update PDR for selected vehicles"); }
  };

  const renderRow = (job: any) => {
    const isChecked = selectedIds.includes(job.id);
    const roleType = localStorage.getItem('types') || "";
    return (
      <tr key={job.id}>
        <td key="checkbox">
          <label className="flex items-center cursor-pointer relative">
            <input type="checkbox" className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[var(--foreground)]" checked={isChecked} onChange={() => handleCheckboxChange(job.id)} />
            <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
            </span>
          </label>
        </td>
        <td><Link href={`/jobs/view?jobId=${job?.job?.id}&ActiveWorkOrder`} className='hover:underline'>{job?.jobName}</Link></td>
        <td><Link href={`/vehicle/view?vehicleId=${job.id}`} className='hover:underline'>{job?.vin}</Link></td>
        <td><Link href={`/client/view?customerId=${job?.customer?.id}`} className='hover:underline'>{job?.customer?.fullName}</Link></td>
        {roleType !== 'single-technician' && (
          <td>{job?.assignedTechnicians?.filter((tech: any) => tech.techType === 'technician')?.map((tech: any) => (<div key={tech.id} className="capitalize"><Link href={`/technicians/view?technicianId=${tech?.id}`} className='hover:underline'>{tech.firstName} {tech.lastName}</Link></div>))}</td>
        )}
        {roleType !== 'single-technician' && (
          <td>{job?.assignedTechnicians?.length > 0 ? job?.assignedTechnicians?.map((tech: any) => (<div key={tech.id} className="capitalize">{tech.VehicleTechnician?.techPercentageCalculatedAmount && tech.VehicleTechnician?.techPercentageCalculatedAmount !== '' ? `$${tech.VehicleTechnician?.techPercentageCalculatedAmount}` : <span className="text-gray-400 text-sm"></span>}</div>)) : <span className="text-gray-400 text-sm"></span>}</td>
        )}
        {roleType !== 'single-technician' && (
          <td>{job?.assignedTechnicians?.filter((tech: any) => tech.techType === 'R/I/R/R')?.map((tech: any) => (<div key={tech.id} className="capitalize">{tech.firstName} {tech.lastName}</div>))}</td>
        )}
        {roleType !== 'single-technician' && (
          <td>{job?.assignedTechnicians?.length > 0 ? job?.assignedTechnicians?.map((tech: any) => (<div key={tech.id} className="capitalize">{tech.VehicleTechnician?.rPercentageCalculatedAmount && tech.VehicleTechnician?.rPercentageCalculatedAmount !== '' ? `$${tech.VehicleTechnician?.rPercentageCalculatedAmount}` : <span className="text-gray-400 text-sm"></span>}</div>)) : <span className="text-gray-400 text-sm"></span>}</td>
        )}
        {roleType === 'single-technician' && (<td>{job?.labourCost ? `$${job.labourCost}` : 'N/A'}</td>)}
        {/* {roleType !== 'single-technician' && (<td>{job?.totalCombined && job?.totalCombined !== '' ? `$${job?.totalCombined}` : <span className="text-gray-400 text-sm"></span>}</td>)} */}
        <td>{job.startDate ? new Date(job.startDate).toLocaleDateString() : ''}</td>
        <td>{job.endDate ? new Date(job.endDate).toLocaleDateString() : ''}</td>
        <td>
          <TextField label="" variant="outlined" fullWidth color="warning" size="small" type='date' value={invoiceDates[job.id] || ''} onChange={(e) => handleDateAutoSave(job.id, e.target.value)} InputLabelProps={{ shrink: true }} />
        </td>
        <td>{canCreate && (<span className={`badge ${job.generatedInvoiceStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}>{job.generatedInvoiceStatus ? 'Generated' : 'Pending'}</span>)}</td>
        <td>{canCreate && (<span className={`badge ${job.vehicleStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}>{job.vehicleStatus ? 'Completed' : 'In Progress'}</span>)}</td>
        {roleType !== 'single-technician' && (
          <td>
            <div className="flex gap-2 items-center">
              <FormControl fullWidth size="small">
                <TextField label="PDR" variant="outlined" fullWidth color="warning" size="small" type='number' value={pdrValues[job.id] || ''} onChange={(e) => handlePdrChange(job.id, e.target.value)} />
              </FormControl>
              <button type='button' className="primary-bg p-2 rounded" onClick={() => handleSavePdr(job.id, pdrValues[job.id])}>Save</button>
            </div>
          </td>
        )}
        <td className='text-left'>
          <div className="flex gap-3 items-center">
            <Link href={`/vehicle/view?vehicleId=${job.id}`}>
              <Image alt='eye' src={Eye} className='w-[20px]' data-tooltip-id="view" data-tooltip-content="View" />
            </Link>
            <Tooltip id="view" place="top" />
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className={`mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb items={[{ label: 'Invoice', href: '/reporting/invoice' }]} />

      <div className="invoice_tab_content flex justify-end gap-3 mb-3 items-center">
        <button onClick={() => handleGenerateInvoice(false)} disabled={isGeneratingInvoice} className='primary-bg text-sm border border-black-500 p-2 pl-5 pr-5 bg-black text-white rounded flex items-center gap-2 justify-center'>
          {isGeneratingInvoice ? (
            <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generating...</>
          ) : ('Generate Invoice')}
        </button>
        <button onClick={() => handleGenerateInvoice(true)} className='primary-bg text-sm border border-black-500 p-2 pl-5 pr-5 bg-black text-white rounded flex items-center gap-2'>Print</button>
        <button onClick={handleFillAllPdr} className='primary-bg text-sm border border-black-500 p-2 pl-5 pr-5 bg-black text-white rounded flex items-center gap-2'>Fill All PDR</button>
      </div>

      <div className="shadow-lg p-4 bg-white rounded-lg">
        <CommonHeader heading="Invoice" onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} userRole='Activejobs' buttonLabel="" buttonLink="" showDatePicker={true} onDateChange={handleDateChange} onNewJobClick={handleNewJobClick} onCustomerChange={handleNewCustomerClick} onStatusChange={handleStatusChange} fetchCustomerData={fetchCustomerData} showClearFilters={true} onClearFilters={handleClearFilters} />

        {/* <div className="flex mb-2 shadow-lg p-2 flex gap-0 sm:gap-4 md:gap-8 lg:gap-[3rem] mb-2 shadow-lg p-2">
          <div className='total_work title_sdev'><b>Total Work Order </b>: ${totalJobs}</div>
          {roleType !== 'single-technician title_sdev' && (<div className='total_dent_teach title_sdev'><b>Total Dent Tech  </b>: ${dentTechTotalAmount}</div>)}
          {roleType !== 'single-technician' && (<div className='total_ri_content title_sdev'><b>Total RR/I/R  </b>: ${rRTotalAmount}</div>)}
          <div><b>Total Job Estimate </b>: ${totalJobAmount}</div>
          {roleType !== 'single-technician' && (<div className='total_expense title_sdev'><b>Total Expense </b>: ${totalEstimateAmount}</div>)}
        </div> */}

        <div className="overflow-auto rounded-md">
          <table className="table w-full table-fixed sdev_table">
            <thead>
              <tr>
                <th className="w-[50px]">
                  <label className="flex items-center cursor-pointer relative">
                    <input type="checkbox" checked={selectedIds.length === activeJob.length} className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[#fff]" onChange={() => setSelectedIds(selectedIds.length === activeJob.length ? [] : activeJob.map((cust) => cust.id))} />
                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg></span>
                  </label>
                </th>
                <th className="w-[100px]">Job Title</th>
                <th className="w-[160px]">VIN</th>
                <th className="w-[120px]">Customer Name</th>
                {roleType !== 'single-technician' && (<th className="w-[150px]">Assigned Dent Tech</th>)}
                {roleType !== 'single-technician' && (<th className="w-[100px]">Dent Tech Rate</th>)}
                {roleType !== 'single-technician' && (<th className="w-[130px]">Assigned RR/I/R</th>)}
                {roleType !== 'single-technician' && (<th className="w-[80px]">RR/I/R</th>)}
                {/* {roleType !== 'single-technician' && (<th className="w-[80px]">Total Expense</th>)} */}
                {roleType === 'single-technician' && (<th className="w-[80px]">Labour Cost</th>)}
                <th className="w-[80px]">Start Date</th>
                <th className="w-[80px]">End Date</th>
                <th className="w-[200px]">Generated Invoice Date</th>
                <th className="w-[120px]">Invoice Status</th>
                <th className="w-[130px]">W.O Status</th>
                {roleType !== 'single-technician' && (<th className="w-[160px]">PDR</th>)}
                <th className="w-[80px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={roleType !== 'single-technician' ? 14 : 9} className="text-center py-10"><Loader /></td></tr>
              ) : activeJob.length === 0 ? (
                <tr><td colSpan={roleType !== 'single-technician' ? 14 : 9} className="text-center py-10"><Empty /></td></tr>
              ) : (
                activeJob.map((job) => renderRow(job))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 items-center">
          {activeJob.length > 0 && (<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />)}
        </div>
      </div>

      {/* ─── Vehicle Mismatch Modals ──────────────────────────────────────────── */}
      {showMismatchAlert && (
        <VehicleMismatchAlert
          mismatchData={mismatchData}
          onCancel={() => {
            setShowMismatchAlert(false);
            setPendingInvoiceArgs(null);
            setMismatchUseInsuranceCompare(false);
          }}
          onViewMissingVehicles={async () => {
            if (!mismatchUseInsuranceCompare || !pendingInvoiceArgs) return;
            const { selectedJobs, token } = pendingInvoiceArgs;
            const jid = String(selectedJobs[0]?.jobId ?? selectedJobs[0]?.job?.id ?? '');
            if (!token || !jid) return;
            const insuranceVehicles = await fetchAllInsuranceVehiclesByJob(jid, token);
            setMismatchData(computeVinMismatch(selectedJobs, insuranceVehicles));
          }}
          onProceed={async () => {
            setShowMismatchAlert(false);
            setMismatchUseInsuranceCompare(false);
            if (pendingInvoiceArgs) {
              const { isPrint, selectedJobs, token, roleType, userId } = pendingInvoiceArgs;
              setPendingInvoiceArgs(null);
              await _callInvoiceApi(isPrint, selectedJobs, token, roleType, userId);
            }
          }}
        />
      )}
    </div>
  );
};

export default JobTable;
