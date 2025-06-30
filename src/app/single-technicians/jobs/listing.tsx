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
import 'react-tooltip/dist/react-tooltip.css';
import Papa from 'papaparse';
import Link from 'next/link';
import Image from 'next/image';
import Eye from '../../../../public/eye.svg'

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here

interface VehcileInfo {
  id: string;
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

    // Update the state with the new page size and set the current page accordingly
    setPageSize(size);
    setCurrentPage(newPage); // Set the current page to the last valid page
  };

  const fetchJobs = async (page = 1, query = '', limit = pageSize) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const roleType = 'single-technician';
      const userId = localStorage.getItem('userID');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
       const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Build the endpoint with the current page and page size
      const endpoint = query.trim()
        ? roleType === 'single-technician'
          ? `/api/vehicleInfo?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
          : `/api/vehicleInfo?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : roleType === 'single-technician'
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
        setTotalPages(data.response?.totalPages || 1);
        setTotalJobs(data.jobs?.totalJobs || 0); // Ensure totalJobs is set correctly

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

 

  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };

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

      const subTotal = jobData.jobDescription.reduce((sum: number, item: any) => {
        return sum + Number(item.cost || 0);
      }, 0);
      const technician = jobData.technicians?.[0] || {};
      const simpleFlatRate = !isNaN(Number(jobData?.assignedTechnicians?.[0].VehicleTechnician.simpleFlatRate)) && Number(jobData?.assignedTechnicians?.[0].VehicleTechnician.simpleFlatRate) > 0
        ? Number(jobData?.assignedTechnicians?.[0].VehicleTechnician.simpleFlatRate)
        : (!isNaN(Number(technician.simpleFlatRate)) ? Number(technician.simpleFlatRate) : 0);

      const amountPercentage = !isNaN(Number(jobData?.assignedTechnicians?.[0].VehicleTechnician.amountPercentage)) && Number(jobData?.assignedTechnicians?.[0].VehicleTechnician.amountPercentage) > 0
        ? Number(jobData?.assignedTechnicians?.[0].VehicleTechnician.amountPercentage)
        : (!isNaN(Number(technician.amountPercentage)) ? Number(technician.amountPercentage) : 0);

      // Step 3: Calculate percentage amount
      const percentageAmount = (amountPercentage * subTotal) / 100;
      const totalCost = subTotal + simpleFlatRate + percentageAmount;

      return {
        id: jobData.id,
        vin: jobData.vin,
        customer: `${jobData?.customer?.fullName}`,
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
        jobDescription: jobData.jobDescription.map((jobDescription: any) => `${jobDescription.jobDescription}`).join(', '),
        cost: jobData.jobDescription.map((cost: any) => `${cost.cost}`).join(', '),
        subTotal: subTotal.toFixed(2),
        totalCost: totalCost.toFixed(2),

      };
    });
    csvExporter.generateCsv(formattedData);
  }

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
      'id', 'vin', 'customer', 'assignCustomer', 'bodyClass', 'color',
      'make', 'model', 'vehicleType',
      'modelYear', 'vehicleDescriptor', 'manufacturerName',
      'plantCompanyName', 'plantCountry', 'plantState', 'deletedStatus',
      'notes', 'technicians', 'assignTechnicians',
      'jobDescription', 'cost', 'subTotal', 'totalCost'
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
            // Process technicians data
            const technicianNames = row.technicians ? row.technicians.split(',').map((name: any) => name.trim()) : [];
            const technicianIds = row.assignTechnicians ? row.assignTechnicians.split(',').map((id: any) => id.trim()) : [];
            
            // Process simpleFlatRate - ensure it's never null
            let simpleFlatRates = {};
            if (row.simpleFlatRate) {
              try {
                // Try parsing as JSON first
                const parsed = JSON.parse(row.simpleFlatRate);
                if (parsed && typeof parsed === 'object') {
                  simpleFlatRates = parsed;
                } else if (!isNaN(Number(row.simpleFlatRate))) {
                  // Handle case where it's just a number
                  simpleFlatRates = { default: Number(row.simpleFlatRate) };
                }
              } catch (e) {
                // If parsing fails, try to extract numeric value
                const numericValue = Number(String(row.simpleFlatRate).replace(/[^0-9.]/g, ''));
                if (!isNaN(numericValue)) {
                  simpleFlatRates = { default: numericValue };
                }
              }
            }

            const technicians = technicianNames.map((name: any, index: any) => {
              // Create technician object with proper fallbacks
              return {
                id: technicianIds[index] || null,
                name: name,
              };
            });

            // Process jobDescription and cost
            const jobDescriptions = row.jobDescription 
              ? row.jobDescription.split(',').map((desc: any, idx: any) => ({
                  jobDescription: desc.trim(),
                  cost: row.cost?.split(',')[idx]?.trim() || '0'
                }))
              : [];

            return {
              ...row,
              technicians: technicians,
              jobDescription: jobDescriptions,
              // Clean up unused fields
              assignTechnicians: undefined,
              cost: undefined
            };
          }).filter(row => 
            // Remove any rows that might still be headers
            !manualHeaders.some(header => row[header] === header)
          );

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










  const handleCheckboxChange = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const calculateTechnicianTotalCost = (jobData: any) => {
    if (!jobData) return 0;

    // Calculate subtotal from jobDescription
    let subtotalcost = 0;
    if (Array.isArray(jobData.jobDescription)) {
      subtotalcost = jobData.jobDescription.reduce((total: number, item: any) => {
        let parsedItem = item;
        if (typeof item === 'string') {
          try {
            parsedItem = JSON.parse(item);
          } catch {
            return total;
          }
        }
        const cost = parseFloat(parsedItem?.cost || '0');
        return total + (isNaN(cost) ? 0 : cost);
      }, 0);
    }

    // If no technicians, return just the subtotal
    if (!Array.isArray(jobData.assignedTechnicians)) {
      return subtotalcost;
    }

    let technicianTotal = subtotalcost;

    // Process each technician
    jobData.assignedTechnicians.forEach((tech: any) => {
      const techDetails = tech.VehicleTechnician;
      if (!techDetails) return;

      // Parse simpleFlatRate
      let simpleFlatRate = 0;
      try {
        if (techDetails.simpleFlatRate && techDetails.simpleFlatRate !== "null") {
          const parsedRate = JSON.parse(techDetails.simpleFlatRate);

          if (techDetails.payRate === "Pay Per Vehicles" && techDetails.payVehicleType) {
            // For Pay Per Vehicles, get the rate for the specific vehicle type
            simpleFlatRate = parseFloat(parsedRate[techDetails.payVehicleType]) || 0;
          } else if (typeof parsedRate === 'object') {
            // For other payment methods, try to get a technician rate
            const technicianRate = parsedRate['technician'];
            simpleFlatRate = parseFloat(technicianRate) || 0;
          } else if (typeof parsedRate === 'number') {
            simpleFlatRate = parsedRate;
          }
        }
      } catch (error) {
        console.error('Error parsing simpleFlatRate:', error);
        simpleFlatRate = 0;
      }

      // Parse amountPercentage safely
      const amountPercentage = parseFloat(
        techDetails?.amountPercentage === "null" ? "0" : techDetails?.amountPercentage || "0"
      );

      // Add costs based on payment method
      if (techDetails.payRate === "Simple Flat Rate" && simpleFlatRate > 0) {
        technicianTotal += simpleFlatRate;
      }
      else if (techDetails.payRate === "Pay Per Vehicles" && simpleFlatRate > 0) {
        technicianTotal += simpleFlatRate;
      }
      else if (amountPercentage > 0) {
        technicianTotal += (amountPercentage * subtotalcost) / 100;
      }
    });

    return technicianTotal;
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
        <td> <Link href={`/jobs/view?jobId=${job.id}&ActiveWorkOrder`} className='hover:underline'>{job.jobId}</Link></td>


        <td> <Link href={`/jobs/view?jobId=${job.id}&ActiveWorkOrder`} className='hover:underline capitalize'>{job?.customer?.fullName}</Link></td>
        {/* <td><a className="hover:underline" href={`tel:${job?.customer?.phoneNumber}`}>{job?.customer?.phoneNumber}</a></td> */}
        <td>  {job?.assignedTechnicians?.map((tech: any) => (
          <div key={tech.id} className="capitalize">
            {tech.firstName} {tech.lastName},
          </div>
        ))}</td>
        {/* <td>{job?.assignedTechnicians?.map((tech: any) => (
          <div key={tech.id}>
            <a className="hover:underline" href={`tel:${tech.technicians}`}>
              {tech.phoneNumber}
            </a>
          </div>
        ))}</td> */}
        <td>{job?.vin}</td>
        <td>{job?.make}</td>
        <td>{job?.model}</td>
        <td>{job?.modelYear}</td>
        <td>${(job.simpleFlatRate && !isNaN(simpleFlatRate) && simpleFlatRate > 0 ? subtotalcost : totalCost).toFixed(2)}</td>
         {roleType !== 'single-technician' && (
          <td>
            {(() => {
              // Get the first technician's simpleFlatRate if available
              const technician = job.technicians?.[0] || {};
              const technicianFlatRate = !isNaN(Number(technician.simpleFlatRate))
                ? Number(technician.simpleFlatRate)
                : 0;

              // Use labourCost if available, otherwise use technician's flat rate
              const labourCost = Number(job?.labourCost || technicianFlatRate);

              if (labourCost === 0) {
                const tooltipId = `tooltip-${job.id}-labour`;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'red' }}>
                    Per job
                  </div>
                );
              }

              return `$${labourCost.toFixed(2)}`;
            })()}
          </td>
        )}
 
        {roleType !== 'single-technician' && (
          <td>
            {(() => {
              if (!job) return null;

              const subtotalcost = (job?.jobDescription || []).reduce((sum: number, job: any) => {
                const parsedJob = job;
                return sum + Number(parsedJob.cost); // Ensure cost is treated as a number
              }, 0);


              // Get the first technician's simpleFlatRate if available
              const technician = job.technicians?.[0] || {};
              const technicianFlatRate = !isNaN(Number(technician.simpleFlatRate))
                ? Number(technician.simpleFlatRate)
                : 0;

              // Use labourCost if available, otherwise use technician's flat rate
              const labourCost = Number(job.labourCost || technicianFlatRate);

              const totalCost = subtotalcost + labourCost;

              if (subtotalcost === 0) {
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'red' }}>
                    Per Job
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  ${totalCost.toFixed(2)}
                </div>
              );
            })()}
          </td>

        )}


        <td>
          {canCreate && (

            <span  style={{ cursor: 'pointer' }}
              className={`badge ${job.vehicleStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
            >
              {job.vehicleStatus ? 'Completed' : 'In Progress'}
            </span>
          )}

        </td> 
          
          <td className='text-left'>

          <Link href={`/reporting/view?vehicleId=${job.id}&jobStatus`} >
            <Image alt='eye' src={Eye} className='w-[16px] ' data-tooltip-id="view"
              data-tooltip-content="View" />
          </Link>
          <Tooltip id="view" place="top" />
        </td> 
      </tr>
    )
  };

  return (
    <div className={` mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'All Work Order List', href: '/vehicle/vehicle' }
        ]}
      />

      <CommonHeader heading="All Work Order List" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='Activejobs' buttonLabel="" buttonLink="" />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[35px]">
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
              <th className="w-[100px]" onClick={() => handleSort('id')}>
                Job ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[120px]" onClick={() => handleSort('fullName')}>
                Customer Name
                {sortBy === 'fullName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              {/* <th className="w-[120px]">
                Customer Number
              </th> */}
              <th className="w-[150px]" >
                Assigned Technician
              </th>
              <th className="w-[140px]">VIN</th>
              <th className="w-[80px]">Make</th>
              <th className="w-[80px]">Model</th>
              <th className="w-[80px]">Year</th>
              <th className="w-[100px]">Sub Total Cost</th>
              <th className="w-[80px]">R/I R/R</th>
              <th className="w-[80px]">Total Cost</th>
              <th className="w-[120px]">Status</th>
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
  );
};

export default JobTable;
