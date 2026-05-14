// components/JobTable.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import {
  VehicleMismatchAlert,
  computeVinMismatch,
  fetchAllInsuranceVehiclesByJobIds,
  isInsuranceJobTypeForInvoice,
  uniqueNumericJobIdsFromVehicles,
  type MismatchData,
} from '@/app/component/vehicleMismatchModals';
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
import { renumberSerialNo } from '@/lib/renumberSerialNo';
import { Tooltip } from 'react-tooltip';

import Papa from 'papaparse';
import Link from 'next/link';
import SortIcon from '@/app/component/sortIcon';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
const VEHICLE_WORKORDER_IMPORT_ID_MAP_KEY = 'vehicleWorkOrderImportSerialToIdMap';

// ─── Tab type ────────────────────────────────────────────────────────────────
type ActiveTab = 'scanned' | 'insurance';

interface VehcileInfo {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
  Role: { name: string };
}

const JobTable: React.FC = () => {
  // ─── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanned');

  const [insuranceVehicles, setInsuranceVehicles] = useState<any[]>([]);
  const [insuranceLoading, setInsuranceLoading] = useState<boolean>(false);
  const [insuranceCurrentPage, setInsuranceCurrentPage] = useState<number>(1);
  const [insuranceTotalPages, setInsuranceTotalPages] = useState<number>(1);
  const [workOrderStatus, setWorkOrderStatus] = useState<string>('');
  const normalizeJobId = (value: any) => {
    if (value === undefined || value === null) return '';
    const str = String(value).trim();
    if (!str || str === 'undefined' || str === 'null') return '';
    return str;
  };

  const [activeJob, setActiveJob] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpense, setTotalExpense] = useState('0');
  const [totalDantTechCost, setTotalDantTechCost] = useState('0');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isCollapsed } = useSidebar();
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [roleType, setRoleType] = useState<string | null>(null);

  const [showMismatchAlert, setShowMismatchAlert] = useState(false);
  const [mismatchData, setMismatchData] = useState<MismatchData>({
    missingInScanned: [],
    missingInInsurance: [],
  });
  const [pendingCompareArgs, setPendingCompareArgs] = useState<{
    selectedJobs: any[];
    token: string;
    /** Job ids from checkbox-selected rows, e.g. [56, 60] */
    jobIds: number[];
  } | null>(null);
  const [mismatchUseInsuranceCompare, setMismatchUseInsuranceCompare] = useState(false);

  /** After tab change, fetch immediately (no 500ms debounce) to avoid data → loader → data flash. */
  const skipSearchDebounceRef = useRef(false);
  useEffect(() => {
    skipSearchDebounceRef.current = true;
  }, [activeTab]);

  const activeJobRef = useRef(activeJob);
  activeJobRef.current = activeJob;
  const insuranceVehiclesRef = useRef(insuranceVehicles);
  insuranceVehiclesRef.current = insuranceVehicles;

  useEffect(() => {
    const storedRoleType = localStorage.getItem('types');
    setRoleType(storedRoleType);
  }, []);

  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
  };

  const handleDeleteSuccess = (deletedId: string) => {
    const startSerial = (currentPage - 1) * pageSize + 1;
    setSelectedIds((ids) => ids.filter((id) => id !== deletedId));
    setActiveJob((prev) =>
      renumberSerialNo(
        prev.filter((cust) => cust.id !== deletedId),
        startSerial
      )
    );
  };

  const handlePageSizeChange = (size: number) => {
    const newTotalPages = Math.ceil(totalJobs / size);
    let newPage = currentPage;
    if (newPage > newTotalPages) newPage = newTotalPages;
    if (newPage < 1) newPage = 1;
    setPageSize(size);
    setCurrentPage(newPage);
  };

  const fetchvehicleInfo = async (
    page = 1,
    query = '',
    limit = pageSize,
    opts?: { showFullScreenLoader?: boolean; status?: string }
  ) => {
    const showLoader = opts?.showFullScreenLoader !== false;
    const status = opts?.status ?? workOrderStatus;
    if (showLoader) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types') || "";
      const userId = localStorage.getItem('userID');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoint = query.trim()
        ? roleType === 'superadmin'
          ? `/api/vehicleInfo?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}${status ? `&vehicleStatus=${encodeURIComponent(status)}` : ''}`
          : `/api/vehicleInfo?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}${status ? `&vehicleStatus=${encodeURIComponent(status)}` : ''}`
        : roleType === 'superadmin' || roleType === 'manager'
          ? `/api/vehicleInfo?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}${status ? `&vehicleStatus=${encodeURIComponent(status)}` : ''}`
          : `/api/vehicleInfo?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}${status ? `&vehicleStatus=${encodeURIComponent(status)}` : ''}`;
      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();

      if (response.ok) {
        const fetchedTechnicians: VehcileInfo[] = query.trim()
          ? data.data.vehicles || []
          : data.response.vehicles || [];
        const vehiclesWithSerialNo = fetchedTechnicians.map((vehicle: any, index: number) => ({
          ...vehicle,
          serialNo: (page - 1) * limit + index + 1,
        }));
        setActiveJob(vehiclesWithSerialNo);
        setTotalPages(data.response?.totalPages || 1);
        setTotalJobs(data.jobs?.totalJobs || 0);
        setTotalExpense(data.response?.totalEstimateCost || data.data?.totalEstimateCost);
        setTotalDantTechCost(data.response?.totalDantTechCost || data.data?.totalDentTechCost);
      } else {
        if (data.error === 'Invalid Token') {
          router.push('/');
        } else {
          console.error('Error fetching job data:', data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsuranceVehiclesByJob = useCallback(
    async (
      jobId?: string,
      page = 1,
      limit?: number,
      searchQuery?: string,
      opts?: { showFullScreenLoader?: boolean }
    ) => {
      const normalizedJobId = normalizeJobId(jobId);
      const lim = limit ?? pageSize;
      const showLoader = opts?.showFullScreenLoader !== false;
      if (showLoader) setInsuranceLoading(true);
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        if (!apiBaseUrl) {
          throw new Error('NEXT_PUBLIC_API_URL is not configured');
        }

        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const q = (searchQuery ?? '').trim();

        // Only send jobIds after header job filter (omit param when id blank / first load)
        const params = new URLSearchParams();
        if (normalizedJobId) {
          const n = Number(normalizedJobId);
          const jobIds: (number | string)[] =
            Number.isFinite(n) && n > 0 ? [n] : [normalizedJobId];
          params.set('jobIds', JSON.stringify(jobIds));
        }
        params.set('page', String(page));
        params.set('limit', String(lim));
        if (q) params.set('search', q);

        const response = await fetch(
          `${apiBaseUrl}/fetchInsuranceVehiclesByJob?${params.toString()}`,
          { method: 'GET', headers }
        );

        const data = await response.json();
        if (response.ok && data?.status) {
          setInsuranceVehicles(Array.isArray(data?.vehicles) ? data.vehicles : []);
          const total = Number(data?.total || 0);
          setInsuranceTotalPages(Math.max(1, Math.ceil(total / lim)));
        } else {
          setInsuranceVehicles([]);
          setInsuranceTotalPages(1);
        }
      } catch (error) {
        console.error('Error fetching insurance vehicles:', error);
        setInsuranceVehicles([]);
        setInsuranceTotalPages(1);
      } finally {
        setInsuranceLoading(false);
      }
    },
    [pageSize]
  );

  const handleInsurancePageChange = (data: { selected: number }) => {
    const nextPage = data.selected + 1; // Pagination is 0-based in your component
    setInsuranceCurrentPage(nextPage);
    const jobId = normalizeJobId(selectedJobId);
    fetchInsuranceVehiclesByJob(jobId || undefined, nextPage, pageSize, searchTerm);
  };

  useEffect(() => {
    if (activeTab !== 'insurance') return;
    const immediate = skipSearchDebounceRef.current;
    skipSearchDebounceRef.current = false;
    const delay = immediate ? 0 : 500;
    const timeoutId = setTimeout(() => {
      setInsuranceCurrentPage(1);
      const jobId = normalizeJobId(selectedJobId);
      const hasRows = insuranceVehiclesRef.current.length > 0;
      fetchInsuranceVehiclesByJob(jobId || undefined, 1, pageSize, searchTerm, {
        showFullScreenLoader: !hasRows,
      });
    }, delay);
    return () => clearTimeout(timeoutId);
  }, [activeTab, selectedJobId, searchTerm, pageSize, fetchInsuranceVehiclesByJob]);

  useEffect(() => {
    if (activeTab !== 'scanned') return;
    const immediate = skipSearchDebounceRef.current;
    skipSearchDebounceRef.current = false;
    const delay = immediate ? 0 : 500;
    const timeoutId = setTimeout(() => {
      const hasRows = activeJobRef.current.length > 0;
      fetchvehicleInfo(currentPage, searchTerm, pageSize, {
        showFullScreenLoader: !hasRows,
      });
    }, delay);
    return () => clearTimeout(timeoutId);
  }, [activeTab, currentPage, searchTerm, pageSize]);

  const handleSort = (column: string) => {
    const direction = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(direction);
    setSortBy(column);

    const techsOfType = (job: any, type: 'technician' | 'R/I/R/R') =>
      (job?.assignedTechnicians ?? []).filter((t: any) => t?.techType === type);

    const techNameLabel = (job: any, type: 'technician' | 'R/I/R/R') => {
      const t = techsOfType(job, type)[0];
      if (!t) return '';
      return `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim().toLowerCase();
    };

    const techRateValue = (job: any, kind: 'tech' | 'r') => {
      const t = (job?.assignedTechnicians ?? [])[0];
      if (!t?.VehicleTechnician) return 0;
      const vt = t.VehicleTechnician;
      const pct = kind === 'tech' ? vt.techPercentageCalculatedAmount : vt.rPercentageCalculatedAmount;
      const flat = kind === 'tech' ? vt.techFlatRate : vt.rRate;
      const pickRaw = pct != null && String(pct).trim() !== '' && String(pct).toLowerCase() !== 'null'
        ? pct
        : flat;
      const num = parseFloat(String(pickRaw ?? '').replace(/[^0-9.\-]/g, ''));
      return Number.isNaN(num) ? 0 : num;
    };

    const dateValue = (v: any) => {
      if (!v) return 0;
      const t = new Date(v).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    const sortedJobs = [...activeJob].sort((a, b) => {
      let valueA: string | number = '';
      let valueB: string | number = '';

      switch (column) {
        case 'serialNo':
          valueA = Number(a?.serialNo) || 0;
          valueB = Number(b?.serialNo) || 0;
          break;
        case 'fullName':
          valueA = (a?.customer?.fullName ?? '').toLowerCase().trim();
          valueB = (b?.customer?.fullName ?? '').toLowerCase().trim();
          break;
        case 'technicianName':
          valueA = techNameLabel(a, 'technician');
          valueB = techNameLabel(b, 'technician');
          break;
        case 'rIName':
          valueA = techNameLabel(a, 'R/I/R/R');
          valueB = techNameLabel(b, 'R/I/R/R');
          break;
        case 'techFlatRate':
          valueA = techRateValue(a, 'tech');
          valueB = techRateValue(b, 'tech');
          break;
        case 'rRate':
          valueA = techRateValue(a, 'r');
          valueB = techRateValue(b, 'r');
          break;
        case 'startDate':
        case 'endDate':
          valueA = dateValue(a?.[column]);
          valueB = dateValue(b?.[column]);
          break;
        case 'labourCost':
          valueA = Number(a?.labourCost) || 0;
          valueB = Number(b?.labourCost) || 0;
          break;
        case 'vin':
        case 'jobName':
          valueA = (a?.[column] ?? '').toString().toLowerCase();
          valueB = (b?.[column] ?? '').toString().toLowerCase();
          break;
        default:
          valueA = (a?.[column] ?? '').toString().toLowerCase();
          valueB = (b?.[column] ?? '').toString().toLowerCase();
      }

      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setActiveJob(sortedJobs);
  };

  const toggleApproval = async (vehicleId: number, currentApprovalStatus: boolean) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to change the status of this Vehicle / Work Order?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#383d71',
      cancelButtonColor: 'black',
      confirmButtonText: 'Yes, change it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const technicianData = localStorage.getItem('technicianData');
        let completedBy = '';
        if (technicianData) {
          try {
            const parsed = JSON.parse(technicianData);
            completedBy = `${parsed.firstName} ${parsed.lastName}`;
          } catch (err) {
            console.error('Failed to parse technicianData:', err);
          }
        }
        const config = {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        };

        const response = await axios.post(`/api/workOrderComplete`, {
          vehicleId,
          completedBy,
          vehicleStatus: !currentApprovalStatus
        }, config);

        if (response.data.status) {
          fetchvehicleInfo(currentPage, searchTerm);
          setActiveJob(prev => prev.map(job => {
            if (job.id === vehicleId) {
              return { ...job, jobStatus: !job.jobStatus };
            }
            fetchvehicleInfo(currentPage, searchTerm);
            return job;
          }));
          Swal.fire({
            title: 'Success!',
            text: 'Vehicle / Work Order status updated successfully.',
            confirmButtonColor: '#383d71',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } else {
          Swal.fire({ title: 'Error!', text: 'Failed to update Vehicle / Work Order status.', icon: 'error', confirmButtonText: 'OK' });
        }
      } catch (error) {
        Swal.fire({ title: 'Error!', text: 'Error updating Vehicle / Work Order status.', icon: 'error', confirmButtonText: 'OK' });
      }
    } else {
      Swal.fire({ title: 'Cancelled', text: 'Vehicle / Work Order status change was cancelled.', icon: 'info', confirmButtonText: 'OK' });
    }
  };

  const handlePageChange = (data: { selected: number }) => {
    setCurrentPage(data.selected + 1);
  };

  const [permissions, setPermissions] = useState<any[]>([]);

  useEffect(() => {
    const storedPermissions = localStorage.getItem("permissions");
    if (storedPermissions) {
      try {
        const parsedPermissions = JSON.parse(storedPermissions);
        setPermissions(Array.isArray(parsedPermissions) ? parsedPermissions : []);
      } catch (error) {
        console.error("❌ Failed to parse permissions:", error);
      }
    }
  }, []);

  const hasPermission = (action: string) => {
    if (permissions.length === 0) return true;
    return permissions.some(
      (perm) => perm.permissionName === 'Activejobs' && perm.action === action && perm.isActive
    );
  };
  const canCreate = hasPermission("approve");

  const downloadCSV = () => {
    const selectedJobs = activeJob.filter(c => selectedIds.includes(c.id));
    if (selectedJobs.length === 0) {
      toast.error("Please select at least one work order to export.");
      return;
    }
    const csvOptions = {
      filename: 'Vehicle / Work Orders',
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Vehicle / Work Orders',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
    };
    const csvExporter = new ExportToCsv(csvOptions);
    const serialToIdMap: Record<string, string> = {};
    const formattedData = selectedJobs.map((jobData, index) => {
      const technicianRates = jobData.assignedTechnicians.map((tech: any) => {
        const vt = tech.VehicleTechnician || {};
        return `${tech.firstName} ${tech.lastName} - TechnicianFlatRate: ${vt.techFlatRate || ''}, RIRR: ${vt.rRate || ''}, techPercentage ${vt.techPercentage}`;
      }).join(', ');
      const serialNo = index + 1;
      serialToIdMap[String(serialNo)] = String(jobData.id);
      return {
        'Serial No': serialNo,
        vin: jobData.vin, customer: `${jobData?.customer?.fullName}`,
        jobName: jobData.jobName, assignCustomer: jobData?.customer?.id,
        bodyClass: jobData.bodyClass, color: jobData.color, make: jobData.make,
        model: jobData.model, vehicleType: jobData.vehicleType, modelYear: jobData.modelYear,
        vehicleDescriptor: jobData.vehicleDescriptor, manufacturerName: jobData.manufacturerName,
        plantCompanyName: jobData.plantCompanyName, plantCountry: jobData.plantCountry,
        plantState: jobData.plantState, deletedStatus: jobData.deletedStatus, notes: jobData.notes,
        technicians: jobData.assignedTechnicians.map((tech: any) => `${tech.firstName} ${tech.lastName}`).join(', '),
        assignTechnicians: jobData.assignedTechnicians.map((techId: any) => `${techId.id}`).join(', '),
        jobDescription: jobData.jobDescription.join(' '), technicianRates,
      };
    });
    localStorage.setItem(VEHICLE_WORKORDER_IMPORT_ID_MAP_KEY, JSON.stringify(serialToIdMap));
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
      const savedSerialToIdMap: Record<string, string> = (() => {
        try {
          const raw = localStorage.getItem(VEHICLE_WORKORDER_IMPORT_ID_MAP_KEY);
          return raw ? JSON.parse(raw) : {};
        } catch {
          return {};
        }
      })();

      const manualHeaders = [
        'Serial No', 'vin', 'customer', 'jobName', 'assignCustomer', 'bodyClass', 'color',
        'make', 'model', 'vehicleType', 'modelYear', 'vehicleDescriptor', 'manufacturerName',
        'plantCompanyName', 'plantCountry', 'plantState', 'deletedStatus',
        'notes', 'technicians', 'assignTechnicians', 'jobDescription', 'technicianRates'
      ];
      Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        complete: async (result) => {
          const rows = result.data as string[][];
          const cleanedData = rows.slice(1).map((row) => {
            const obj: any = {};
            manualHeaders.forEach((key, idx) => {
              let value = row[idx];
              value = typeof value === 'string' ? value.trim() : value;
              obj[key] = value;
            });
            return obj;
          }).filter((row) => {
            const isHeaderRow = Object.entries(row).every(([key, val]) => key === val);
            const hasData = Object.values(row).some((val) => val && val !== '');
            return !isHeaderRow && hasData;
          });
          try {
            const payloadData = cleanedData.map((row) => {
              const serialNoVal = row['Serial No'];
              const mappedIdFromSerial =
                serialNoVal != null && serialNoVal !== ''
                  ? savedSerialToIdMap[String(serialNoVal).trim()]
                  : null;
              const resolvedJobId = mappedIdFromSerial ?? row.id;

              const technicianNames = row.technicians ? row.technicians.split(',').map((name: any) => name.trim()) : [];
              const technicianIds = row.assignTechnicians ? row.assignTechnicians.split(',').map((id: any) => id.trim()) : [];
              const rateChunks = row.technicianRates
                ? row.technicianRates.match(/([^-]+- TechnicianFlatRate:\s*[^,]*, RIRR:\s*[^,]*)(?=, [^-]+- TechnicianFlatRate:|$)/g)
                : [];
              const technicians = technicianNames.map((name: any, index: number) => {
                let techFlatRate = '', rRate = '';
                if (rateChunks && rateChunks[index]) {
                  const match = rateChunks[index].match(/- TechnicianFlatRate:\s*(.*?), RIRR:\s*(.*)/);
                  techFlatRate = match?.[1]?.trim() || '';
                  rRate = match?.[2]?.trim() || '';
                }
                return { id: technicianIds[index] || null, name, techFlatRate, rRate };
              });
              const jobDescriptions = row.jobDescription ? row.jobDescription.split(',').map((desc: any) => desc.trim()) : [];
              return {
                ...row,
                id: resolvedJobId,
                technicians,
                jobDescription: jobDescriptions,
                ['Serial No']: undefined,
                assignTechnicians: undefined,
              };
            }).filter(row => !manualHeaders.some(header => row[header] === header));
            await axios.post(`/api/importVehicle`, { data: payloadData }, { headers });
            toast.success('CSV Import Successful!');
            fetchvehicleInfo(currentPage, searchTerm, pageSize);
          } catch (error: unknown) {
            if (axios.isAxiosError(error)) toast.error(error.response?.data?.error || error.message);
            else if (error instanceof Error) toast.error(error.message);
            else toast.error('An unknown error occurred');
          }
          setLoading(false);
        },
        error: (err: any) => {
          toast.error('Error parsing CSV file');
          setLoading(false);
        },
      });
    };
    reader.readAsText(file);
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const [selectedDates, setSelectedDates] = useState<{ startDate: string | null, endDate: string | null }>({
    startDate: null, endDate: null
  });

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchVehicleWithFilters = async (jobId?: string, startDate?: string | null, endDate?: string | null) => {
    const token = localStorage.getItem('token');
    const roleType = localStorage.getItem('types') || "";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    try {
      if (!token) return;
      setLoading(true);
      const payload: { [key: string]: any } = { roleType };
      if (jobId) payload.jobId = jobId;
      if (startDate && endDate) { payload.startDate = startDate; payload.endDate = endDate; }
      const response = await fetch(`${apiUrl}/vehicleJobNameAndDateFilter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok && data.status) {
        const filteredVehiclesWithSerialNo = (data.vehicles.updatedVehicles || []).map((vehicle: any, index: number) => ({
          ...vehicle,
          serialNo: (currentPage - 1) * pageSize + index + 1,
        }));
        setActiveJob(filteredVehiclesWithSerialNo);
        setTotalExpense(data.vehicles?.totalEstimateCost || 0);
        setTotalDantTechCost(data.vehicles?.totalDentTechCost);

      }
    } catch (error) {
      console.error("Error during API request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (dateRange: [Date | null, Date | null] | null) => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = formatDate(dateRange[0]);
      const endDate = formatDate(dateRange[1]);
      setSelectedDates({ startDate, endDate });
      await fetchVehicleWithFilters(selectedJobId || undefined, startDate, endDate);
    } else {
      setSelectedDates({ startDate: null, endDate: null });
      if (selectedJobId) await fetchVehicleWithFilters(selectedJobId, null, null);
      else fetchvehicleInfo(currentPage, searchTerm, pageSize);
    }
  };

  const renderRow = (job: any, index: number) => {
    const isChecked = selectedIds.includes(job.id);
    const roleType = localStorage.getItem('types') || "";
    const serialNo = job.serialNo ?? ((currentPage - 1) * pageSize + index + 1);
    return (
      <tr key={job.id}>
        <td key="checkbox">
          <label className="flex items-center cursor-pointer relative">
            <input
              type="checkbox"
              className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[var(--foreground)]"
              checked={isChecked}
              onChange={() => handleCheckboxChange(job.id)}
            />
            <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
            </span>
          </label>
        </td>
        <td>{serialNo}</td>
        {/* <td><Link href={`/vehicle/view?vehicleId=${job.id}`} className='hover:underline'>{job.id}</Link></td> */}
        <td>{job?.jobName}</td>
        <td>{job?.customer?.fullName}</td>
        {roleType !== 'single-technician' && (
          <td>
            {job?.assignedTechnicians
              ?.filter((tech: any) => tech.techType === 'technician')
              ?.map((tech: any) => (
                <div key={tech.id} className="flex items-center gap-2 mb-1">

                  <span
                    className={`capitalize font-medium ${tech?.deletedStatus
                        ? "text-red-600"
                        : "text-gray-900"
                      }`}
                  >
                    {tech.firstName} {tech.lastName}
                  </span>

                  {tech?.deletedStatus && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-[10px] font-medium text-red-700">
                      Deleted Tech
                    </span>
                  )}

                </div>
              ))}
          </td>
        )}
        {roleType !== 'single-technician' && (
          <td>
            {job?.assignedTechnicians?.length > 0 ? (
              job?.assignedTechnicians?.map((tech: any) => (
                <div key={tech.id} className="capitalize">
                  {(tech.VehicleTechnician?.techPercentageCalculatedAmount != null &&
                    String(tech.VehicleTechnician?.techPercentageCalculatedAmount).trim() !== '' &&
                    String(tech.VehicleTechnician?.techPercentageCalculatedAmount).toLowerCase() !== 'null')
                    ? `$${tech.VehicleTechnician?.techPercentageCalculatedAmount}`
                    : ((tech.VehicleTechnician?.techFlatRate != null &&
                      String(tech.VehicleTechnician?.techFlatRate).trim() !== '' &&
                      String(tech.VehicleTechnician?.techFlatRate).toLowerCase() !== 'null')
                      ? `$${tech.VehicleTechnician?.techFlatRate}`
                      : <span className="text-gray-500 text-sm"></span>)}
                </div>
              ))
            ) : <span className="text-gray-500 text-sm"></span>}
          </td>
        )}
        {roleType !== 'single-technician' && (
          <td>
            {job?.assignedTechnicians?.filter((tech: any) => tech.techType === 'R/I/R/R')?.map((tech: any) => (
              <div key={tech.id} className="capitalize">{tech.firstName} {tech.lastName}</div>
            ))}
          </td>
        )}
        {roleType !== 'single-technician' && (
          <td>
            {job?.assignedTechnicians?.length > 0 ? (
              job?.assignedTechnicians?.map((tech: any) => (
                <div key={tech.id} className="capitalize">
                  {(tech.VehicleTechnician?.rPercentageCalculatedAmount != null &&
                    String(tech.VehicleTechnician?.rPercentageCalculatedAmount).trim() !== '' &&
                    String(tech.VehicleTechnician?.rPercentageCalculatedAmount).toLowerCase() !== 'null')
                    ? `$${tech.VehicleTechnician?.rPercentageCalculatedAmount}`
                    : ((tech.VehicleTechnician?.rRate != null &&
                      String(tech.VehicleTechnician?.rRate).trim() !== '' &&
                      String(tech.VehicleTechnician?.rRate).toLowerCase() !== 'null')
                      ? `$${tech.VehicleTechnician?.rRate}`
                      : <span className="text-gray-500 text-sm"></span>)}
                </div>
              ))
            ) : <span className="text-gray-500 text-sm"></span>}
          </td>
        )}
        {/* {roleType !== 'single-technician' && (
          <td>
            {job?.totalCombined && job?.totalCombined !== ''
              ? `$${job?.totalCombined}`
              : <span className="text-gray-500 text-sm"></span>}
          </td>
        )} */}
        <td>{job?.vin}</td>
        <td>{job.startDate ? new Date(job.startDate).toLocaleDateString() : ''}</td>
        <td>{job.endDate ? new Date(job.endDate).toLocaleDateString() : ''}</td>
        {roleType === 'single-technician' && (
          <td>{job.labourCost !== null && (`$${job.labourCost || '-'}`) || '-'}</td>
        )}
        {/* <td>
          {canCreate && (
            <span
              // onClick={() => toggleApproval(job.id, job.vehicleStatus)}
              // style={{ cursor: 'pointer' }}
              className={`badge ${job.vehicleStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
            >
              {job.vehicleStatus ? 'Completed' : 'In Progress'}
            </span>
          )}
        </td> */}
        <td>
          <TableActions
            editRoute={`/vehicle/create-vehicle?vahicleId=${job.id}`}
            deleteRoute={`/api/deleteVehicle`}
            viewRoute={`/vehicle/view?vehicleId=${job.id}`}
            idKey="vehicleId"
            userRole='Activejobs'
            itemId={job.id}
            onDeleteSuccess={() => handleDeleteSuccess(job.id)}
          />
        </td>
      </tr>
    );
  };

  const handleNewJobClick = async (jobId: string) => {
    setSelectedJobId(jobId);
    if (jobId) {
      await fetchVehicleWithFilters(jobId, selectedDates.startDate, selectedDates.endDate);
    } else {
      if (selectedDates.startDate && selectedDates.endDate) {
        await fetchVehicleWithFilters(undefined, selectedDates.startDate, selectedDates.endDate);
      } else {
        fetchvehicleInfo(currentPage, searchTerm, pageSize);
      }
    }
  };

  const handleClearFilters = () => {
    setSelectedJobId('');
    setSelectedDates({ startDate: null, endDate: null });
    setSearchTerm('');
    setCurrentPage(1);
    if (activeTab === 'scanned') {
      fetchvehicleInfo(1, '', pageSize);
    }
  };

  const closeMismatchFlow = () => {
    setShowMismatchAlert(false);
    setPendingCompareArgs(null);
    setMismatchUseInsuranceCompare(false);
  };

  const handleCompareWorkOrder = async () => {
    if (activeTab !== 'scanned') {
      toast.error('Switch to Scanned Vehicles to compare with the insurance list.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in again.');
      return;
    }
    if (roleType !== 'superadmin') {
      toast.error('Only superadmin can compare work orders with the insurance list.');
      return;
    }

    if (selectedIds.length === 0) {
      toast.error('Select one or more vehicles using the checkboxes to compare.');
      return;
    }
    const scannedJobs = activeJob.filter((j) => selectedIds.includes(j.id));
    if (scannedJobs.length === 0) {
      toast.error('No vehicles to compare for this view.');
      return;
    }

    const jobIdsUnique = uniqueNumericJobIdsFromVehicles(scannedJobs);
    if (jobIdsUnique.length === 0) {
      toast.error('Could not determine job id for the selected vehicles.');
      return;
    }

    for (const jid of jobIdsUnique) {
      const row =
        scannedJobs.find((j) => Number(j.jobId ?? j.job?.id) === jid) ??
        scannedJobs[0];
      const jt =
        row?.job?.jobType ??
        row?.job?.job_type ??
        row?.jobType ??
        '';
      if (!isInsuranceJobTypeForInvoice(jt)) {
        toast(
          `This is not an insurance percentage job. Please select an insurance percentage job to compare work orders.`
        );
        return;
      }
    }

    try {
      const insuranceVehicles = await fetchAllInsuranceVehiclesByJobIds(jobIdsUnique, token);
      const { missingInScanned, missingInInsurance } = computeVinMismatch(
        scannedJobs,
        insuranceVehicles
      );
      if (missingInScanned.length === 0 && missingInInsurance.length === 0) {
        toast.success(
          jobIdsUnique.length > 1
            ? 'Scanned vehicles match the insurance lists for the selected jobs.'
            : 'Scanned vehicles match the insurance list for this job.'
        );
        return;
      }
      setMismatchUseInsuranceCompare(true);
      setPendingCompareArgs({ selectedJobs: scannedJobs, token, jobIds: jobIdsUnique });
      setMismatchData({ missingInScanned, missingInInsurance });
      setShowMismatchAlert(true);
    } catch (e) {
      console.error('Compare work order:', e);
      toast.error('Could not load insurance vehicles. Try again.');
    }
  };

  // ─── Shared table JSX (used in both tabs) ────────────────────────────────────
  const renderTable = () => {
    if (activeTab === 'insurance') {
      return (
        <>
          <div className="overflow-auto rounded-md">
            <table className="table w-full table-fixed">
              <thead>
                <tr>
                  <th className="w-[160px]">Job Name</th>
                  <th className="w-[160px]">Customer</th>
                  <th className="w-[150px]">VIN</th>
                  <th className="w-[220px]">Gross Settlement</th>
                  <th className="w-[220px]">Insurance Percentage (%) </th>
                  <th className="w-[240px]">Insurance File</th>
                </tr>
              </thead>
              <tbody>
                {insuranceLoading && insuranceVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <Loader />
                    </td>
                  </tr>
                ) : insuranceVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <Empty />
                    </td>
                  </tr>
                ) : (
                  insuranceVehicles.map((v: any) => (
                    <tr key={v.id}>
                      <td>{v?.job?.jobName || '–'}</td>
                      <td>{v?.job?.customer?.fullName || '–'}</td>
                      <td>{v?.vin || '–'}</td>
                      <td>{v?.grossSettlement || '–'}</td>
                      <td>{v?.job?.insurancePercentage || '–'}%</td>
                      <td>
                        {v?.job?.insuranceFile ? (
                          <a
                            href={v.job.insuranceFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#383d71] hover:underline break-all"
                          >
                            View File
                          </a>
                        ) : (
                          '–'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {insuranceTotalPages > 1 && (
            <Pagination
              currentPage={insuranceCurrentPage}
              totalPages={insuranceTotalPages}
              onPageChange={handleInsurancePageChange}
            />
          )}
        </>
      );
    }

    // scanned tab
    return (
      <>
        <div className="overflow-auto rounded-md">
          <table className="table w-full table-fixed">
            <thead>
              <tr>
                <th className="w-[50px]">
                  <label className="flex items-center cursor-pointer relative">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === activeJob.length && activeJob.length > 0}
                      className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[#fff]"
                      onChange={() =>
                        setSelectedIds(
                          selectedIds.length === activeJob.length ? [] : activeJob.map((cust) => cust.id)
                        )
                      }
                    />
                    <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </span>
                  </label>
                </th>
                <th className="w-[70px]" onClick={() => handleSort('serialNo')}>
                  Serial No
                  <SortIcon active={sortBy === 'serialNo'} direction={sortDirection} />
                </th>
                {/* <th className="w-[50px]" onClick={() => handleSort('id')}>
                  ID
                  <SortIcon active={sortBy === 'id'} direction={sortDirection} />
                </th> */}
                <th className="w-[120px] cursor-pointer select-none" onClick={() => handleSort('jobName')}>
                  Job Title
                  <SortIcon active={sortBy === 'jobName'} direction={sortDirection} />
                </th>
                <th className="w-[120px] cursor-pointer select-none" onClick={() => handleSort('fullName')}>
                  Customer Name
                  <SortIcon active={sortBy === 'fullName'} direction={sortDirection} />
                </th>
                {roleType !== 'single-technician' && (
                  <th className="w-[150px] cursor-pointer select-none" onClick={() => handleSort('technicianName')}>
                    Assigned Dent Tech
                    <SortIcon active={sortBy === 'technicianName'} direction={sortDirection} />
                  </th>
                )}
                {roleType !== 'single-technician' && (
                  <th className="w-[120px] cursor-pointer select-none" onClick={() => handleSort('techFlatRate')}>
                    Tech Flat Rate
                    <SortIcon active={sortBy === 'techFlatRate'} direction={sortDirection} />
                  </th>
                )}
                {roleType !== 'single-technician' && (
                  <th className="w-[130px] cursor-pointer select-none" onClick={() => handleSort('rIName')}>
                    Assigned R&I
                    <SortIcon active={sortBy === 'rIName'} direction={sortDirection} />
                  </th>
                )}
                {roleType !== 'single-technician' && (
                  <th className="w-[80px] cursor-pointer select-none" onClick={() => handleSort('rRate')}>
                    R&I
                    <SortIcon active={sortBy === 'rRate'} direction={sortDirection} />
                  </th>
                )}
                {/* {roleType !== 'single-technician' && <th className="w-[120px]">Total Expense</th>} */}
                <th className="w-[150px] cursor-pointer select-none" onClick={() => handleSort('vin')}>
                  VIN
                  <SortIcon active={sortBy === 'vin'} direction={sortDirection} />
                </th>
                <th className="w-[100px] cursor-pointer select-none" onClick={() => handleSort('startDate')}>
                  Start Date
                  <SortIcon active={sortBy === 'startDate'} direction={sortDirection} />
                </th>
                <th className="w-[80px] cursor-pointer select-none" onClick={() => handleSort('endDate')}>
                  End Date
                  <SortIcon active={sortBy === 'endDate'} direction={sortDirection} />
                </th>
                {roleType === 'single-technician' && (
                  <th className="w-[80px] cursor-pointer select-none" onClick={() => handleSort('labourCost')}>
                    Labour Cost
                    <SortIcon active={sortBy === 'labourCost'} direction={sortDirection} />
                  </th>
                )}
                {/* <th className="w-[130px]">Status</th> */}
                <th className="w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && activeJob?.length === 0 ? (
                <tr>
                  <td colSpan={roleType === 'single-technician' ? 10 : 12} className="text-center py-10">
                    <Loader />
                  </td>
                </tr>
              ) : activeJob?.length === 0 ? (
                <tr>
                  <td colSpan={roleType === 'single-technician' ? 10 : 12} className="text-center py-10">
                    <Empty />
                  </td>
                </tr>
              ) : (
                activeJob?.map((job, index) => renderRow(job, index))
              )}

              {/* {roleType !== 'single-technician' && (
                <tr>
                  <td colSpan={9} className="text-right font-semibold">
                    <span className="pr-[75px]">Total: ${totalExpense}</span>
                  </td>
                  <td colSpan={5} className="text-right font-semibold"></td>
                </tr>
              )} */}
            </tbody>
          </table>
        </div>

        {activeJob?.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </>
    );
  };

  return (
    <div className={`mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb items={[{ label: 'Work Order List', href: '/vehicle/listing' }]} />

      <div className="shadow-lg p-4 bg-white rounded-lg">
        <CommonHeader
          heading="Work Order List"
          onPageSizeChange={handlePageSizeChange}
          onSearch={(term) => setSearchTerm(term)}
          onExport={activeTab === 'scanned' ? downloadCSV : undefined}
          onImport={activeTab === 'scanned' ? handleImportCSV : undefined}
          userRole='Activejobs'
          buttonLabel="Create Vehicle / Work Order"
          buttonLink="/vehicle/create-vehicle"
          showDatePicker={activeTab === 'scanned'}
          onDateChange={activeTab === 'scanned' ? handleDateChange : undefined}
          onNewJobClick={handleNewJobClick}
          autoSelectFirstJob
          showClearFilters={true}
          onClearFilters={handleClearFilters}
          onStatusChange={(status) => {
            setWorkOrderStatus(status);
            fetchvehicleInfo(1, searchTerm, pageSize, { status });
          }}
          onCompareWorkOrderClick={
            roleType === 'superadmin' && activeTab === 'scanned'
              ? handleCompareWorkOrder
              : undefined
          }
          compareWorkOrderLabel="Compare work order"
          selectedRows={selectedIds}
        />

        {/* ─── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex border-b border-gray-200 mt-4 mb-4">
          <button
            onClick={() => setActiveTab('scanned')}
            className={`px-6 py-2.5 text-sm font-medium rounded-t-md transition-all duration-200 border border-b-0 -mb-px
              ${activeTab === 'scanned'
                ? 'bg-white border-gray-200 text-[var(--foreground)] font-semibold'
                : 'bg-gray-50 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
          >
            Scanned Vehicles
          </button>
          <button
            onClick={() => setActiveTab('insurance')}
            className={`px-6 py-2.5 text-sm font-medium rounded-t-md transition-all duration-200 border border-b-0 -mb-px ml-1
              ${activeTab === 'insurance'
                ? 'bg-white border-gray-200 text-[var(--foreground)] font-semibold'
                : 'bg-gray-50 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
          >
            Insurance Uploaded
          </button>
        </div>
        {/* ─────────────────────────────────────────────────────────────────── */}

        {/* Both tabs share the same table */}
        {renderTable()}
      </div>

      {showMismatchAlert && (
        <VehicleMismatchAlert
          mismatchData={mismatchData}
          showProceedAnyway={false}
          onCancel={closeMismatchFlow}
          onViewMissingVehicles={async () => {
            if (!mismatchUseInsuranceCompare || !pendingCompareArgs) return;
            const { selectedJobs, token, jobIds } = pendingCompareArgs;
            if (!token || !jobIds?.length) return;
            const insuranceVehicles = await fetchAllInsuranceVehiclesByJobIds(jobIds, token);
            setMismatchData(computeVinMismatch(selectedJobs, insuranceVehicles));
          }}
          onProceed={closeMismatchFlow}
        />
      )}
    </div>
  );
};

export default JobTable;
