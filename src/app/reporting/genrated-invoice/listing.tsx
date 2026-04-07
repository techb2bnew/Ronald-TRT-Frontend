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
import { FormControl, FormLabel, TextField } from '@mui/material';
import InvoiceGenerator from '@/app/component/invoice-genrated';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here

interface VehcileInfo {
  id: string;
  invoiceNumber: string;
  jobName: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
  paidDate:string;
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
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState<string>('');
  const [originalJobs, setOriginalJobs] = useState<any[]>([]);
  const [invoiceDates, setInvoiceDates] = useState<Record<string, string>>({});
  const [pdrValues, setPdrValues] = useState<Record<string, string>>({});

  useEffect(() => {
    // Ensure this code runs only on the client-side (after the component mounts)
    const storedRoleType = localStorage.getItem('types');
    setRoleType(storedRoleType); // Set the roleType from localStorage
  }, []);



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
          ? `${apiUrl}/searchInvoice?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
          : `${apiUrl}/searchInvoice?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : roleType === 'superadmin' || roleType === 'manager'
          ? `${apiUrl}/fetchInvoice?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`
          : `${apiUrl}/fetchInvoice?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;
      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();

      if (response.ok) {
        const fetchedTechnicians: VehcileInfo[] = query.trim()
          ? data.invoice.invoice || []
          : data.response.invoice || [];
 
        const initialInvoiceDates: Record<string, string> = {};
        fetchedTechnicians.forEach(job => {
          
          if (job.paidDate) {
            const date = new Date(job.paidDate);
            initialInvoiceDates[job.invoiceNumber] = date.toISOString().split('T')[0];
          }
        }); 
        setInvoiceDates(initialInvoiceDates);


        setOriginalJobs(fetchedTechnicians);
        const filteredJobs = fetchedTechnicians.filter((job: any) => {
          return selectedStatus === 'paid'
            ? job.status === true
            : selectedStatus === 'unPaid'
              ? job.status === false
              : true;
        });

        setActiveJob(fetchedTechnicians);
        setTotalPages(data.jobs?.totalPages || 1);
        setTotalJobs(data.jobs?.totalVehicles || 0);

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
    console.log(`Going to page number ${data.selected + 1}`);
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
        let apiPoint = `${apiUrl}/vehicleFilter?roleType=${encodeURIComponent(roleType)}`;
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

        setActiveJob(response.data.vehicles.updatedVehicles);
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
    const userId = localStorage.getItem('userID');


    // Prepare the payload dynamically
    const payload = {
      roleType: roleType,
      jobId: jobId,
      ...(roleType === 'single-technician' && { userId: userId }),
    };

    console.log(payload, 'payload');

    try {
      // Check if the token is available
      if (!token) {
        console.error("No token found");
        return; // Stop if the token is missing
      }
      const response = await fetch(`${apiUrl}/invoiceJobNameFilter`, {
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
        setActiveJob(data.invoice.invoices);
        // You can update state or perform further operations based on the response
      } else {
        console.error("Failed to apply filter:", data.error || 'Unknown error');
      }
    } catch (error) {
      console.error("Error during API request:", error);
    }
  };

  const handleNewCustomerClick = async (jobId: string) => {
  }


  const handleInvoiceStatusChange = (status: string) => {
    console.log(status, 'status');
    setSelectedStatus(status);
  };

  const handleClearFilters = () => {
    setSelectedCustomer('');
    setSelectedStatus('');
    setSearchTerm('');
    setCurrentPage(1);
    fetchJobs(1, '', pageSize);
  };

  useEffect(() => {
    if (selectedStatus === '') {
      setActiveJob(originalJobs);
    } else {
      const filtered = originalJobs.filter(job => {
        console.log(job.status, 'job vehicleStatus');

        if (selectedStatus === 'paid') {
          return job.status === 'paid';
        } else if (selectedStatus === 'unPaid') {
          return job.status === 'unPaid';
        }
        return true;
      });

      if (filtered.length === 0) {
        console.log('No jobs match the filter criteria');
      }

      setActiveJob(filtered);
    }
  }, [selectedStatus, originalJobs]);


  const handleOpenInNewTab = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSavePaidDate = async (Id: string) => {
    const token = localStorage.getItem('token');
    const roleType = localStorage.getItem('types') || "";
    const userId = localStorage.getItem('userID');
    try {
      const dateToUse = invoiceDates[Id] || new Date().toISOString().split('T')[0];

      const payload = {
        invoiceNumber: Id,
        paidDate: dateToUse,
        roleType: roleType,
        status: 'paid'
      };


      const response = await fetch(`${apiUrl}/updateInvoiceStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Include token in the headers
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update PDR');
      }

      const data = await response.json();
      toast.success("Invoice Paid Date updated successfully!");
      fetchJobs(currentPage, searchTerm, pageSize);
    } catch (error) {
      console.error('Error updating PDR:', error);
    }
  };

  const renderRow = (job: any) => {
    const isChecked = selectedIds.includes(job.id);
    const roleType = localStorage.getItem('types') || "";

    return (
      <tr key={job.id}>
        {/* <td key="checkbox">
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
        </td> */}
        <td> <Link href={`/reporting/view-invoice?invoiceId=${job.invoiceNumber}`} className='hover:underline'> {job?.invoiceNumber}</Link> </td>
        <td>  {job?.customer?.fullName} </td>
        <td>  {job?.job?.jobName} </td>
        {/* <td>  {job?.totalCombined ? `$${job.totalCombined}` : 'N/A'}</td> */}
        <td>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ''}</td>
        <td>
          <div
            className={`badge w-[80px] text-center ${job.status === 'paid'
                ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow'
                : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'
              }`}
          >
            {job.status === 'paid' ? 'Paid' : 'Unpaid'}
          </div>
        </td>

        <td>
          <div className="flex gap-2 items-center">
            <TextField
              label=""
              variant="outlined"
              fullWidth
              color="warning"
              size="small"
              type='date'
              value={invoiceDates[job.invoiceNumber] || new Date().toISOString().split('T')[0]}
              onChange={(e) => setInvoiceDates(prev => ({
                ...prev,
                [job.invoiceNumber]: e.target.value
              }))}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <button type='button' className="primary-bg p-2 rounded" onClick={() => handleSavePaidDate(job.invoiceNumber)}>Save</button>
          </div>
        </td>
        <td className='text-left'>
          <div className="flex gap-3 items-center">
            <button data-tooltip-id="Download" data-tooltip-content="Download Invoice"
              onClick={() => handleOpenInNewTab(job.pdfLink)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <Tooltip id="Download" place="top" />

            <Link href={`/reporting/view-invoice?invoiceId=${job.invoiceNumber}`} >
              <Image alt='eye' src={Eye} className='w-[20px] ' data-tooltip-id="view"
                data-tooltip-content="View" />
            </Link>
            <Tooltip id="view" place="top" />
          </div>
        </td>
      </tr>
    )
  };

  return (
    <div className={` mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Sent Invoice', href: '/reporting/invoice' }
        ]}
      />
      <div className="shadow-lg p-4 bg-white rounded-lg"> 
      <CommonHeader heading="Sent Invoice" onSearch={(term) => setSearchTerm(term)} userRole='Activejobs' buttonLabel="" buttonLink=""
        onNewJobClick={handleNewJobClick} onCustomerChange={handleNewCustomerClick} onInvoiceStatueChange={handleInvoiceStatusChange} showClearFilters={true} onClearFilters={handleClearFilters} />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              {/* <th className="w-[50px]">
                <label className="flex items-center cursor-pointer relative">
                  <input
                    type="checkbox"
                    checked={selectedIds?.length === activeJob?.length}
                    className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[#fff]"

                    onChange={() =>
                      setSelectedIds(
                        selectedIds?.length === activeJob?.length ? [] : activeJob?.map((cust) => cust.id)
                      )
                    }
                  />
                  <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </span>
                </label>
              </th> */}
              <th onClick={() => handleSort('id')}>
                Invoice ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-[#000]' : 'text-[#000]'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th>
                Customer Name
              </th>
              <th>
                Job Name
              </th>
              {/* <th className="w-[160px]">Grand Total</th> */}
              <th>Invoice Created Date</th>
              <th className="w-[130px]">Status</th>
              <th className="w-[220px]">Add Paid Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : activeJob?.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  <Empty />
                </td>
              </tr>
            ) : (
              activeJob?.map((job) => renderRow(job))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-3 items-center">

        {activeJob?.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>
    </div>
    </div>
  );
};

export default JobTable;
