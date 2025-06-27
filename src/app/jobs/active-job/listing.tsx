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

    const sortedJobs = [...activeJob].sort((a, b) => {
      if (column === 'customerName') {
        const nameA = `${a?.customer?.firstName} ${a?.customer?.lastName}`;
        const nameB = `${b?.customer?.firstName} ${b?.customer?.lastName}`;
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


  const toggleApproval = async (jobId: number, currentApprovalStatus: boolean) => {
    // Show a confirmation dialog before proceeding
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to change the status of this job?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#383d71',
      cancelButtonColor: 'black',
      confirmButtonText: 'Yes, change it!'
    });

    // Check if the user confirmed the action
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');

        const config = {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        };

        const response = await axios.post(`/api/updateJobStatus`, {
          jobId,
          jobStatus: !currentApprovalStatus
        }, config);

        if (response.data.status) {
          // Optimistically update the local state
          setActiveJob(prev => prev.map(job => {
            if (job.id === jobId) {
              return { ...job, jobStatus: !job.jobStatus };
            }
            fetchJobs(currentPage, searchTerm);
            return job;
          }));
          Swal.fire({
            title: 'Success!',
            text: 'Job status updated successfully.',
            confirmButtonColor: '#383d71',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } else {
          console.error('Failed to update job status');
          Swal.fire({
            title: 'Error!',
            text: 'Failed to update job status.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      } catch (error) {
        console.error('Error updating job status:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Error updating job status.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } else {
      // User clicked 'Cancel', do nothing
      Swal.fire({
        title: 'Cancelled',
        text: 'Job status change was cancelled.',
        icon: 'info',
        confirmButtonText: 'OK'
      });
    }
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
      filename: 'Jobs',
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Jobs',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
    };

    const csvExporter = new ExportToCsv(csvOptions);

    const formattedData = selectedJobs.map((jobData) => {


      const technician = jobData.technicians?.[0] || {};

      // Parse simpleFlatRate from both jobData and technician
      const parseSimpleFlatRate = (rate: any) => {
        if (!rate) return {};

        try {
          // If it's already a number, return as is
          if (!isNaN(Number(rate))) return Number(rate);

          // If it's a JSON string, parse it
          if (typeof rate === 'string') {
            const parsed = JSON.parse(rate);
            // If it's an object with vehicle types, format it
            if (typeof parsed === 'object' && parsed !== null) {
              return Object.entries(parsed)
                .map(([vehicle, rate]) => `${vehicle}: $${rate}`)
                .join(', ');
            }
            return parsed;
          }
          return rate;
        } catch (e) {
          console.error('Error parsing simpleFlatRate:', e);
          return rate;
        }
      };

      const jobSimpleFlatRate = parseSimpleFlatRate(jobData.simpleFlatRate);
      const techSimpleFlatRate = parseSimpleFlatRate(technician.simpleFlatRate);
      const simpleFlatRate = !isEmpty(jobSimpleFlatRate) ? jobSimpleFlatRate : techSimpleFlatRate;

      const amountPercentage = !isNaN(Number(jobData.amountPercentage)) && Number(jobData.amountPercentage) > 0
        ? Number(jobData.amountPercentage)
        : (!isNaN(Number(technician.amountPercentage)) ? Number(technician.amountPercentage) : 0);


      return {
        id: jobData.id,
        customer: `${jobData?.customer?.fullName}`,
        assignCustomer: jobData.assignCustomer,
        jobName: jobData.jobName,

        technicians: jobData.technicians.map((tech: any) => `${tech.firstName} ${tech.lastName}`).join(', '),

        assignTechnicians: jobData.technicians.map((tech: any) => `${tech.id}`).join(', '),

        payRate: jobData.technicians.map((tech: any) => tech.UserJob?.payRate || 'N/A').join(', '),

        simpleFlatRate: jobData.technicians.map((tech: any) => {
          const flatRate = tech.UserJob?.simpleFlatRate;
          if (!flatRate) return 'N/A';

          let parsedRate: Record<string, any> = {};
          try {
            parsedRate = typeof flatRate === 'string' ? JSON.parse(flatRate) : flatRate;
          } catch {
            return 'Invalid';
          }

          return Object.entries(parsedRate)
            .map(([vehicle, rate]) => `${vehicle}: $${Number(rate).toFixed(2)}`)
            .join(' | ');
        }).join(' || '), // Separator between multiple technicians

        amountPercentage: jobData.technicians.map((tech: any) => {
          const percent = tech.UserJob?.amountPercentage;
          return percent ? `${percent}%` : '0%';
        }).join(', '),
      };

    });

    csvExporter.generateCsv(formattedData);
  };

  // Helper function to check if a value is empty
  const isEmpty = (value: any) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') {
      return value.trim() === '' || value === '{}' || value === '0';
    }
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    return false;
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
      console.log("⚠️ No permissions found in localStorage. Showing all icons.");
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


  const handleImportCSV = (file: File) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const reader = new FileReader();

    reader.onload = async (e) => {
      let text = (e.target?.result as string)
        .replace(/^\uFEFF/, '')
        .trimStart();

      const manualHeaders = [
        'id', 'customer', 'assignCustomer', 'jobName',
        'technicians', 'assignTechnicians',
        'payRate', 'simpleFlatRate', 'amountPercentage',
      ];

      Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        complete: async (result) => {
          const rows = result.data as string[][];

          const cleanedData = rows
            .slice(1)
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
              const technicianNames = row.technicians ? row.technicians.split(',').map((name: any) => name.trim()) : [];
              const technicianIds = row.assignTechnicians ? row.assignTechnicians.split(',').map((id: any) => id.trim()) : [];
              const payRates = row.payRate ? row.payRate.split(',').map((rate: any) => rate.trim()) : [];
              const amountPercentages = row.amountPercentage ? row.amountPercentage.split(',').map((perc: any) => perc.trim()) : [];
              const simpleFlatRates = row.simpleFlatRate
                ? row.simpleFlatRate.split('||').map((rate: string) => {
                  const obj: Record<string, string> = {};
                  rate.split('|').forEach(pair => {
                    const [key, value] = pair.split(':').map(p => p.trim());
                    if (key && value) obj[key] = value;
                  });
                  return obj;
                })
                : [];

              const technicians = technicianNames.map((name: any, index: any) => {
                const payRate = payRates[index] || null;

                const technicianObj: any = {
                  id: technicianIds[index] || null,
                  name: name,
                  payRate: payRates[index] || null,
                  amountPercentage: amountPercentages[index] || null,
                  simpleFlatRates: simpleFlatRates[index] || null
                };
                if (payRate?.toLowerCase() === "simple flat rate") {
                  technicianObj.simpleFlatRate = simpleFlatRates[index] || null;
                }

                // Directly assign simpleFlatRate if payRate is "Simple Flat Rate"


                return technicianObj;
              });

              return {
                ...row,
                technicians: technicians,
                // Clean up unused fields
                assignTechnicians: undefined,
                jobName:undefined,
                payRate: undefined,
                amountPercentage: undefined,
                simpleFlatRate: undefined
              };
            });

            console.log('Processed import data:', JSON.stringify(payloadData, null, 2));

            const response = await axios.post(
              `/api/importActiveJob`,
              { data: payloadData },
              { headers }
            );
            toast.success('CSV Import Successful!');
            fetchJobs(currentPage, searchTerm, pageSize);
          } catch (error: unknown) {
            console.error('❌ Import failed:', error);
            if (typeof error === 'object' && error !== null && 'response' in error) {
              toast.error((error as any).response?.data?.error || 'Unknown error');
            } else if (error instanceof Error) {
              toast.error(error.message);
            } else {
              toast.error(String(error));
            }
          }
          setLoading(false);
        },
        error: (err: any) => {
          console.error('❌ CSV Parse error:', err);
          alert('❌ Error parsing CSV file.');
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

  const renderRow = (job: any) => {
    const isChecked = selectedIds.includes(job.id);
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
        <td> <Link href={`/jobs/view?jobId=${job.id}&ActiveWorkOrder`} className='hover:underline'>{job.id}</Link></td>
        <td> {job?.jobName}</td>


        <td> {job?.customer?.fullName}  </td>
        {/* <td><a className="hover:underline" href={`tel:${job?.customer?.phoneNumber}`}>{job?.customer?.phoneNumber}</a></td> */}
        <td>  {job?.technicians?.map((tech: any) => (
          <div key={tech.id} className="capitalize">
            {tech.firstName} {tech.lastName}
          </div>
        ))}</td>
        <td>{job.vehicleCount} Work Order</td>
        <td>
          {canCreate && (

            <span onClick={() => toggleApproval(job.id, job.jobStatus)} style={{ cursor: 'pointer' }}
              className={`badge ${job.jobStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
            >
              {job.jobStatus ? 'Completed' : 'In Progress'}
            </span>
          )}

        </td>
        <td>
          <TableActions
            editRoute={`/jobs/create-job/create?jobId=${job.id}`}
            deleteRoute={`/api/deleteJob`}  // Pass the correct endpoint
            viewRoute={`/jobs/view?jobId=${job.id}&ActiveWorkOrder`}
            idKey="jobId"
            userRole='Activejobs'
            itemId={job.id}  // Pass the technician ID
            onDeleteSuccess={() => handleDeleteSuccess(job.id)}
          />
        </td>
      </tr>
    )
  };

  return (
    <div className={` mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Jobs List', href: '/jobs/active-job' }
        ]}
      />

      <CommonHeader heading="Jobs List" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='Activejobs' buttonLabel="Create Job" buttonLink="/jobs/create-job/create" />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[55px]">
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
                Job Id
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[150px]" onClick={() => handleSort('jobName')}>
                Job Name
                {sortBy === 'jobName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[150px]">
                Customer Name
                
              </th>

              <th className="w-[150px]" >
                Technician Name
              </th>
              <th className="w-[100px]">Vehicle / Work Order</th>
              {/* <th className="w-[100px]">Sub Total Cost</th>
              <th className="w-[120px]">R/I R/R </th>
              <th className="w-[120px]">Total Cost</th> */}
              <th className="w-[120px]">Status</th>
              <th className="w-[100px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : activeJob.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
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
