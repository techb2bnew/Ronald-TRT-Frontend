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

interface Jobs {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
  vehicles: [];
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
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types') || "";
      const userId = localStorage.getItem('userID');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Build the endpoint with the current page and page size
      const endpoint = query.trim()
        ? roleType === 'superadmin' || roleType === 'manager'
          ? `/api/jobListing?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}&limit=${limit}&page=${page}`
          : `/api/jobListing?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}&limit=${limit}&page=${page}`
        : roleType === 'superadmin'
          ? `/api/jobListing?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`
          : `/api/jobListing?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;

      console.log('Fetching API with endpoint:', endpoint);  // Debugging endpoint

      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();

      console.log('API response data:', data);  // Debugging API response

      if (response.ok) {
        const fetchedJobs: Jobs[] = query.trim() ? data.ActiveJob || [] : data.jobs?.jobs || [];
        const jobsWithVehicleCount = fetchedJobs.map(job => ({
          ...job,
          vehicleCount: job.vehicles ? job.vehicles.length : 0  // Count vehicles for each job
        }));

        setActiveJob(jobsWithVehicleCount);
        setTotalPages(data.jobs?.totalPages || 1);
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
      filename: 'Account Reports',
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Account Reports',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true, // Use object keys as headers
    };

    const csvExporter = new ExportToCsv(csvOptions);

    const formattedData = selectedJobs.map((jobData) => {
       
      return {
        id: jobData.id,
        customer: `${jobData?.customer?.fullName}`,
        jobName: jobData.jobName,
        assignCustomer: jobData?.customer?.id,
        manager: `${jobData.manager.firstName} ${jobData.manager.lastName}`,
        assignManager: `${jobData.manager.id}`,
        estimatedCost: jobData.estimatedCost, 
        totalFlatRate: jobData.totalFlatRate,
        totalRRate: jobData.totalRRate,
        totalCombined: jobData.totalCombined,
        estimatedProfitLoss: jobData.estimatedProfitLoss,
        actualProfitLoss: jobData.actualProfitLoss,
        notes: jobData.notes,
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
        'id', 'customer', 'jobName', 'assignCustomer',
        'notes', 'technicians', 'assignTechnicians',
       'technicianRates', 'estimatedCost', 'manager', 'assignManager'
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
              console.log(row.technicianRates, 'rateChunks');
              
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

              return {
                ...row,
                technicians, 
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

  const handleDateChange = async (dateRange: [Date, Date] | null) => {
    const token = localStorage.getItem('token');
    const roleType = localStorage.getItem('types') || "";
    const userId = localStorage.getItem('userID');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

    // Function to format the date as DD-MM-YYYY
    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = formatDate(dateRange[0]);
      const endDate = formatDate(dateRange[1]);

      try {
        setLoading(true);
        let apiPoint = `${apiUrl}/jobFilter?roleType=${encodeURIComponent(roleType)}`;
        const requestBody: { [key: string]: any } = {
          startDate: startDate,
          endDate: endDate,
          roleType: roleType,
          vehicleStatus: 'false'
        };
        if (roleType !== 'superadmin' && roleType !== 'manager') {
          requestBody.technicianId = userId; // Add technicianId for non-admin and non-manager roles
        }
        const response = await axios.post(apiPoint, requestBody, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        setActiveJob(response.data.jobs.jobs);
      } catch (error) {
        console.error("Error fetching filtered jobs:", error);
      } finally {
        setLoading(false);
      }
    }
  };


   const handleNewJobClick = async (jobId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');
    const roleType = localStorage.getItem('types') || "";
    console.log(jobId, 'jobId');
    
    // Prepare the payload dynamically
    const payload = {
      roleType: roleType,  // Dynamic roleType from localStorage
      jobId: jobId,        // Dynamic jobId passed from the selected job 
    };
    console.log(payload, 'payload');

    try {
      // Check if the token is available
      if (!token) {
        console.error("No token found");
        return; // Stop if the token is missing
      }

      // Make the POST request to the vehicleJobNameFilter API endpoint
      const response = await fetch(`${apiUrl}/jobFilterWithJobName`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Include token in the headers
        },
        body: JSON.stringify(payload), // Send the payload as JSON
      });

      const data = await response.json(); // Parse the JSON response

      // Handle success or failure based on the API response
      if (response.ok) {
       setActiveJob(data.jobs.jobs);
        // You can update state or perform further operations based on the response
      } else {
        console.error("Failed to apply filter:", data.error || 'Unknown error');
      }
    } catch (error) {
      console.error("Error during API request:", error);
    }
  };

  // Clear all filters handler
  const handleClearFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
    fetchJobs(1, '', pageSize);
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
        
        <td><Link href={`/reporting/account-view?jobId=${job.id}`} className='hover:underline'>  {job?.customer?.fullName} </Link></td>
        <td>  {job?.manager?.firstName} {job?.manager?.lastName} </td>
        {/* <td> {job.id} </td> */}
        <td>{job?.jobName}</td>
        <td>{job.vehicleCount || 0}</td>
        <td>
          {job?.technicians?.length > 0 ? (
            <>
              <div className="">
                {job.technicians.length}
              </div>
            </>
          ) : (
            <span className="text-gray-400">No technicians assigned</span>
          )}
        </td>
        <td>
          {job.vehicles?.length > 0 ? (
            <div className="flex gap-1">
              <span className=" ">
                   {job.vehicles.filter((v: any) => v.vehicleStatus === true).length}
              </span>
              /
              <span className=" ">
                  {job.vehicles.filter((v: any) => v.vehicleStatus === false).length}
              </span>
            </div>
          ) : (
            <span className="text-gray-400">No vehicles</span>
          )}
        </td>
        <td>{`${job.estimatedCost ? '$' + job.estimatedCost : '-'}`}</td>



        <td>{`${job.totalFlatRate ? '$' + job.totalFlatRate : '-'}`}</td>
        <td>{`${job.totalRRate ? '$' + job.totalRRate : '-'}`}</td>
        <td>{`${job.totalCombined ? '$' + job.totalCombined : '-'}`}</td>
        {/* <td><a className="hover:underline" href={`tel:${job?.customer?.phoneNumber}`}>{job?.customer?.phoneNumber}</a></td> */}

        {/* <td>{job?.assignedTechnicians?.map((tech: any) => (
          <div key={tech.id}>
            <a className="hover:underline" href={`tel:${tech.technicians}`}>
              {tech.phoneNumber}
            </a>
          </div>
        ))}</td> */}



        <td>
          <span className={`${job.estimatedProfitLoss < 0 ? 'text-red-500' : 'text-green-700'}`}>

            {`${job.estimatedProfitLoss.toFixed(2) ? '$' + job.estimatedProfitLoss.toFixed(2) : '-'}`}

          </span>
        </td>
        <td>
          <span className={`${job.actualProfitLoss < 0 ? 'text-red-500' : 'text-green-700'}`}>
            {job.actualProfitLoss !== null && job.actualProfitLoss !== undefined
              ? `$${job.actualProfitLoss.toFixed(2)}`
              : '-'}
          </span>
        </td>

        <td>{job.startDate ? new Date(job.startDate).toLocaleDateString() : ''}</td>
        <td>{job.endDate ? new Date(job.endDate).toLocaleDateString() : ''}</td>


        <td className='text-left'>
          <Link href={`/reporting/account-view?jobId=${job.id}`} >
            <Image alt='eye' src={Eye} className='w-[16px] ' data-tooltip-id="view"
              data-tooltip-content="View" />
          </Link>
          <Tooltip id="view" place="top" />

        </td>
      </tr>
    )
  };

  return (
    <div className={` mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Account Reports', href: '/reporting/account-reports' }
        ]}
      />

      <CommonHeader heading="Account Reports" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='Activejobs' buttonLabel="" buttonLink="" showDatePicker={true}
        onDateChange={handleDateChange} onNewJobClick={handleNewJobClick} showClearFilters={true} onClearFilters={handleClearFilters} />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[50px]">
                <label className="flex items-center cursor-pointer relative">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === activeJob?.length}
                    className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[#fff]"

                    onChange={() =>
                      setSelectedIds(
                        selectedIds.length === activeJob?.length ? [] : activeJob.map((cust) => cust.id)
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
              <th className="w-[120px]" onClick={() => handleSort('id')}>
                Customer Name
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-[#000]' : 'text-[#000]'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
                <th className="w-[100px]">Manager Name
              </th>
              {/* <th className="w-[100px]" onClick={() => handleSort('id')}>
                Job ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th> */}
              <th className="w-[100px]"   >Job Title
              </th>
              <th className="w-[120px]">Total Vehicle</th>
              <th className="w-[120px]" >
                No. Of Dent Tech
              </th>
              <th className="w-[120px]">Work Order Completed </th>
              <th className="w-[100px]">Job Estimate</th>
              <th className="w-[100px]">All Tech Total</th>
              <th className="w-[80px]">All RR Total</th>
              <th className="w-[100px]">Total Expense</th> 
              <th className="w-[100px]">Estimated Profit/Loss</th>
              <th className="w-[100px]">Actual Profit/Loss </th>
              <th className="w-[80px]">Start Date</th>
              <th className="w-[80px]">End Date</th>
              <th className="w-[80px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={15} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : activeJob?.length === 0 ? (
              <tr>
                <td colSpan={15} className="text-center py-10">
                  <Empty />
                </td>
              </tr>
            ) : (
              activeJob?.map((job) => renderRow(job))
            )}
          </tbody>
        </table>
      </div>
      {activeJob?.length > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
};

export default JobTable;
