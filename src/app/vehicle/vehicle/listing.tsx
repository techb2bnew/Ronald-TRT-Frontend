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

interface VehcileInfo {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
  Role: { name: string };
}
const JobTable: React.FC = () => {
  const [activeJob, setActiveJob] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Manage sorting column state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpense, setTotalExpense] = useState('0');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isCollapsed } = useSidebar();
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(''); // State for selected job ID

  const [roleType, setRoleType] = useState<string | null>(null);

  useEffect(() => {
    // Ensure this code runs only on the client-side (after the component mounts)
    const storedRoleType = localStorage.getItem('types');
    setRoleType(storedRoleType); // Set the roleType from localStorage
  }, []);

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
        ? roleType === 'superadmin'
          ? `/api/vehicleInfo?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
          : `/api/vehicleInfo?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : roleType === 'superadmin' || roleType === 'manager'
          ? `/api/vehicleInfo?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`
          : `/api/vehicleInfo?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;

      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();

      if (response.ok) {
        const fetchedTechnicians: VehcileInfo[] = query.trim()
          ? data.data.vehicles || []
          : data.response.vehicles || [];
        setActiveJob(fetchedTechnicians);
        setTotalPages(data.response?.totalPages || 1);
        setTotalJobs(data.jobs?.totalJobs || 0);
        setTotalExpense(data.response?.totalEstimateCost || data.data.totalEstimateCost);

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
      if (column === 'fullName') {
        const nameA = `${a?.customer?.fullName}`;
        const nameB = `${b?.customer?.fullName}`;
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
          fetchJobs(currentPage, searchTerm);

          setActiveJob(prev => prev.map(job => {
            if (job.id === vehicleId) {
              return { ...job, jobStatus: !job.jobStatus };
            }
            fetchJobs(currentPage, searchTerm);
            return job;
          }));
          Swal.fire({
            title: 'Success!',
            text: 'Vehicle / Work Order status updated successfully.',
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
        console.error('Error updating Vehicle / Work Order status:', error);
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
        jobDescription: jobData.jobDescription.join(' '),
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
        setTotalExpense(response.data.vehicles?.totalEstimateCost || 0);

      } catch (error) {
        console.error("Error fetching filtered jobs:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderRow = (job: any) => {
    const isChecked = selectedIds.includes(job.id);
    const roleType = localStorage.getItem('types') || "";

    return (
      <>
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
          <td> <Link href={`/vehicle/view?vehicleId=${job.id}`} className='hover:underline'> {job.id}</Link> </td>


          <td>{job?.jobName}</td>
          <td>  {job?.customer?.fullName} </td>

          {/* <td><a className="hover:underline" href={`tel:${job?.customer?.phoneNumber}`}>{job?.customer?.phoneNumber}</a></td> */}
          {roleType !== 'single-technician' && (
            <td>
              {job?.assignedTechnicians
                ?.filter((tech: any) => tech.techType === 'technician')
                ?.map((tech: any) => (
                  <div key={tech.id} className="capitalize">
                    {tech.firstName} {tech.lastName}
                  </div>
                ))}
            </td>
          )}
          {roleType !== 'single-technician' && (
            <td>
              {job?.assignedTechnicians?.map((tech: any) => (
                <div key={tech.id} className="capitalize">
                  {tech.VehicleTechnician?.techFlatRate !== '' && (
                    `$${tech.VehicleTechnician?.techFlatRate}`
                  )}

                </div>
              ))}
            </td>
          )}
          {roleType !== 'single-technician' && (

            <td>
              {job?.assignedTechnicians
                ?.filter((tech: any) => tech.techType === 'R/I/R/R')
                ?.map((tech: any) => (
                  <div key={tech.id} className="capitalize">
                    {tech.firstName} {tech.lastName}
                  </div>
                ))}
            </td>
          )}


          {roleType !== 'single-technician' && (
            <td>
              {job?.assignedTechnicians?.map((tech: any) => (
                <div key={tech.id} className="capitalize">
                  {tech.VehicleTechnician?.rRate !== '' && (
                    `$${tech.VehicleTechnician?.rRate}`
                  )}
                </div>
              ))}
            </td>
          )}
          {roleType !== 'single-technician' && (
            <td>${job?.totalCombined}</td>
          )}

          {/* <td>{job?.assignedTechnicians?.map((tech: any) => (
          <div key={tech.id}>
            <a className="hover:underline" href={`tel:${tech.technicians}`}>
              {tech.phoneNumber}
            </a>
          </div>
        ))}</td> */}
          <td>{job?.vin}</td>
          <td>{job.startDate ? new Date(job.startDate).toLocaleDateString() : ''}</td>
          <td>{job.endDate ? new Date(job.endDate).toLocaleDateString() : ''}</td>

          {roleType === 'single-technician' && (
            <td>
              {job.labourCost !== null && (
                `$${job.labourCost || '-'}`
              ) || '-'}
            </td>
          )}
          <td>
            {canCreate && (

              <span onClick={() => toggleApproval(job.id, job.vehicleStatus)} style={{ cursor: 'pointer' }}
                className={`badge ${job.vehicleStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
              >
                {job.vehicleStatus ? 'Completed' : 'In Progress'}
              </span>
            )}

          </td>
          <td>
            <TableActions
              editRoute={`/vehicle/create-vehicle?vahicleId=${job.id}`}
              deleteRoute={`/api/deleteVehicle`}  // Pass the correct endpoint
              viewRoute={`/vehicle/view?vehicleId=${job.id}`}
              idKey="vehicleId"
              userRole='Activejobs'
              itemId={job.id}  // Pass the technician ID
              onDeleteSuccess={() => handleDeleteSuccess(job.id)}
            />
          </td>
        </tr>

      </>
    )
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
      vehicleStatus: false, // Example status, can change based on the filter criteria
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
        setActiveJob(data.vehicles.updatedVehicles);
        setTotalExpense(data.vehicles?.totalEstimateCost || 0);

        // You can update state or perform further operations based on the response
      } else {
        console.error("Failed to apply filter:", data.error || 'Unknown error');
      }
    } catch (error) {
      console.error("Error during API request:", error);
    }
  };


  return (
    <div className={` mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Work Order List', href: '/vehicle/vehicle' }
        ]}
      />

      <CommonHeader heading="Work Order List" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='Activejobs' buttonLabel="Create Vehicle / Work Order" buttonLink="/vehicle/create-vehicle" showDatePicker={true}
        onDateChange={handleDateChange} onNewJobClick={handleNewJobClick} />

      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[50px]">
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
              <th className="w-[120px]">Job Title</th>

              <th className="w-[120px]"  >
                Customer Name
              </th>
              {/* <th className="w-[120px]">
                Customer Number
              </th> */}
              {roleType !== 'single-technician' && (
                <th className="w-[150px]" >
                  Assigned Technician
                </th>
              )}
              {roleType !== 'single-technician' && (
                <th className="w-[120px]">Tech Flat Rate</th>
              )}
              {roleType !== 'single-technician' && (
                <th className="w-[130px]" >
                  Assigned R/I/R/R
                </th>
              )}
              {roleType !== 'single-technician' && (
                <th className="w-[80px]">R/I/R/R</th>
              )}
              {roleType !== 'single-technician' && (
                <th className="w-[120px]">Total Expense</th>
              )}
              <th className="w-[150px]">VIN</th>
              <th className="w-[100px]">Start Date</th>
              <th className="w-[80px]">End Date</th>

              {roleType === 'single-technician' && (
                <th className="w-[80px]">Labour Cost</th>
              )}
              <th className="w-[130px]">Status</th>
              <th className="w-[100px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={roleType === 'single-technician' ? 10 : 12} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : activeJob?.length === 0 ? (
              <tr>
                <td colSpan={roleType === 'single-technician' ? 10 : 12} className="text-center py-10">
                  <Empty />
                </td>
              </tr>
            ) : (
              activeJob?.map((job) => renderRow(job))
            )}
            {roleType !== 'single-technician' && (

              <tr>
                <td colSpan={9} className='text-right font-semibold'>
                  <span className='pr-6'>
                    Total: ${totalExpense}
                  </span>
                </td>
              </tr>
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
