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
import Link from 'next/link';
import Image from 'next/image';
import Eye from '../../../../public/eye.svg';
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
      const roleType = "single-technician";
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoint = query.trim()
        ? `${apiUrl}/searchTechnicianActiveJob?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : `${apiUrl}/fetchAllJobs?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;

      const response = await fetch(endpoint, { method: 'GET', headers });

      const data = await response.json();
      if (response.ok) {
        const fetchedTechnicians: Jobs[] = query.trim()
          ? data.ActiveJob || []
          : data.jobs?.jobs || [];
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
      filename: 'Single Technician Work Order',
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Single Technician Work Order Data',
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
        deletedStatus: jobData.deletedStatus,
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
        .replace(/^\uFEFF/, '')
        .trimStart();

      let lines = text.split(/\r?\n/);

      // ✅ Remove garbage header line(s) like "Technician Jobs Data,,,,,"
      while (lines.length && !lines[0].toLowerCase().includes('id')) {
        lines.shift();
      }

      text = lines.join('\n');

      const manualHeaders = [
        'id', 'vin', 'customer', 'assignCustomer', 'bodyClass', 'color',
        'make', 'model', 'amountPercentage', 'payRate', 'vehicleType',
        'simpleFlatRate', 'modelYear', 'vehicleDescriptor', 'manufacturerName',
        'plantCompanyName', 'plantCountry', 'plantState',
        'deletedStatus', 'notes', 'jobStatus', 'technicians', 'assignTechnicians',
        'jobDescription', 'cost'
      ];

      const requiredFieldsWithDefaults: Record<string, string> = {
        model: 'N/A'
      };

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
                let value: any = row[idx];

                if (typeof value === 'string') {
                  value = value.trim();
                  const lower = value.toLowerCase();

                  if (lower === 'null' || lower === '') {
                    value = requiredFieldsWithDefaults[key] || '';
                  } else {
                    value = value;
                  }
                }

                // Fix VIN from scientific notation (convert number to full string)
                if (key === 'vin' && !isNaN(Number(value))) {
                  value = Number(value).toFixed(0);
                }

                // ✅ Ensure value is always a string
                obj[key] = String(value ?? '');
              });

              return obj;
            })
            .filter((row) => {
              const isHeaderRow = Object.entries(row).every(
                ([key, val]) =>
                  typeof val === 'string' && val.trim().toLowerCase() === key.toLowerCase()
              );

              const hasRealData = Object.values(row).some(
                (val) => typeof val === 'string' && val.trim() !== ''
              );

              return !isHeaderRow && hasRealData;
            });

          console.log("✅ Final Cleaned Data:", cleanedData);

          try {
            const response = await axios.post(
              `${apiUrl}/importActiveJob`,
              { data: cleanedData },
              { headers }
            );
            toast.success('CSV Import Successful!');
            fetchJobs(currentPage, searchTerm, pageSize);
          } catch (error: unknown) {
            console.error('❌ Import failed:', error);

            // Check if it's an Axios error with a response
            if (
              typeof error === 'object' &&
              error !== null &&
              'response' in error &&
              typeof (error as any).response?.data?.error === 'string'
            ) {
              toast.error((error as any).response.data.error);
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
      console.warn("⚠️ No permissions found in localStorage. Showing all icons.");
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
  const renderRow = (job: any) => {
    const isChecked = selectedIds.includes(job.id);

    const SubTotal = job.jobDescription.reduce((sum: number, job: any) => {
      const parsedJob = (job);
      return sum + Number(parsedJob.cost); // Ensure cost is treated as a number
    }, 0);

    const labourTotal = job.labourCost
      ? Number(job.labourCost)
      : job.technicians?.reduce((sum: number, tech: any) => sum + Number(tech.simpleFlatRate || 0), 0) || 0;

    const totalCost = SubTotal + labourTotal;

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
        <td> <Link href={`/jobs/view?jobId=${job.id}`} className='hover:underline'>{job.id}</Link></td>
        <td> <Link href={`/jobs/view?jobId=${job.id}`} className='hover:underline capitalize'>{job?.customer?.firstName} {job?.customer?.lastName}</Link></td>

        <td>
          <a className="hover:underline" href={`tel:${job?.customer?.phoneNumber}`}>
            {job?.customer?.phoneNumber}</a></td>
        <td>  {job?.technicians?.map((tech: any) => (
          <div key={tech.id} className='capitalize'>
            {tech.firstName} {tech.lastName}
          </div>
        ))}</td>
        <td>{job?.technicians?.map((tech: any) => (
          <div key={tech.id}>
            <a className="hover:underline" href={`tel:${tech?.phoneNumber}`}>
              {tech.phoneNumber}
            </a>
          </div>
        ))}</td>
        <td>${SubTotal.toFixed(2)}</td>
        <td>
          ${job.labourCost ?? job.technicians?.[0]?.simpleFlatRate ?? "0"}
        </td>
        <td>${totalCost.toFixed(2)}</td>
        <td>
          {canCreate && (

            <span
              className={`badge ${job.jobStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
            >
              {job.jobStatus ? 'Completed' : 'In Progress'}
            </span>
          )}

        </td>
        <td>
          {/* <TableActions   
          editRoute={`/jobs/create-job/create?jobId=${job.id}`}   
         deleteRoute={`${apiUrl}/deleteJobs`}  // Pass the correct endpoint
         viewRoute={`/jobs/view?jobId=${job.id}`}
           idKey="jobid"
           userRole='Activejobs'
          itemId={job.id}  // Pass the technician ID
          onDeleteSuccess={() => handleDeleteSuccess(job.id)} 
           /> */}

          <Link href={`/jobs/view?jobId=${job.id}&workorder`}>
            <Image alt='eye' src={Eye} className='w-[16px]' />
          </Link>
        </td>
      </tr>
    )
  };

  return (
    <div className={` mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Single Technician Work Order', href: '/single-technicians/jobs' }
        ]}
      />
      <CommonHeader heading="Single Technician Work Order" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='Activejobs' buttonLabel="" buttonLink="" />

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
              <th className="w-[100px]">Sub Total</th>
              <th className="w-[100px]">R/I/R/R</th>
              <th className="w-[100px]">Total Cost</th>
              <th className="w-[120px]">Status</th>
              <th className="w-[160px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : activeJob.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10">
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
