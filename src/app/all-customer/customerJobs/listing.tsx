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
import SortIcon from '@/app/component/sortIcon';


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

  const fetchJobs = async (page = 1, query = '', limit = pageSize, customerId: string) => {
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
          ? `/api/customerJobListing?searchQuery=${encodeURIComponent(query)}&limit=${limit}&page=${page}`
          : `/api/customerJobListing?searchQuery=${encodeURIComponent(query)}&limit=${limit}&page=${page}`
        : roleType === 'superadmin'
          ? `/api/customerJobListing?page=${page}&limit=${limit}&customerId=${customerId}`
          : `/api/customerJobListing?page=${page}&limit=${limit}`;

      console.log('Fetching API with endpoint:', endpoint);  // Debugging endpoint

      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();

      console.log('API response data:', data);  // Debugging API response

      if (response.ok) {
        const fetchedJobs: Jobs[] = query.trim() ? data.vehicles || [] : data.vehicles || [];
        setActiveJob(fetchedJobs);
        setTotalPages(data.totalPages || 1);
        setTotalJobs(data.totalJobs || 0); // Ensure totalJobs is set correctly

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
    const searchParams = new URLSearchParams(window.location.search);
    const customerId = searchParams.get('customerId') || '';
    const timeoutId = setTimeout(() => {
      fetchJobs( currentPage, searchTerm, pageSize, customerId); // Make sure currentPage and pageSize are used
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, pageSize]);






  // Function to handle sorting logic
  const handleSort = (column: string) => {
    const direction = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(direction);
    setSortBy(column);

    const sortedJobs = [...activeJob].sort((a, b) => {
     

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
      filename: 'Active Work Orders',
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Active Work Orders',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true, // Use object keys as headers
    };

    const csvExporter = new ExportToCsv(csvOptions);


    const formattedData = selectedJobs.map((jobData) => {
      const subTotal = jobData.jobDescription.reduce((sum: number, item: any) => {
        return sum + Number(item.cost || 0);
      }, 0);
      const technician = jobData.technicians?.[0] || {};
      const simpleFlatRate = !isNaN(Number(jobData.simpleFlatRate)) && Number(jobData.simpleFlatRate) > 0
        ? Number(jobData.simpleFlatRate)
        : (!isNaN(Number(technician.simpleFlatRate)) ? Number(technician.simpleFlatRate) : 0);

      const amountPercentage = !isNaN(Number(jobData.amountPercentage)) && Number(jobData.amountPercentage) > 0
        ? Number(jobData.amountPercentage)
        : (!isNaN(Number(technician.amountPercentage)) ? Number(technician.amountPercentage) : 0);

      // Step 3: Calculate percentage amount
      const percentageAmount = (amountPercentage * subTotal) / 100;
      const totalCost = subTotal + simpleFlatRate + percentageAmount;

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
        vehicleType: jobData.vehicleType,
        'modelYear': jobData.modelYear,
        'vehicleDescriptor': jobData.vehicleDescriptor,
        'manufacturerName': jobData.manufacturerName,
        'plantCompanyName': jobData.plantCompanyName,
        'plantCountry': jobData.plantCountry,
        'plantState': jobData.plantState,
        deletedStatus: jobData.deletedStatus,
        estimatedBy: jobData.estimatedBy,
        notes: jobData.notes,
        jobStatus: jobData.jobStatus,
        technicians: jobData.technicians.map((tech: any) => `${tech.firstName} ${tech.lastName}`).join(', '),
        assignTechnicians: jobData.technicians.map((techId: any) => `${techId.id}`).join(', '),
        jobDescription: jobData.jobDescription.map((jobDescription: any) => `${jobDescription.jobDescription}`).join(', '),
        payRate: jobData.payRate,
        simpleFlatRate: jobData.simpleFlatRate,
        cost: jobData.jobDescription.map((cost: any) => `${cost.cost}`).join(', '),
        subTotal: subTotal.toFixed(2),
        totalCost: totalCost.toFixed(2),

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
        'make', 'model', 'amountPercentage', 'vehicleType',
        'modelYear', 'vehicleDescriptor', 'manufacturerName',
        'plantCompanyName', 'plantCountry', 'plantState', 'deletedStatus',
        'estimatedBy', 'notes', 'jobStatus', 'technicians', 'assignTechnicians',
        'jobDescription', 'payRate', 'simpleFlatRate', 'cost', 'subTotal', 'totalCost'
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
              // Skip if all values match their keys (header row)
              const isHeaderRow = Object.entries(row).every(([key, val]) => key === val);
              // Skip if empty row
              const hasData = Object.values(row).some((val) => val && val !== '');
              return !isHeaderRow && hasData;
            });

          try {
            // Only filter out the first object if it's a header row
            const payloadData = cleanedData.filter(row => {
              const isHeaderRow = Object.entries(row).every(([key, val]) => key === val);
              return !isHeaderRow;
            });

            const response = await axios.post(
              `/api/importActiveJob`,
              { data: payloadData },
              { headers }
            );
            toast.success('CSV Import Successful!');
            const searchParams = new URLSearchParams(window.location.search);
             const customerId = searchParams.get('customerId') || '';
            fetchJobs(currentPage, searchTerm, pageSize, customerId);
          } catch (error: unknown) {
            console.error('❌ Import failed:', error);

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


 

  const renderRow = (job: any) => {
    
    return (
      <tr key={job.id}>
     
        <td> <Link href={`/jobs/view?jobId=${job.id}&ActiveWorkOrder`} className='hover:underline'>{job.id}</Link></td>
        <td>{job?.vin}</td>       
        <td>{job?.make}</td>       
        <td>{job?.model}</td>       
        <td>{job?.modelYear}</td>       
        <td>{job?.manufacturerName}</td>       
        <td>{job?.vehicleDescriptor}</td>       
        <td>{job?.vehicleType}</td>       
       
         
        <td>
           <Link href={`/reporting/view?customerId=${job.customerId}`} >
            <Image alt='eye' src={Eye} className='w-[16px] ' data-tooltip-id="view"
              data-tooltip-content="View" />
          </Link>
          <Tooltip id="view" place="top" />
        </td>
      </tr>
    )
  };

  return (
    <div className={`mobile_listing mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Customer Vehicles Info', href: '/jobs/active-job' }
        ]}
      />

      <CommonHeader heading="Customer Vehicles Info" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)}    userRole='Activejobs' buttonLabel="" buttonLink="" />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
         <thead>
            <tr> 
              <th className="w-[80px]" onClick={() => handleSort('id')}>
                Vehicle ID
                <SortIcon active={sortBy === 'id'} direction={sortDirection} />
              </th>
                <th className="w-[120px]">
                VIN
              </th> 
             
              <th className="w-[80px]">
                Make
              </th>
              <th className="w-[50px]">Model</th>
              <th className="w-[60px]">Year</th>
              
              <th className="w-[150px]">Manufacturer Name</th>
               <th className="w-[120px]">
                Vehicle Descriptor
              </th>  
              <th className="w-[100px]">Vehicle Type</th>
              <th className="w-[60px]">Action</th>
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
