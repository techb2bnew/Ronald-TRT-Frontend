// components/JobTable.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import CommonHeader from '../../../component/commonHeader';
import { useRouter } from "next/navigation";
import Pagination from '../../../component/pagination';
import axios from 'axios';
import Swal from 'sweetalert2';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import Eye from '../../../../../public/eye.svg'
import Delete from "../../../../../public/delete.svg";
import Image from 'next/image';
import Link from 'next/link';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSidebar } from "@/app/component/SidebarContext";
import Papa from 'papaparse';
import toast from 'react-hot-toast';



const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here
interface Jobs {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
}
interface ActiveJobState {
  jobs: any[];
  totalGroupJob: any[];
}
type Props = {
};
function JobTListing({ }: Props) {
  const [activeJob, setActiveJob] = useState<ActiveJobState>({ jobs: [], totalGroupJob: [] });
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
  const [filterType, setFilterType] = useState<'' | 'completed' | 'inProgress'>('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = (searchTerm: string) => {
    console.log('Searching for:', searchTerm);
    // Implement search logic here
  };

  const fetchJobs = async (
    page = 1,
    query = '',
    limit = pageSize,
    filterType: 'completed' | 'inProgress' | '' = ''
  ) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types') || '';
      const userId = localStorage.getItem('userID');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let endpoint = '';

      if (filterType) {
        endpoint = `${apiUrl}/fetchGroupJob?filterType=${filterType}&roleType=${encodeURIComponent(roleType)}&userId=${userId}`;
      } else if (query.trim()) {
        endpoint =
          roleType === 'superadmin'
            ? `${apiUrl}/searchGroupJob?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}&userId=${userId}`
            : `${apiUrl}/searchGroupJob?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}&userId=${userId}`;
      } else {
        endpoint =
          roleType === 'superadmin'
            ? `${apiUrl}/fetchGroupJob?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}&userId=${userId}`
            : `${apiUrl}/fetchGroupJob?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}&userId=${userId}`;
      }

      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();

      if (response.ok) {
        const isSearch = query.trim() !== '';
        const fetchedTechnicians: Jobs[] = query.trim()
          ? data.searchGroup || []
          : data.GroupJob || [];
        setIsSearchActive(isSearch);
        if (isSearch) {
          setSearchResults(fetchedTechnicians); // ✅ Add this
        }
        setActiveJob({
          jobs: fetchedTechnicians,
          totalGroupJob: data.totalGroupJob || [],
        });
        console.log(fetchedTechnicians, 'fetchedTechnicians')
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

    const sortedJobs = [...activeJob.jobs].sort((a, b) => {
      if (column === 'id') {
        const idA = Number(a.customer.id);  // Directly access a.id
        const idB = Number(b.customer.id);
        return direction === 'asc' ? idA - idB : idB - idA;
      }
      if (column === 'customerName') {
        const nameA = `${a?.customer?.customer?.firstName} ${a?.customer?.customer?.lastName}`;
        const nameB = `${b?.customer?.customer?.firstName} ${b?.customer?.customer?.lastName}`;
        return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (column === 'technicianName') {
        const nameF = `${a?.customer?.technician?.firstName} ${a?.customer?.technician?.lastName}`;
        const nameL = `${b?.customer?.technician?.firstName} ${b?.customer?.technician?.lastName}`;
        return direction === 'asc' ? nameF.localeCompare(nameL) : nameL.localeCompare(nameF);
      }

      if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setActiveJob((prev) => ({
      ...prev,
      jobs: sortedJobs,
    }));
  };



  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };

  // CSV Export Functions
  const downloadCSV = () => {
    const selectedJobs = activeJob.jobs.filter(c => selectedIds.includes(c.customer.id));

    if (selectedJobs.length === 0) {
      toast.error("Please select at least job group to export.");
      return;
    }

    const csvOptions = {
      filename: 'Group Work Orders',
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Group Work Orders',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true, // Use object keys as headers
    };

    const csvExporter = new ExportToCsv(csvOptions);

    const formattedData = selectedJobs.map((jobData) => {
      const subTotal = jobData.customer.jobDescription.reduce((sum: number, item: any) => {
        return sum + Number(item.cost || 0);
      }, 0);
      return {
        id: jobData?.customer?.id,
        vin: jobData.customer?.vin,
        customer: `${jobData?.customer?.customer?.firstName} ${jobData?.customer?.customer?.lastName}`,
        assignCustomer: jobData.customer?.assignCustomer,
        bodyClass: jobData.customer?.bodyClass,
        color: jobData.customer?.color,
        make: jobData.customer?.make,
        model: jobData.customer?.model,
        amountPercentage: jobData.customer?.amountPercentage,
        payRate: jobData.customer?.payRate,
        vehicleType: jobData.customer?.vehicleType,
        simpleFlatRate: jobData.customer?.simpleFlatRate,
        'modelYear': jobData.customer?.modelYear,
        'vehicleDescriptor': jobData.customer?.vehicleDescriptor,
        'manufacturerName': jobData.customer?.manufacturerName,
        'plantCompanyName': jobData.customer?.plantCompanyName,
        'plantCountry': jobData.customer?.plantCountry,
        'plantState': jobData.customer?.plantState,
        deletedStatus: jobData.customer.deletedStatus,
        estimatedBy: jobData.customer.estimatedBy,
        notes: jobData.customer?.notes,
        jobStatus: jobData.customer?.jobStatus ? 'true' : 'false',
        technicians: jobData.customer?.technicians.map((tech: any) => `${tech.firstName} ${tech.lastName}`).join(', '),
        assignTechnicians: jobData.customer?.technicians.map((techId: any) => `${techId.id}`).join(', '),
        jobDescription: jobData.customer.jobDescription.map((jobDescription: any) => `${jobDescription.jobDescription}`).join(', '),
        cost: jobData.customer.jobDescription.map((cost: any) => `${cost.cost}`).join(', '),
        subTotal: subTotal.toFixed(2),


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
        'plantCompanyName', 'plantCountry', 'plantState', 'deletedStatus',
        'estimatedBy', 'notes', 'jobStatus', 'technicians', 'assignTechnicians',
        'jobDescription', 'cost', 'subTotal'
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
              `${apiUrl}/importActiveJob`,
              { data: payloadData },
              { headers }
            );
            toast.success('CSV Import Successful!');
            fetchJobs(currentPage, searchTerm, pageSize);
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

  const handleCheckboxChange = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  const normalizedJobs: any[] = [];

  const sourceJobs = isSearchActive ? searchResults : activeJob.jobs;

  if (Array.isArray(sourceJobs)) {
    sourceJobs.forEach((jobGroup: any) => {
      if (Array.isArray(jobGroup.customer)) {
        jobGroup.customer.forEach((customer: any) => {
          normalizedJobs.push({
            ...jobGroup,
            customer,
          });
        });
      } else if (jobGroup.customer && typeof jobGroup.customer === 'object') {
        // Handle case where `customer` is a single object
        normalizedJobs.push({
          ...jobGroup,
          customer: jobGroup.customer,
        });
      }
    });
  }

  const handleDeleteGroupJob = async (vin: string) => {
    try {
      // Step 1: Confirm before proceeding
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'Do you really want to delete this job group?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: 'gray',
        confirmButtonText: 'Yes, delete it!',
      });
      if (result.isConfirmed) {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        };

        await axios.post(
          `${apiUrl}/deleteGroupJobs`,
          {
            vin: vin,
            deletedStatus: false,
          },
          config
        );
        Swal.fire({
          title: 'Deleted!',
          text: 'Job group has been marked as not deleted.',
          icon: 'success',
          confirmButtonColor: '#383d71',
        });
        fetchJobs(currentPage, searchTerm, pageSize);
      }

    } catch (error) {
      console.error('Error deleting job group:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Something went wrong while deleting.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };




  const renderRow = (job: any) => {
    const roleType = localStorage.getItem('types') || "";

 const group = activeJob.totalGroupJob?.find((g: any) => g.vin === job.vin);

if (!group) {
  return (
    <tr key={job.vin}>
      {/* ...other cells */}
      <td>0.00</td> {/* subtotal */}
      <td>0.00</td> {/* total cost */}
    </tr>
  );
}

// 1. Calculate subtotal sum of all jobDescriptions of all jobs in this VIN group
const subtotal = group.jobs.reduce((sumAcc: number, job: any) => {
  const jobSubtotal = job.jobDescription?.reduce((costAcc: number, jd: any) => {
    return costAcc + Number(jd.cost || 0);
  }, 0) || 0;
  return sumAcc + jobSubtotal;
}, 0);

// 2. Calculate total cost as sum of each job's cost + percentage on jobDescription + flatRate
const totalCost = group.jobs.reduce((acc: number, job: any) => {
  const jobSubtotal = job.jobDescription?.reduce((costAcc: number, jd: any) => {
    return costAcc + Number(jd.cost || 0);
  }, 0) || 0;

  const amountPerc = Number(job.amountPercentage) || 0;
  const flatRate = Number(job.simpleFlatRate) || 0;

  // Percentage applied on job's subtotal
  const percAmount = (amountPerc * jobSubtotal) / 100;

  // Job total is jobSubtotal + percentage amount + flat rate
  const jobTotal = jobSubtotal + percAmount + flatRate;

  return acc + jobTotal;
}, 0);

    const isChecked = selectedIds.includes(job.customer.id);

    return (
      <tr key={job?.customer?.id}>
        <td>
          <label className="flex items-center cursor-pointer relative">
            <input
              type="checkbox"
              className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[var(--foreground)]"
              checked={isChecked}
              onChange={() => handleCheckboxChange(job.customer.id)}
            />
            <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
            </span>
          </label>
        </td>

        <td>
          <Link href={`/jobs/job-group/view?vin=${job.vin}&completedJob`} className='hover:underline capitalize'>
            {job?.customer?.customer?.firstName} {job?.customer?.customer?.lastName}
          </Link>
        </td>

        <td><a className="hover:underline" href={`tel:${job?.customer?.customer?.phoneNumber}`}>{job?.customer?.customer?.phoneNumber}</a></td>

        <td>
          {job?.customer?.technicians?.map((t: any, i: number) => (
            <div key={`${t.id}-${i}`} className='capitalize'>{t.firstName} {t.lastName}</div>
          ))}
        </td>

        <td>{job?.customer.vin}</td>

        <td>
          <span className={`badge ${job.groupStatus === "completed"
            ? "bg-[#E6F9DD] text-[#1A932E]"  // Green for Completed
            : "bg-[#FFE4E1] text-[#FF0000]"  // Red for In Progress
            } p-2 pl-4 pr-4 rounded shadow`}>
            {job.groupStatus === "completed" ? "Completed" : "In Progress"}
          </span>
        </td>


        <td>
          {(() => {
            // For regular non-search case, we use totalGroupJob
            const group = activeJob.totalGroupJob?.find((g: any) => g.vin === job.vin);

            // If it's a search, we need to look in searchResults (which corresponds to searchGroup)
            if (isSearchActive) {
              const searchGroupItem = searchResults.find((s: any) => s.vin === job.vin);

              // Check if the searchGroupItem exists in the searchResults
              if (searchGroupItem && searchGroupItem.customer) {
                const customers = Array.isArray(searchGroupItem.customer)
                  ? searchGroupItem.customer
                  : [searchGroupItem.customer]; // convert to array if it's a single object

                const completedJobsSearch = customers.filter((c: any) => c.jobStatus).length;
                return `${completedJobsSearch}/${searchGroupItem.vinCount} Jobs Done`;

              } else {
                return '0/0'; // Return if no matching group in search results
              }
            }

            // Regular case (non-search): Use totalGroupJob
            if (!group) return '0/0';

            const completedJobs = group.jobs.filter((j: any) => j.jobStatus).length;
            return `${completedJobs}/${group.count} Jobs Done`;
          })()}
        </td>



        {/* <td>${(job?.customer?.simpleFlatRate && simpleFlatRate > 0 ? subtotalcost : totalCost).toFixed(2)}</td> */}
        <td>${subtotal.toFixed(2)}</td>
        {/* {roleType !== 'single-technician' && (
          <td>
            {(() => {
              const tech = job.customer.technicians?.[0] || {};
              const jobFlat = Number(job.customer.simpleFlatRate);
              const techFlat = Number(tech.simpleFlatRate);
              const flatRate = jobFlat > 0 ? jobFlat : (techFlat > 0 ? techFlat : 0);

              const jobPerc = Number(job.customer.amountPercentage);
              const techPerc = Number(tech.amountPercentage);
              const percentage = jobPerc > 0 ? jobPerc : (techPerc > 0 ? techPerc : 0);

              if (flatRate === 0 && percentage === 0) {
                return <span style={{ color: 'red' }}>Per job</span>;
              }

              if (flatRate > 0) {
                return `$${flatRate.toFixed(2)}`;
              }

              const amount = (subtotalcost * percentage) / 100;
              return `$${amount.toFixed(2)} (${percentage}%)`;
            })()}
          </td>
        )}

        {roleType === 'single-technician' && (
          <td>
            {(() => {
              const labourCost = Number(job.customer.labourCost || 0);
              if (labourCost === 0) {
                return <span style={{ color: 'red' }}>Labour not set</span>;
              }
              return `$${labourCost.toFixed(2)}`;
            })()}
          </td>
        )} */}
        <td>${totalCost.toFixed(2)}</td>
        {/* {roleType !== 'single-technician' && (
          <td>
            {(() => {
              const tech = job.customer.technicians?.[0] || {};

              const flat = Number(job.customer.simpleFlatRate) || Number(tech.simpleFlatRate || 0);
              const perc = Number(job.customer.amountPercentage) || Number(tech.amountPercentage || 0);
              const percAmount = (perc * subtotalcost) / 100;

              let total = subtotalcost;

              // Agar flat non-zero hai, flat add karo; warna percAmount add karo
              if (flat > 0) {
                total += flat;
              } else if (perc > 0) {
                total += percAmount;
              }

              return `$${total.toFixed(2)}`;

            })()}
          </td>
        )} */}

        {roleType === 'single-technician' && (
          <td>
            {(() => {
              const labour = Number(job.customer.labourCost || 0);
              const total = subtotal + labour;
              if (subtotal === 0) return <span style={{ color: 'red' }}>No R/I/R/R price</span>;
              return `$${total.toFixed(2)}`;
            })()}
          </td>
        )}

        <td>
          <div className="flex items-center gap-3">
            <Link href={`/jobs/job-group/view?vin=${job?.vin}`}>
              <Image alt="eye" src={Eye} className="w-[16px]" data-tooltip-id="view" data-tooltip-content="View" />
            </Link>
            <div onClick={() => handleDeleteGroupJob(job.vin)} className='cursor-pointer'>
              <Image alt="delete" src={Delete} className="w-[12px]" data-tooltip-id="Delete" data-tooltip-content="Delete" />
            </div>
            <Tooltip id="view" place="top" />
            <Tooltip id="Delete" place="top" />
          </div>
        </td>
      </tr>
    );
  };



  return (
    <div className={` mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Group Work Orders', href: '/jobs/job-group/listing' }
        ]}
      />
      <CommonHeader heading="" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} userRole='' onExport={downloadCSV} onImport={handleImportCSV} buttonLabel="" buttonLink="" onCompletedClick={() => {
        setFilterType('completed');
        fetchJobs(1, '', pageSize, 'completed');
      }}

        onInProgressClick={() => {
          setFilterType('inProgress');
          fetchJobs(1, '', pageSize, 'inProgress');
        }}
      />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[35px]">
                <label className="flex items-center cursor-pointer relative">

                  <input
                    type="checkbox"
                    checked={selectedIds.length === activeJob.jobs.length}
                    className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[#fff]"

                    onChange={() =>
                      setSelectedIds(
                        selectedIds.length === activeJob.jobs.length ? [] : activeJob.jobs.map((cust) => cust.customer.id)
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
              {/* <th className="w-[50px]" onClick={() => handleSort('id')}>
                ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th> */}
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
              <th className="w-[150px]" >
                VIN
              </th>
              <th className="w-[100px]" >
                Status
              </th>
              <th className="w-[100px]">Jobs Progress</th>
              <th className="w-[100px]">Sub Total Cost</th>
              {/* <th className="w-[100px]">R/I R/R</th> */}
              <th className="w-[100px]">Total Cost</th>
              <th className="w-[100px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : normalizedJobs.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10">
                  <Empty />
                </td>
              </tr>
            ) : (
              normalizedJobs.map((job) => renderRow(job))
            )}
          </tbody>
        </table>
      </div>
      {normalizedJobs.length > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
};

export default JobTListing;
