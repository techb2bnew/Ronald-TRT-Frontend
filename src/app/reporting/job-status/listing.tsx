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
import Eye from '../../../../public/eye.svg'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here

interface VehcileInfo {
  id: string;
  jobName: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
  Role: { name: string };
}
const JobTable: React.FC = () => {
  const [activeJob, setActiveJob] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Manage sorting column state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isCollapsed } = useSidebar();
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [roleType, setRoleType] = useState<string | null>(null);

  useEffect(() => {
    // Ensure this code runs only on the client-side (after the component mounts)
    const storedRoleType = localStorage.getItem('types');
    setRoleType(storedRoleType); // Set the roleType from localStorage
  }, []);

  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
    // Implement search logic here
  };
  const handleDeleteSuccess = (deletedId: string) => {
    // toast.success('Technician deleted successfully');

    // ✅ Remove the deleted technician from the table
    setActiveJob((prev) => prev.filter((cust) => cust.id !== deletedId));
  };


 const handlePageSizeChange = (size: number) => {
  // Calculate the total number of pages based on the current totalJobs and the new pageSize
  const newTotalPages = Math.ceil(totalJobs / size);

  // If the current page is greater than the new total pages, reset it to the last page
  let newPage = currentPage;
  if (newPage > newTotalPages) {
    newPage = newTotalPages;
  }

  // Ensure the page number is not less than 1
  if (newPage < 1) {
    newPage = 1;
  }

  // Update the state with the new page size and set the current page accordingly
  setPageSize(size);
  setCurrentPage(newPage); // Set the current page to the last valid page
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

      // Build the endpoint with the current page and page size
      const endpoint = query.trim()
        ? roleType === 'superadmin' || roleType === 'manager'
          ? `${apiUrl}/searchVehicalInfo?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
          : `${apiUrl}/searchVehicalInfo?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : roleType === 'superadmin' || roleType === 'manager'
          ? `${apiUrl}/fetchVehicalInfo?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`
          : `${apiUrl}/fetchVehicalInfo?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;


      console.log('Fetching API with endpoint:', endpoint);  // Debugging endpoint

      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();

      console.log('API response data:', data);  // Debugging API response

      if (response.ok) {
        const fetchedTechnicians: VehcileInfo[] = query.trim()
          ? data.data.vehicles || []
          : data.jobs.vehicles || [];
        setActiveJob(fetchedTechnicians);
        setTotalPages(data.jobs?.totalPages || 1);
        setTotalJobs(data.jobs?.totalVehicles || 0); // Ensure totalJobs is set correctly

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



  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchJobs(currentPage, searchTerm, pageSize); // Make sure currentPage and pageSize are used
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, pageSize]);






  // Function to handle sorting logic
  const handleSort = (column: string) => {
    const direction = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(direction);
    setSortBy(column);

    setActiveJob(prevJobs => {
      return [...prevJobs].sort((a, b) => {
        // Handle job name sorting
        if (column === 'jobName') {
          const nameA = a?.jobName || '';
          const nameB = b?.jobName || '';
          return direction === 'asc'
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        }

        // Handle customer name sorting
        if (column === 'fullName') {
          const nameA = a?.customer?.fullName || '';
          const nameB = b?.customer?.fullName || '';
          return direction === 'asc'
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        }

        // Handle other columns
        const valueA = a[column] || '';
        const valueB = b[column] || '';

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return direction === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }

        // For numbers or other types
        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    });
  };



  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };







  const [permissions, setPermissions] = useState<any[]>([]);

  useEffect(() => {
    const storedPermissions = localStorage.getItem("permissions");

    if (storedPermissions) {
      try {
        const parsedPermissions = JSON.parse(storedPermissions);
        setPermissions(Array.isArray(parsedPermissions) ? parsedPermissions : []);
        console.log("✅ Loaded Permissions:ssss", parsedPermissions);
      } catch (error) {
        console.error("❌ Failed to parse permissions:", error);
      }
    } else {
      // console.log("⚠️ No permissions found in localStorage. Showing all icons.");
    }
  }, []);

  // ✅ Function to check permission based on role and action
  const hasPermission = (action: string) => {
    if (permissions.length === 0) return true; // If no permissions exist, show all icons

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
      useKeysAsHeaders: true, // Use object keys as headers
    };

    const csvExporter = new ExportToCsv(csvOptions);

    const formattedData = selectedJobs.map((jobData) => {
      const firstTech = jobData.assignedTechnicians?.[0] || {};
      const vt = firstTech.VehicleTechnician || {};

      // Extract technician data including techFlatRate and rRate
      const technicianRates = jobData.assignedTechnicians.map((tech: any) => {
        const vt = tech.VehicleTechnician || {};
        return `${tech.firstName} ${tech.lastName} - TechnicianFlatRate: ${vt.techFlatRate || ''}, RIRR: ${vt.rRate || ''}`;
      }).join(', ');
      return {
        id: jobData.id,
        vin: jobData.vin,
        customer: `${jobData?.customer?.fullName}`,
        jobName: jobData.jobName,
        assignCustomer: jobData?.customer?.id,
        bodyClass: jobData.bodyClass,
        color: jobData.color,
        make: jobData.make,
        model: jobData.model,
        vehicleType: jobData.vehicleType,
        'modelYear': jobData.modelYear,
        'vehicleDescriptor': jobData.vehicleDescriptor,
        'manufacturerName': jobData.manufacturerName,
        'plantCompanyName': jobData.plantCompanyName,
        'plantCountry': jobData.plantCountry,
        'plantState': jobData.plantState,
        deletedStatus: jobData.deletedStatus,
        notes: jobData.notes,
        technicians: jobData.assignedTechnicians.map((tech: any) => `${tech.firstName} ${tech.lastName}`).join(', '),
        assignTechnicians: jobData.assignedTechnicians.map((techId: any) => `${techId.id}`).join(', '),
        jobDescription: jobData.jobDescription.join(''),
        technicianRates: technicianRates,
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
      let text = (e.target?.result as string)
        .replace(/^\uFEFF/, '') // Remove BOM
        .trimStart(); // Remove leading whitespace/newlines

      const manualHeaders = [
        'id', 'vin', 'customer', 'jobName', 'assignCustomer', 'bodyClass', 'color',
        'make', 'model', 'vehicleType',
        'modelYear', 'vehicleDescriptor', 'manufacturerName',
        'plantCompanyName', 'plantCountry', 'plantState', 'deletedStatus',
        'notes', 'technicians', 'assignTechnicians',
        'jobDescription', 'technicianRates'
      ];

      Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        complete: async (result) => {
          const rows = result.data as string[][];

          const cleanedData = rows
            .slice(1) // Skip raw header row
            .map((row) => {
              const obj: any = {};
              manualHeaders.forEach((key, idx) => {
                let value = row[idx];
                value = typeof value === 'string' ? value.trim() : value;
                obj[key] = value;
              });
              return obj;
            })
            .filter((row) => {
              const isHeaderRow = Object.entries(row).every(([key, val]) => key === val);
              const hasData = Object.values(row).some((val) => val && val !== '');
              return !isHeaderRow && hasData;
            });

          try {
            const payloadData = cleanedData.map(row => {
              // Extract technician names and IDs
              const technicianNames = row.technicians ? row.technicians.split(',').map((name: any) => name.trim()) : [];
              const technicianIds = row.assignTechnicians ? row.assignTechnicians.split(',').map((id: any) => id.trim()) : [];

              // Extract rate strings using regex for accurate FlatRate and Rate capture
              const rateChunks = row.technicianRates
                ? row.technicianRates.match(/([^-]+- TechnicianFlatRate:\s*[^,]*, RIRR:\s*[^,]*)(?=, [^-]+- TechnicianFlatRate:|$)/g)
                : [];

              const technicians = technicianNames.map((name: any, index: number) => {
                let techFlatRate = '';
                let rRate = '';

                if (rateChunks && rateChunks[index]) {
                  const match = rateChunks[index].match(/- TechnicianFlatRate:\s*(.*?), RIRR:\s*(.*)/);
                  techFlatRate = match?.[1]?.trim() || '';
                  rRate = match?.[2]?.trim() || '';
                }

                return {
                  id: technicianIds[index] || null,
                  name,
                  techFlatRate,
                  rRate,
                };
              });

              // Handle jobDescription array
              const jobDescriptions = row.jobDescription
                ? row.jobDescription.split(',').map((desc: any) => desc.trim())  // Split by commas and trim each description
                : [];

              return {
                ...row,
                technicians,
                jobDescription: jobDescriptions,
                assignTechnicians: undefined, // cleanup unused field
              };
            }).filter(row =>
              !manualHeaders.some(header => row[header] === header)
            );

            // Send payload to backend
            const response = await axios.post(
              `/api/importVehicle`,
              { data: payloadData },
              { headers }
            );

            toast.success('CSV Import Successful!');
            fetchJobs(currentPage, searchTerm, pageSize);
          } catch (error: unknown) {
            console.error('❌ Import failed:', error);
            if (axios.isAxiosError(error)) {
              toast.error(error.response?.data?.error || error.message);
            } else if (error instanceof Error) {
              toast.error(error.message);
            } else {
              toast.error('An unknown error occurred');
            }
          }
          setLoading(false);
        },
        error: (err: any) => {
          console.error('❌ CSV Parse error:', err);
          toast.error('Error parsing CSV file');
          setLoading(false);
        },
      });
    };

    reader.readAsText(file);
  };






  const handleCheckboxChange = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Store selected job ID and dates for combined filter
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<{ startDate: string | null, endDate: string | null }>({
    startDate: null,
    endDate: null
  });

  // Function to format the date as DD-MM-YYYY
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Combined filter function for jobId and date
  const fetchVehicleWithFilters = async (jobId?: string, startDate?: string | null, endDate?: string | null) => {
    const token = localStorage.getItem('token');
    const roleType = localStorage.getItem('types') || "";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    try {
      if (!token) {
        console.error("No token found");
        return;
      }

      setLoading(true);

      const payload: { [key: string]: any } = {
        roleType: roleType,
      };

      // Add jobId if available
      if (jobId) {
        payload.jobId = jobId;
      }

      // Add dates if available
      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }

      console.log('Filter payload:', payload);

      const response = await fetch(`${apiUrl}/vehicleJobNameAndDateFilter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status) {
        setActiveJob(data.vehicles.updatedVehicles || []);
      } else {
        console.error("Failed to apply filter:", data.error || 'Unknown error');
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
      
      // Call combined filter with current jobId and new dates
      await fetchVehicleWithFilters(selectedJobId || undefined, startDate, endDate);
    } else {
      // Reset dates
      setSelectedDates({ startDate: null, endDate: null });
      
      // If jobId is selected, filter by jobId only, otherwise fetch all
      if (selectedJobId) {
        await fetchVehicleWithFilters(selectedJobId, null, null);
      } else {
        fetchJobs(currentPage, searchTerm, pageSize);
      }
    }
  };

  const handleNewJobClick = async (jobId: string) => {
    console.log(jobId, 'jobId');
    
    // Update selected job ID
    setSelectedJobId(jobId);
    
    if (jobId) {
      // Call combined filter with jobId and current dates
      await fetchVehicleWithFilters(jobId, selectedDates.startDate, selectedDates.endDate);
    } else {
      // If no jobId, check if dates are selected
      if (selectedDates.startDate && selectedDates.endDate) {
        await fetchVehicleWithFilters(undefined, selectedDates.startDate, selectedDates.endDate);
      } else {
        // Fetch all if no filters
        fetchJobs(currentPage, searchTerm, pageSize);
      }
    }
  };

  // Clear all filters handler
  const handleClearFilters = () => {
    setSelectedJobId('');
    setSelectedDates({ startDate: null, endDate: null });
    setSearchTerm('');
    setCurrentPage(1);
    fetchJobs(1, '', pageSize);
  };


  const renderRow = (job: any) => {
    const isChecked = selectedIds.includes(job.id);
    const roleType = localStorage.getItem('types') || "";

    const subtotalcost = (job?.jobDescription || []).reduce((sum: number, job: any) => {
      const parsedJob = job;
      return sum + Number(parsedJob.cost); // Ensure cost is treated as a number
    }, 0);
    const simpleFlatRate = Number(job?.simpleFlatRate);
    const totalCost = !isNaN(simpleFlatRate) && simpleFlatRate > 0
      ? subtotalcost + simpleFlatRate
      : subtotalcost;
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
        <td> <Link href={`/vehicle/view?vehicleId=${job.id}`} className='hover:underline'> {job?.id}</Link> </td>

        <td>{job?.jobName}</td>
        <td>  {job?.customer?.fullName} </td>
        {/* <td><a className="hover:underline" href={`tel:${job?.customer?.phoneNumber}`}>{job?.customer?.phoneNumber}</a></td> */}
        
         <td>
          {job?.assignedTechnicians
            ?.filter((tech: any) => tech.techType === 'technician')
            ?.map((tech: any) => (
              <div key={tech.id} className="capitalize">
                {tech.firstName} {tech.lastName}
              </div>
            ))}
        </td>
        {roleType !== 'single-technician' && (
          <td>
            {job?.assignedTechnicians?.length > 0 ? (
              job?.assignedTechnicians?.map((tech: any) => (
                <div key={tech.id} className="capitalize">
                  {tech.VehicleTechnician?.techPercentageCalculatedAmount && tech.VehicleTechnician?.techPercentageCalculatedAmount !== ''
                    ? `$${tech.VehicleTechnician?.techPercentageCalculatedAmount}`
                    : <span className="text-gray-500 text-sm"></span>}
                </div>
              ))
            ) : <span className="text-gray-500 text-sm"></span>}
          </td>
        )}
        <td>
          {job?.assignedTechnicians
            ?.filter((tech: any) => tech.techType === 'R/I/R/R')
            ?.map((tech: any) => (
              <div key={tech.id} className="capitalize">
                {tech.firstName} {tech.lastName}
              </div>
            ))}
        </td>


        {roleType !== 'single-technician' && (
          <td>
            {job?.assignedTechnicians?.length > 0 ? (
              job?.assignedTechnicians?.map((tech: any) => (
                <div key={tech.id} className="capitalize">
                  {tech.VehicleTechnician?.rPercentageCalculatedAmount && tech.VehicleTechnician?.rPercentageCalculatedAmount !== ''
                    ? `$${tech.VehicleTechnician?.rPercentageCalculatedAmount}`
                    : <span className="text-gray-500 text-sm"></span>}
                </div>
              ))
            ) : <span className="text-gray-500 text-sm"></span>}
          </td>
        )}
        {/* <td>${job?.totalCombined}</td> */}

        <td>{job?.vin}</td>
        <td>{job.startDate ? new Date(job.startDate).toLocaleDateString() : ''}</td>
        <td>{job.endDate ? new Date(job.endDate).toLocaleDateString() : ''}</td>
         
        <td>
          {canCreate && (

            <span  
              className={`badge ${job.vehicleStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
            >
              {job.vehicleStatus ? 'Completed' : 'In Progress'}
            </span>
          )}

        </td>

        <td className='text-left'>

          <TableActions
            editRoute={`/vehicle/create-vehicle?vahicleId=${job.id}`}
            deleteRoute={`/api/deleteVehicle`}  // Pass the correct endpoint
            viewRoute={`/vehicle/view?vehicleId=${job.id}`}
            idKey="vehicleId"
            userRole='Activejobs'
            itemId={job.id}  // Pass the technician ID
            onDeleteSuccess={() => handleDeleteSuccess(job.id)}
          />
        </td>
      </tr>
    )
  };

  return (
    <div className={` mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'All Work Order List', href: '/vehicle/listing' }
        ]}
      />
      <div className="shadow-lg p-4 bg-white rounded-lg">
      <CommonHeader heading="All Work Order List" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='Activejobs' buttonLabel="" buttonLink="" showDatePicker={true}
        onDateChange={handleDateChange} onNewJobClick={handleNewJobClick} showClearFilters={true} onClearFilters={handleClearFilters} />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[50px]">
                <label className="flex items-center cursor-pointer relative">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === activeJob.length}
                    className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[#fff]"

                    onChange={() =>
                      setSelectedIds(
                        selectedIds.length === activeJob.length ? [] : activeJob.map((cust) => cust.id)
                      )
                    }
                  />
                  <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </span>
                </label>
              </th>
              <th className="w-[80px]" onClick={() => handleSort('id')}>
                Job ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-[#000]' : 'text-[#000]'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[100px]"   >Job Title
              </th>
              <th className="w-[120px]"  >
                Customer Name
              </th>
              {/* <th className="w-[120px]">
                Customer Number
              </th> */}
              <th className="w-[150px]" >
                Assigned Dent Tech
              </th>
              {roleType !== 'single-technician' && (
                <th className="w-[80px]">Tech Flat Rate</th>
              )}
              <th className="w-[130px]" >
                Assigned R&I
              </th>
              {roleType !== 'single-technician' && (
                <th className="w-[80px]">R&I</th>
              )}
              {/* {roleType !== 'single-technician' && (
                <th className="w-[80px]">Total Expense</th>
              )} */}
              <th className="w-[160px]">VIN</th>
              <th className="w-[80px]">Start Date</th>
              <th className="w-[80px]">End Date</th>
              <th className="w-[130px]">Status</th>
              <th className="w-[100px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : activeJob.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center py-10">
                  <Empty />
                </td>
              </tr>
            ) : (
              activeJob.map((job) => renderRow(job))
            )}
          </tbody>
        </table>
      </div>
      {activeJob.length > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
    </div>
  );
};

export default JobTable;
