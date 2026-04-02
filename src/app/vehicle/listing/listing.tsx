// components/JobTable.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

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
    setActiveJob((prev) => prev.filter((cust) => cust.id !== deletedId));
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
    opts?: { showFullScreenLoader?: boolean }
  ) => {
    const showLoader = opts?.showFullScreenLoader !== false;
    if (showLoader) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types') || "";
      const userId = localStorage.getItem('userID');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoint = query.trim()
        ? roleType === 'superadmin'
          ? `/api/vehicleInfo?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
          : `/api/vehicleInfo?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : roleType === 'superadmin' || roleType === 'manager'
          ? `/api/vehicleInfo?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`
          : `/api/vehicleInfo?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;

      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();

      if (response.ok) {
        const fetchedTechnicians: VehcileInfo[] = query.trim()
          ? data.data.vehicles || []
          : data.response.vehicles || [];
        setActiveJob(fetchedTechnicians);
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
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(lim));
        if (normalizedJobId) params.set('jobId', normalizedJobId);
        const q = (searchQuery ?? '').trim();
        if (q) params.set('search', q);

        const response = await fetch(`${apiBaseUrl}/fetchInsuranceVehiclesByJob?${params.toString()}`, {
          method: 'GET',
          headers,
        });

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
    const direction = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(direction);
    setSortBy(column);

    const sortedJobs = [...activeJob].sort((a, b) => {
      if (column === 'fullName') {
        const nameA = `${a?.customer?.fullName}`;
        const nameB = `${b?.customer?.fullName}`;
        return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (column === 'technicianName') {
        const nameF = `${a?.technician?.firstName} ${a?.technician?.lastName}`;
        const nameL = `${b?.technician?.firstName} ${b?.technician?.lastName}`;
        return direction === 'asc' ? nameF.localeCompare(nameL) : nameL.localeCompare(nameF);
      }
      if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
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
    const formattedData = selectedJobs.map((jobData) => {
      const technicianRates = jobData.assignedTechnicians.map((tech: any) => {
        const vt = tech.VehicleTechnician || {};
        return `${tech.firstName} ${tech.lastName} - TechnicianFlatRate: ${vt.techFlatRate || ''}, RIRR: ${vt.rRate || ''}`;
      }).join(', ');
      return {
        id: jobData.id, vin: jobData.vin, customer: `${jobData?.customer?.fullName}`,
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
      const manualHeaders = [
        'id', 'vin', 'customer', 'jobName', 'assignCustomer', 'bodyClass', 'color',
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
            const payloadData = cleanedData.map(row => {
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
              return { ...row, technicians, jobDescription: jobDescriptions, assignTechnicians: undefined };
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
        setActiveJob(data.vehicles.updatedVehicles || []);
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

  const renderRow = (job: any) => {
    const isChecked = selectedIds.includes(job.id);
    const roleType = localStorage.getItem('types') || "";
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
        <td><Link href={`/vehicle/view?vehicleId=${job.id}`} className='hover:underline'>{job.id}</Link></td>
        <td>{job?.jobName}</td>
        <td>{job?.customer?.fullName}</td>
        {roleType !== 'single-technician' && (
          <td>
            {job?.assignedTechnicians?.filter((tech: any) => tech.techType === 'technician')?.map((tech: any) => (
              <div key={tech.id} className="capitalize">{tech.firstName} {tech.lastName}</div>
            ))}
          </td>
        )}
        {roleType !== 'single-technician' && (
          <td>
            {job?.assignedTechnicians?.length > 0 ? (
              job?.assignedTechnicians?.map((tech: any) => (
                <div key={tech.id} className="capitalize">
                  {tech.VehicleTechnician?.techFlatRate && tech.VehicleTechnician?.techFlatRate !== ''
                    ? `$${tech.VehicleTechnician?.techFlatRate}`
                    : <span className="text-gray-500 text-sm"></span>}
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
                  {tech.VehicleTechnician?.rRate && tech.VehicleTechnician?.rRate !== ''
                    ? `$${tech.VehicleTechnician?.rRate}`
                    : <span className="text-gray-500 text-sm"></span>}
                </div>
              ))
            ) : <span className="text-gray-500 text-sm"></span>}
          </td>
        )}
        {roleType !== 'single-technician' && (
          <td>
            {job?.totalCombined && job?.totalCombined !== ''
              ? `$${job?.totalCombined}`
              : <span className="text-gray-500 text-sm"></span>}
          </td>
        )}
        <td>{job?.vin}</td>
        <td>{job.startDate ? new Date(job.startDate).toLocaleDateString() : ''}</td>
        <td>{job.endDate ? new Date(job.endDate).toLocaleDateString() : ''}</td>
        {roleType === 'single-technician' && (
          <td>{job.labourCost !== null && (`$${job.labourCost || '-'}`) || '-'}</td>
        )}
        <td>
          {canCreate && (
            <span
              onClick={() => toggleApproval(job.id, job.vehicleStatus)}
              style={{ cursor: 'pointer' }}
              className={`badge ${job.vehicleStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
            >
              {job.vehicleStatus ? 'Completed' : 'In Progress'}
            </span>
          )}
        </td>
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
                      <td>{v?.job?.customer.fullName || '–'}</td>
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
                <th className="w-[50px]" onClick={() => handleSort('id')}>
                  ID
                  {sortBy === 'id' && (
                    <span className="ml-2 text-[#000]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
                <th className="w-[120px]">Job Title</th>
                <th className="w-[120px]">Customer Name</th>
                {roleType !== 'single-technician' && <th className="w-[150px]">Assigned Dent Tech</th>}
                {roleType !== 'single-technician' && <th className="w-[120px]">Tech Flat Rate</th>}
                {roleType !== 'single-technician' && <th className="w-[130px]">Assigned RR/I/R</th>}
                {roleType !== 'single-technician' && <th className="w-[80px]">RR/I/R</th>}
                {roleType !== 'single-technician' && <th className="w-[120px]">Total Expense</th>}
                <th className="w-[150px]">VIN</th>
                <th className="w-[100px]">Start Date</th>
                <th className="w-[80px]">End Date</th>
                {roleType === 'single-technician' && <th className="w-[80px]">Labour Cost</th>}
                <th className="w-[130px]">Status</th>
                <th className="w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && activeJob?.length === 0 ? (
                <tr>
                  <td colSpan={roleType === 'single-technician' ? 10 : 14} className="text-center py-10">
                    <Loader />
                  </td>
                </tr>
              ) : activeJob?.length === 0 ? (
                <tr>
                  <td colSpan={roleType === 'single-technician' ? 10 : 14} className="text-center py-10">
                    <Empty />
                  </td>
                </tr>
              ) : (
                activeJob?.map((job) => renderRow(job))
              )}

              {roleType !== 'single-technician' && (
                <tr>
                  <td colSpan={9} className="text-right font-semibold">
                    <span className="pr-[75px]">Total: ${totalExpense}</span>
                  </td>
                  <td colSpan={5} className="text-right font-semibold"></td>
                </tr>
              )}
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
          showClearFilters={true}
          onClearFilters={handleClearFilters}
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
    </div>
  );
};

export default JobTable;
