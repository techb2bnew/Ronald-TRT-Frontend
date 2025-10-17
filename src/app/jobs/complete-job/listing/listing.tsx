// components/JobTable.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import TableActions from '../../../component/action';
import CommonHeader from '../../../component/commonHeader';
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import Pagination from '../../../component/pagination';
import axios from 'axios';
import Swal from 'sweetalert2';
import Empty from '@/app/component/empty';
import Loader from '@/app/component/loader';
import { ExportToCsv } from 'export-to-csv-file';
import Breadcrumb from '@/app/component/breadcrumb';
import { useSidebar } from "@/app/component/SidebarContext";
import Papa from 'papaparse';
import { Tooltip } from 'react-tooltip';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here
interface Jobs {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
}
const CompletedJobs: React.FC = () => {
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

  const handleDeleteSuccess = (deletedId: string) => {
    toast.success('Technician deleted successfully');

    // ✅ Remove the deleted technician from the table
    setActiveJob((prev) => prev.filter((cust) => cust.id !== deletedId));
  };


  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  const fetchCompleteJobs = async (page = 1, query = '', limit = pageSize) => {
    setLoading(true); 
    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types') || "";
      const userId = localStorage.getItem('userID');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoint = query.trim()
        ? roleType === 'superadmin' || roleType === 'manager'
          ? `${apiUrl}/searchTechnicianCompleteJob?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
          : `${apiUrl}/searchTechnicianCompleteJob?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : roleType === 'superadmin'
          ? `${apiUrl}/fetchCompleteJobStatus?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`
          : `${apiUrl}/fetchCompleteJobStatus?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;


      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();
      if (response.ok) {


        const fetchedTechnicians: Jobs[] = query.trim()
          ? data.ActiveJob || []  // For search API response
          : data.jobs.jobs || [];  // For pagination API response 
        // const filteredJobs = fetchedTechnicians.filter(completeJob => !completeJob.deletedStatus);
        setTotalPages(data?.jobs?.totalPages);
        setActiveJob(fetchedTechnicians);
        // setTotalPages(data.jobs.totalPages); // Set the total pages from API response
        // setCurrentPage(data.jobs.currentPage); // Update current page from API
      } else {
        if (data.error && data.error === 'Invalid Token') {
          router.push('/');
        } else {
          console.error('Error fetching technician data:', data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching technician data:', error);
    } finally {
      setLoading(false);  // Hide loader after fetching
    }
  };



  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCompleteJobs(currentPage, searchTerm, pageSize);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, pageSize]);

  // Function to handle sorting logic
  const handleSort = (column: string) => {
    const direction = sortDirection === "asc" ? "desc" : "asc";
    setSortDirection(direction);
    setSortBy(column);

    const sortedJobs = [...activeJob].sort((a, b) => {
      if (column === "customerName") {
        const nameA = `${a?.customer?.firstName} ${a?.customer?.lastName}`;
        const nameB = `${b?.customer?.firstName} ${b?.customer?.lastName}`;
        return direction === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }

      if (column === "technicianName") {
        const nameA = a?.technicians
          ?.map((tech: any) => `${tech.firstName} ${tech.lastName}`)
          .join(", ");
        const nameB = b?.technicians
          ?.map((tech: any) => `${tech.firstName} ${tech.lastName}`)
          .join(", ");
        return direction === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }

      if (a[column] < b[column]) return direction === "asc" ? -1 : 1;
      if (a[column] > b[column]) return direction === "asc" ? 1 : -1;
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
      filename: 'Complete Work Orders',
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Complete Work Orders',
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
            fetchCompleteJobs(currentPage, searchTerm, pageSize);
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

  const handleCheckboxChange = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const renderRow = (completejob: any) => {

    const isChecked = selectedIds.includes(completejob.id);
    const roleType = localStorage.getItem('types') || "";


    return (
      <React.Fragment key={completejob.id}>
        <tr key={completejob.id}>

          <td key="checkbox">
            <label className="flex items-center cursor-pointer relative">
              <input
                type="checkbox"
                className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow bg-white hover:shadow-md border border-slate-300 checked:bg-[var(--foreground)] checked:border-[var(--foreground)]"
                checked={isChecked}
                onChange={() => handleCheckboxChange(completejob.id)}
              />
              <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
              </span>
            </label>
          </td>
          <td> <Link href={`/jobs/view?jobId=${completejob.id}&completedJob`} className='hover:underline'>{completejob.id}</Link></td>
          <td> <Link href={`/jobs/view?jobId=${completejob.id}&completedJob`} className='hover:underline capitalize'>{completejob?.customer?.firstName} {completejob?.customer?.lastName}</Link></td>

          {/* <td>{completejob?.customer?.firstName} {completejob?.customer?.lastName}</td> */}
          <td> <Link href={`/technicians/view?technicianId=${completejob.technicians?.map((tech: any) => tech.id).join(',')}`} className='hover:underline'>{completejob?.technicians?.map((tech: any, index: number) => (
            <div key={`${tech.id}-${index}`} className='capitalize'>
              {tech.firstName} {tech.lastName}
            </div>
          ))}</Link></td>

          {/* <td>  {completejob?.technicians?.map((tech: any, index: number) => (
            <div key={`${tech.id}-${index}`}>
              {tech.firstName} {tech.lastName}
            </div>
          ))}</td> */}
          {/* <td>{completejob?.technician?.firstName} {completejob?.technician?.lastName}</td>  */}
          {roleType !== 'single-technician' && (

            <td>
              {(() => {
                if (!completejob) return null;

                // Step 1: Calculate subtotal from jobDescription
                const subtotalcost = completejob.jobDescription.reduce((sum: number, item: any) => {
                  return sum + Number(item.cost || 0);
                }, 0);

                // Step 2: Get flat rate and percentage — fallback to technician if job-level value is null/invalid
                const technician = completejob.technicians?.[0] || {};
                const simpleFlatRate = !isNaN(Number(completejob.simpleFlatRate)) && Number(completejob.simpleFlatRate) > 0
                  ? Number(completejob.simpleFlatRate)
                  : (!isNaN(Number(technician.simpleFlatRate)) ? Number(technician.simpleFlatRate) : 0);

                const amountPercentage = !isNaN(Number(completejob.amountPercentage)) && Number(completejob.amountPercentage) > 0
                  ? Number(completejob.amountPercentage)
                  : (!isNaN(Number(technician.amountPercentage)) ? Number(technician.amountPercentage) : 0);

                // Step 3: Calculate percentage amount
                const percentageAmount = (amountPercentage * subtotalcost) / 100;

                // Step 4: Check if flat rate or percentage amount is missing and display accordingly
                if (simpleFlatRate === 0 && amountPercentage === 0) {
                  // If no valid flat rate or percentage, just show the subtotal
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      ${subtotalcost.toFixed(2)}
                    </div>
                  );
                }

                // Step 5: Calculate total = subtotal + flat rate + percentage amount
                const totalCost = subtotalcost + simpleFlatRate + percentageAmount;

                // Step 6: Show red dot tooltip if neither flat rate nor percentage are valid
                if (simpleFlatRate === 0 && amountPercentage === 0) {
                  const tooltipId = `tooltip-${completejob.id}`;
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

                // Step 7: Return total cost
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    ${totalCost.toFixed(2)}
                  </div>
                );
              })()}
            </td>

          )}

          {roleType === 'single-technician' && (
            <td>
              {(() => {
                if (!completejob) return null;

                // If jobDescription exists, calculate the subtotal cost
                const subtotalcost = completejob.jobDescription?.reduce((sum: number, item: any) => {
                  return sum + Number(item.cost || 0);
                }, 0) || 0; // Default to 0 if jobDescription is not present

                const labourCost = Number(completejob.labourCost || 0); // Labour cost, defaults to 0 if not available

                const totalCost = subtotalcost + labourCost;

                if (subtotalcost === 0) {
                  const tooltipId = `tooltip-${completejob.id}`;
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

                // If jobDescription exists, show total cost of job + labour cost
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    ${totalCost.toFixed(2)}
                  </div>
                );
              })()}
            </td>
          )}

          <td>{completejob.vin}</td>
          <td>{completejob.make}</td>
          <td>{new Date(completejob.createdAt).toLocaleDateString('en-GB')}</td>
          <td>{new Date(completejob.completedDate).toLocaleDateString('en-GB')}</td>
          <td>
            <span
              className={`badge ${completejob.jobStatus
                ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow'
                : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'
                }`}
            >
              {completejob.jobStatus ? 'Completed' : 'Inprogress'}
            </span>
          </td>
          <td>
            <TableActions
              editRoute={`/jobs/create-job/create?jobId=${completejob.id}&completeOrder`}
              deleteRoute={`/api/deleteJob`}  // Pass the correct endpoint 
              viewRoute={`/jobs/view?jobId=${completejob.id}&completedJob`}
              idKey="jobid"
              userRole='Completedjobs'
              itemId={completejob.id}  // Pass the technician ID
              onDeleteSuccess={() => handleDeleteSuccess(completejob.id)}
            />
          </td>
        </tr>
      </React.Fragment>
    );
  };

  return (
    <div className={`mobile_listing mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Completed Work Orders', href: '/jobs/complete-job/listing' }
        ]}
      />
      <CommonHeader heading="Completed Work Orders" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='' buttonLabel=" " buttonLink="" />

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
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white-500'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              {/* <th className="w-[150px]" onClick={() => handleSort('jobDescription')}>
                Job Description
                {sortBy === 'jobDescription' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-green-500' : 'text-red-500'}`}>
                   {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th> */}
              <th className="w-[160px]" onClick={() => handleSort('customerName')}>
                Customer Name
                {sortBy === 'customerName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white-500'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[160px]" onClick={() => handleSort('technicianName')}>
                Technician Name
                {sortBy === 'technicianName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white-500'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>

              <th className="w-[100px]">Total Cost</th>
              <th className="w-[160px]">VIN</th>
              <th className="w-[100px]">Vehicle Make</th>
              <th className="w-[100px]">Start Date</th>
              <th className="w-[120px]">Completion Date</th>
              <th className="w-[120px]">Order Status</th>
              <th className="w-[120px]">Action</th>
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
              activeJob.map((completejob) => renderRow(completejob))
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

export default CompletedJobs;
