// components/JobTable.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import TableActions from '../../component/action';
import CommonHeader from '../../component/commonHeader';
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from 'react-toastify';
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
        ? roleType === 'superadmin'
          ? `${apiUrl}/searchTechnicianActiveJob?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}&limit=${limit}&page=${page}`
          : `${apiUrl}/searchTechnicianActiveJob?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}&limit=${limit}&page=${page}`
        : roleType === 'superadmin'
          ? `${apiUrl}/fetchAllJobs?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`
          : `${apiUrl}/fetchAllJobs?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;

      console.log('Fetching API with endpoint:', endpoint);  // Debugging endpoint

      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();

      console.log('API response data:', data);  // Debugging API response

      if (response.ok) {
        const fetchedJobs: Jobs[] = query.trim() ? data.ActiveJob || [] : data.jobs?.jobs || [];
        setActiveJob(fetchedJobs);
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

  const downloadCSV = () => {
    const csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Work Order Data',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true, // Use object keys as headers
    };

    const csvExporter = new ExportToCsv(csvOptions);

    const formattedData = activeJob.map((jobData) => {
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
        'accountStatus': jobData.accountStatus ? 'Approved' : 'Accept',
        notes: jobData.notes,
        createdAt: new Date(jobData.createdAt).toLocaleDateString(),
        jobStatus: jobData.jobStatus ? 'Completed' : 'Pending',
        technicians: jobData.technicians.map((tech: any) => `${tech.firstName} ${tech.lastName}`).join(', '),
        assignTechnicians: jobData.technicians.map((techId: any) => `${techId.id}`).join(', '),
        jobDescription: jobData.jobDescription.map((jobDescription: any) => `${jobDescription.jobDescription}`).join(', '),
        cost: jobData.jobDescription.map((cost: any) => `${cost.cost}`).join(', '),

      };
    });
    csvExporter.generateCsv(formattedData);
  }





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


  const handleImportCSV = (file: File) => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      let text = (e.target?.result as string)
        .replace(/^\uFEFF/, '') // remove BOM
        .trimStart(); // remove leading whitespace/newlines
  
      // ✅ Fix: Remove invalid header prefix like "Work Order Data ,"
      if (text.startsWith('Work Order Data')) {
        const lines = text.split(/\r?\n/);
        if (lines.length > 1) {
          // drop the first "Work Order Data" line if it doesn't contain valid headers
          if (!lines[0].includes('id') || lines[0].split(',').length < lines[1].split(',').length) {
            lines.shift(); // remove first line
          }
        }
        text = lines.join('\n');
      }
  
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: async (result) => { 
  
          const cleanedData = (result.data as any[]).filter(
            (row) => Object.values(row).some((val) => val !== '')
          );
  
          const finalData = cleanedData.map((row) => ({
            ...row, 
          }));
  
          try {
            const response = await axios.post(
              `${apiUrl}/importActiveJob`,
              { data: finalData },
              { headers }
            );
            toast.success('CSV Import Successful!.');
            fetchJobs(currentPage, searchTerm, pageSize); 
          } catch (error) {
            console.error('❌ Import failed:', error);
            toast.error('Import failed. Check console for details.'); 
          }
        },
        error: (err:any) => {
          console.error('❌ CSV Parse error:', err);
          alert('❌ Error parsing CSV file.');
        },
      });
    };
  
    reader.readAsText(file);
  };
  
  


  const renderRow = (job: any) => {

    const totalCost = job.jobDescription.reduce((sum: number, job: any) => {
      const parsedJob = (job);
      return sum + Number(parsedJob.cost); // Ensure cost is treated as a number
    }, 0);
    return (
      <tr key={job.id}>
        <td>{job.id}</td>
        <td>{job?.customer?.firstName} {job?.customer?.lastName}</td>
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
        <td>${totalCost}</td>
        <td>
  {(() => {
    if (!job) return null;

    const percentage = job.amountPercentage ? Number(job.amountPercentage) : null;
    const flatRate = job.simpleFlatRate ? Number(job.simpleFlatRate) : null;

    // Check if either amountPercentage or simpleFlatRate is null
    if (percentage === null || flatRate === null || isNaN(percentage) || isNaN(flatRate)) {
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

    // Calculate the pay if both values are present
    const calculatedPay = (flatRate * percentage) / 100;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        ${calculatedPay.toFixed(2)}
      </div>
    );
  })()}
</td>





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
            deleteRoute={`${apiUrl}/deleteJobs`}  // Pass the correct endpoint
            viewRoute={`/jobs/view?jobId=${job.id}&ActiveWorkOrder`}
            idKey="jobid"
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
          { label: 'Active Work Orders', href: '/jobs/active-job' }
        ]}
      />

      <CommonHeader heading="Active Work Orders" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='Activejobs' buttonLabel="Create job" buttonLink="/jobs/create-job/create" />
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[50px]" onClick={() => handleSort('id')}>
                ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[150px]" onClick={() => handleSort('customerName')}>
                Customer Name
                {sortBy === 'customerName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[120px]">
                Customer Number
              </th>
              <th className="w-[150px]" >
                Technician Name
              </th>
              <th className="w-[100px]">Tech. Number</th>
              <th className="w-[120px]">Total Cost</th>
              <th className="w-[120px]">R/I R/R </th>
              <th className="w-[120px]">Status</th>
              <th className="w-[100px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : activeJob.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  <Empty />
                </td>
              </tr>
            ) : (
              activeJob.map((job) => renderRow(job))
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};

export default JobTable;
