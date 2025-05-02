// components/JobTable.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import toast  from 'react-hot-toast'; 
import Pagination from '../../component/pagination';
import axios from 'axios';
import Swal from 'sweetalert2';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import Eye from '../../../../public/eye.svg'
import Image from 'next/image';
import Link from 'next/link';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSidebar } from "@/app/component/SidebarContext";
import Papa from 'papaparse';


const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here
interface Jobs {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
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
  const fetchJobs = async (page = 1, query = '', limit = pageSize) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types') || "";
      const userId = localStorage.getItem('userID');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;


      const endpoint = query.trim()
        ? roleType === 'superadmin'
          ? `${apiUrl}/searchJobStatus?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
          : `${apiUrl}/searchJobStatus?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : roleType === 'superadmin'
          ? `${apiUrl}/fetchJobStatus?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`
          : `${apiUrl}/fetchJobStatus?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;

      const response = await fetch(endpoint, { method: 'GET', headers });

      const data = await response.json();
      if (response.ok) {
        const fetchedTechnicians: Jobs[] = query.trim()
          ? data.JobStatus || []
          : data.JobStatus || [];
        //  const filteredTechnicians = fetchedTechnicians.filter(technician => !technician.deletedStatus);

        setActiveJob(fetchedTechnicians);
        setTotalPages(data.jobs?.totalPages || 1);

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
      fetchJobs(currentPage, searchTerm, pageSize);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, pageSize]);


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

        const response = await axios.post(`${apiUrl}/updateJobStatus`, {
          jobId,
          jobStatus: !currentApprovalStatus
        }, config);

        if (response.data.status) {
          // Optimistically update the local state
          setActiveJob(prev => prev.map(job => {
            if (job.id === jobId) {
              return { ...job, jobStatus: !job.jobStatus };
            }
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
        text: 'Technician status change was cancelled.',
        icon: 'info',
        confirmButtonText: 'OK'
      });
    }
  };

  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };

  // CSV Export Functions
  const downloadCSV = () => {
    const selectedJobs = activeJob.filter(c => selectedIds.includes(c.id));
    if (selectedJobs.length === 0) {
          toast.error("Please select at least job group to export.");
          return;
        }

    const csvOptions = {
      filename: 'Job Status',
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Job Status',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true, // Use object keys as headers
    };

    const csvExporter = new ExportToCsv(csvOptions);

    const formattedData = selectedJobs.map((jobData) => {
      return {
        id: jobData.id,
        vin: jobData.vin,
        customer: `${jobData?.customer?.firstName} ${jobData?.customer?.lastName}`,
        assignCustomer: jobData.assignCustomer,
        bodyClass: jobData.bodyClass,
        color: jobData.color,
        make: jobData.make,
        model: jobData.model,
        amountPercentage: jobData.amountPercentage,
        payRate: jobData.payRate,
        vehicleType: jobData.vehicleType,
        simpleFlatRate: jobData.simpleFlatRate,
        'modelYear': jobData.modelYear,
        'vehicleDescriptor': jobData.vehicleDescriptor,
        'manufacturerName': jobData.manufacturerName,
        'plantCompanyName': jobData.plantCompanyName,
        'plantCountry': jobData.plantCountry,
        'plantState': jobData.plantState,
        AccountStatus: jobData.accountStatus,
        DeletedStatus: jobData.deletedStatus,
        notes: jobData.notes,
        jobStatus: jobData.jobStatus ? 'true' : 'false',
        technicians: jobData.technicians.map((tech: any) => `${tech.firstName} ${tech.lastName}`).join(', '),
        assignTechnicians: jobData.technicians.map((techId: any) => `${techId.id}`).join(', '),
        jobDescription: jobData.jobDescription.map((jobDescription: any) => `${jobDescription.jobDescription}`).join(', '),
        cost: jobData.jobDescription.map((cost: any) => `${cost.cost}`).join(', '),

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
        'make', 'model', 'amountPercentage', 'payRate', 'vehicleType',
        'simpleFlatRate', 'modelYear', 'vehicleDescriptor', 'manufacturerName',
        'plantCompanyName', 'plantCountry', 'plantState', 'AccountStatus',
        'DeletedStatus', 'notes', 'jobStatus', 'technicians', 'assignTechnicians',
        'jobDescription', 'cost'
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
            const response = await axios.post(
              `${apiUrl}/importActiveJob`,
              { data: cleanedData },
              { headers }
            );
            toast.success('CSV Import Successful!');
            fetchJobs(currentPage, searchTerm, pageSize);
          } catch (error) {
            console.error('❌ Import failed:', error);
            toast.error('Import failed. Check console for details.');
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

    const subtotalcost = job.jobDescription.reduce((sum: number, job: any) => {
      const parsedJob = (job);
      return sum + Number(parsedJob.cost); // Ensure cost is treated as a number
    }, 0);
    const simpleFlatRate = Number(job.simpleFlatRate);
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
        <td> <Link href={`/jobs/view?jobId=${job.id}&jobStatus`} className='hover:underline'>{job?.id}</Link></td>
        <td> <Link href={`/jobs/view?jobId=${job.id}&jobStatus`} className='hover:underline'>{job?.customer?.firstName} {job?.customer?.lastName}</Link></td>

        <td>{job?.customer?.phoneNumber}</td>
        <td>  {job?.technicians?.map((tech: any) => (
          <div key={tech.id}>
            {tech.firstName} {tech.lastName}
          </div>
        ))}</td>
        <td>{job?.technicians?.map((tech: any) => (
          <div key={tech.id}>
            {tech.phoneNumber}
          </div>
        ))}</td>
        <td>${(job.simpleFlatRate && !isNaN(simpleFlatRate) && simpleFlatRate > 0 ? subtotalcost : totalCost).toFixed(2)}</td>

            <td>
          {(() => {
            if (!job) return null;
        
            const totalCost = job.jobDescription.reduce((sum: number, item: any) => {
              return sum + Number(item.cost || 0);
            }, 0);
        
            // Use job's simpleFlatRate or fallback to technician's simpleFlatRate
            const simpleFlatRate = job.simpleFlatRate ? Number(job.simpleFlatRate) : (job.technicians[0]?.simpleFlatRate ? Number(job.technicians[0].simpleFlatRate) : 0);
        
            // Use job's amountPercentage or fallback to technician's amountPercentage
            const amountPercentage = job.amountPercentage ? Number(job.amountPercentage) : (job.technicians[0]?.amountPercentage ? Number(job.technicians[0].amountPercentage) : 0);
        
            // Neither is valid — show red dot with tooltip
            if (
              (isNaN(simpleFlatRate) || simpleFlatRate === 0) &&
              (isNaN(amountPercentage) || amountPercentage === 0)
            ) {
              const tooltipId = `tooltip-${job.id}`;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    data-tooltip-id={tooltipId}
                    data-tooltip-content="R/I/R/R price is not added for this job."
                    style={{
                      height: '12px',
                      width: '12px',
                      backgroundColor: 'red',
                      borderRadius: '50%',
                      display: 'inline-block',
                      cursor: 'pointer',
                    }}
                  ></span>
                  <Tooltip id={tooltipId} place="top" />
                </div>
              );
            }
        
            // Show simpleFlatRate if valid
            if (!isNaN(simpleFlatRate) && simpleFlatRate > 0) {
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  ${simpleFlatRate.toFixed(2)}
                </div>
              );
            }
        
            // Show percentage-based calculation
            if (!isNaN(amountPercentage) && amountPercentage > 0) {
              const percentageAmount = (totalCost * amountPercentage) / 100;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  ${percentageAmount.toFixed(2)} ({amountPercentage}%)
                </div>
              );
            }
        
            return null;
          })()}
        </td>

        <td>
          {(() => {
            if (!job) return null;
        
            // Step 1: Calculate subtotal from jobDescription
            const subtotalcost = job.jobDescription.reduce((sum: number, item: any) => {
              return sum + Number(item.cost || 0);
            }, 0);
        
            // Step 2: Get flat rate and percentage — fallback to technician if job-level value is null/invalid
            const technician = job.technicians?.[0] || {};
            const simpleFlatRate = !isNaN(Number(job.simpleFlatRate)) && Number(job.simpleFlatRate) > 0
              ? Number(job.simpleFlatRate)
              : (!isNaN(Number(technician.simpleFlatRate)) ? Number(technician.simpleFlatRate) : 0);
        
            const amountPercentage = !isNaN(Number(job.amountPercentage)) && Number(job.amountPercentage) > 0
              ? Number(job.amountPercentage)
              : (!isNaN(Number(technician.amountPercentage)) ? Number(technician.amountPercentage) : 0);
        
            // Step 3: Calculate percentage amount
            const percentageAmount = (amountPercentage * subtotalcost) / 100;
        
            // Step 4: Total = subtotal + flat rate + percentage amount
            const totalCost = subtotalcost + simpleFlatRate + percentageAmount;
        
            // Step 5: Show red dot tooltip if neither flat rate nor percentage are valid
            if (simpleFlatRate === 0 && amountPercentage === 0) {
              const tooltipId = `tooltip-${job.id}`;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    data-tooltip-id={tooltipId}
                    data-tooltip-content="R/I/R/R price is not added for this job."
                    style={{
                      height: '12px',
                      width: '12px',
                      backgroundColor: 'red',
                      borderRadius: '50%',
                      display: 'inline-block',
                      cursor: 'pointer',
                    }}
                  ></span>
                  <Tooltip id={tooltipId} place="top" />
                </div>
              );
            }
        
            // Step 6: Return total cost
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                ${totalCost.toFixed(2)}
              </div>
            );
          })()}
        </td>
        <td style={{ cursor: 'pointer' }}>
          <span
            className={`badge ${job.jobStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
          >
            {job.jobStatus ? 'Completed' : 'In Progress'}
          </span>
        </td>
        <td className='text-left'>

          <Link href={`/jobs/view?jobId=${job.id}&jobStatus`} >
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
          { label: 'All IFS Work Orders', href: '/reporting/job-status' }
        ]}
      />
      <CommonHeader heading="All IFS Work Orders" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} userRole='' onExport={downloadCSV} onImport={handleImportCSV} buttonLabel="" buttonLink="" />
 
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
              <th className="w-[50px]" onClick={() => handleSort('id')}>
                ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[120px]" onClick={() => handleSort('customerName')}>
                Customer Name
                {sortBy === 'customerName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[150px]">
                Customer Number
              </th>
              <th className="w-[120px]" >
                Technician Name
              </th>
              <th className="w-[100px]">Tech. Number</th>
              <th className="w-[100px]">Sub Total Cost</th>
              <th className="w-[120px]">R/I R/R </th>
              <th className="w-[120px]">Total Cost</th>
              <th className="w-[120px]">Status</th>
              <th className="w-[160px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : activeJob.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-10">
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
