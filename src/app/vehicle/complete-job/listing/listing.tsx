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
          ? `${apiUrl}/completeWorkOrderSearch?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
          : `${apiUrl}/completeWorkOrderSearch?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : roleType === 'superadmin'
          ? `${apiUrl}/fetchCompleteWorkOrderStatus?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`
          : `${apiUrl}/fetchCompleteWorkOrderStatus?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;


      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();
      if (response.ok) {


        const fetchedTechnicians: Jobs[] = query.trim()
          ? data.data.vehicles || []  // For search API response
          : data.vehicles.vehicles || [];  // For pagination API response 
        // const filteredJobs = fetchedTechnicians.filter(completeJob => !completeJob.deletedStatus);
        setTotalPages(data?.vehicles?.totalPages);
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

      // Extract technician data including techFlatRate and rRate
      const technicianRates = jobData.assignedTechnicians.map((tech: any) => {
        const vt = tech.VehicleTechnician || {};
        return `${tech.firstName} ${tech.lastName} - TechnicianFlatRate: ${vt.techFlatRate || ''}, RIRR: ${vt.rRate || ''}`;
      }).join(', ');
      return {
        id: jobData.id,
        vin: jobData.vin,
        customer: `${jobData?.customer?.fullName}`,
        jobName: jobData.jobName,
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
        jobDescription: jobData.jobDescription.join(', '),
        technicianRates: technicianRates,
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
        'id', 'vin', 'customer', 'jobName', 'assignCustomer', 'bodyClass', 'color',
        'make', 'model', 'vehicleType',
        'modelYear', 'vehicleDescriptor', 'manufacturerName',
        'plantCompanyName', 'plantCountry', 'plantState', 'deletedStatus',
        'notes', 'technicians', 'assignTechnicians',
        'jobDescription', 'technicianRates'
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

              // Handle jobDescription array
              const jobDescriptions = row.jobDescription
                ? row.jobDescription.split(',').map((desc: any) => desc.trim())  // Split by commas and trim each description
                : [];

              return {
                ...row,
                technicians,
                jobDescription: jobDescriptions,
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
            fetchCompleteJobs(currentPage, searchTerm, pageSize);
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

  const toggleApproval = async (vehicleId: number, currentApprovalStatus: boolean) => {
    // Show a confirmation dialog before proceeding
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to change the status of this Vehicle / Work Order?',
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
        const technicianData = localStorage.getItem('technicianData'); 
        let completedBy = '';
        if (technicianData) {
          try {
            const parsed = JSON.parse(technicianData);
            completedBy = `${parsed.firstName} ${parsed.lastName}`;
          } catch (err) {
            console.error('Failed to parse technicianData:', err);
          }
        }
        const config = {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        };

        const response = await axios.post(`/api/workOrderComplete`, {
          vehicleId,
          completedBy,
          vehicleStatus: !currentApprovalStatus
        }, config);

        if (response.data.status) {
          // Optimistically update the local state
          setActiveJob(prev => prev.map(job => {
            if (job.id === vehicleId) {
              return { ...job, jobStatus: !job.jobStatus };
            }
            fetchCompleteJobs(currentPage, searchTerm, pageSize);
            return job;
          }));
          Swal.fire({
            title: 'Success!',
            text: 'Vehicle / Work Order   status updated successfully.',
            confirmButtonColor: '#383d71',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } else {
          console.error('Failed to update Vehicle / Work Order status');
          Swal.fire({
            title: 'Error!',
            text: 'Failed to update Vehicle / Work Order status.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      } catch (error) {
        console.error('Error updating job status:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Error updating Vehicle / Work Order status.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } else {
      // User clicked 'Cancel', do nothing
      Swal.fire({
        title: 'Cancelled',
        text: 'Vehicle / Work Order status change was cancelled.',
        icon: 'info',
        confirmButtonText: 'OK'
      });
    }
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
          vehicleStatus: 'true',
        };
        if (roleType !== 'superadmin' && roleType !== 'manager') {
          requestBody.technicianId = userId; // Add technicianId for non-admin and non-manager roles
        }
        const response = await axios.post(apiPoint, requestBody, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        setActiveJob(response.data.vehicles);
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
      vehicleStatus: true, // Example status, can change based on the filter criteria
    };
    console.log(payload, 'payload');

    try {
      // Check if the token is available
      if (!token) {
        console.error("No token found");
        return; // Stop if the token is missing
      }

      // Make the POST request to the vehicleJobNameFilter API endpoint
      const response = await fetch(`${apiUrl}/vehicleJobNameFilter`, {
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
        setActiveJob(data.vehicles);
        // You can update state or perform further operations based on the response
      } else {
        console.error("Failed to apply filter:", data.error || 'Unknown error');
      }
    } catch (error) {
      console.error("Error during API request:", error);
    }
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
          <td> <Link href={`/vehicle/view?vehicleId=${completejob.id}`} className='hover:underline'> {completejob.id}</Link> </td>
          <td>{completejob?.jobName}</td>
          <td>  {completejob?.customer?.fullName} </td>

          <td> {completejob?.assignedTechnicians?.map((tech: any, index: number) => (
            <div key={`${tech.id}-${index}`} className='capitalize'>
              {tech.firstName} {tech.lastName}
            </div>
          ))} </td>

          {/* <td>  {completejob?.technicians?.map((tech: any, index: number) => (
            <div key={`${tech.id}-${index}`}>
              {tech.firstName} {tech.lastName}
            </div>
          ))}</td> */}
          {/* <td>{completejob?.technician?.firstName} {completejob?.technician?.lastName}</td>  */}



          <td>{completejob.vin}</td>
          <td>{completejob.make}</td>
          <td>{completejob.startDate ? new Date(completejob.startDate).toLocaleDateString() : ''}</td>
          <td>{completejob.endDate ? new Date(completejob.endDate).toLocaleDateString() : ''}</td>
          <td>
            <span onClick={() => toggleApproval(completejob.id, completejob.vehicleStatus)} style={{ cursor: 'pointer' }}
              className={`badge ${completejob.vehicleStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
            >
              {completejob.vehicleStatus ? 'Completed' : 'In Progress'}
            </span>


          </td>

          <td>
            <TableActions
              editRoute={`/vehicle/create-vehicle?vahicleId=${completejob.id}&completeOrder`}
              deleteRoute={`/api/deleteVehicle`}  // Pass the correct endpoint
              viewRoute={`/vehicle/view?vehicleId=${completejob.id}`}
              idKey="vehicleId"
              userRole='Activejobs'
              itemId={completejob.id}  // Pass the technician ID
              onDeleteSuccess={() => handleDeleteSuccess(completejob.id)}
            />
          </td>
        </tr>
      </React.Fragment>
    );
  };

  return (
    <div className={` mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Completed Work Orders', href: '/jobs/complete-job/listing' }
        ]}
      />
      <CommonHeader heading="Completed Work Orders" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='' buttonLabel=" " buttonLink="" showDatePicker={true}
        onDateChange={handleDateChange} onNewJobClick={handleNewJobClick} />

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
              <th className="w-[100px]">Job Title</th>
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
              <th className="w-[160px]">VIN</th>
              <th className="w-[100px]">Vehicle Make</th>
              <th className="w-[100px]">Start Date</th>
              <th className="w-[120px]">End Date</th>
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
