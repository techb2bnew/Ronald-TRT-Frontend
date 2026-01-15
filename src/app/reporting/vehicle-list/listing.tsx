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
import Papa from 'papaparse';


const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here

interface VehcileInfo {
  id: string;
  name: string;
  email: string;
  deletedStatus?: boolean;
  Role: { name: string };
}

const VehicleTable: React.FC = () => {
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
          ? `${apiUrl}/searchVehicalInfo?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
          : `${apiUrl}/searchVehicalInfo?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : roleType === 'superadmin'
          ? `/api/vehicalList?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`
          : `/api/vehicalList?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;

      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();
      if (response.ok) {
        const fetchedTechnicians: VehcileInfo[] = query.trim()
          ? data.data.vehicles || []
          : data.jobs.vehicles || [];

        setActiveJob(fetchedTechnicians);
        setTotalPages(data.jobs.totalPages);
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



  const handlePageChange = (data: { selected: number }) => {
    console.log(`Going to page number ${data.selected + 1}`);  // react-paginate uses zero-based index
    setCurrentPage(data.selected + 1);
  };

  // CSV Export Functions
 
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
    const technicianRates = jobData.assignedTechnicians.map((tech:any) => {
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
        <td>{job?.jobId}</td> 
        <td>{job?.jobName}</td>

        <td>{job?.customer?.fullName}  </td>
        <td>  {job?.assignedTechnicians?.map((tech: any) => (
          <div key={tech.id} className='capitalize'>
            {tech.firstName} {tech.lastName}
          </div>
        ))}</td>
        <td>{job.vin} </td>
        <td>{job.make} </td>
        <td>{job.model}</td>
        <td>{job.modelYear}</td> 
        <td> {job.endDate?new Date(job.startDate).toLocaleDateString('en-GB') : ''}</td>
        <td>
          {job.endDate
            ? new Date(job.endDate).toLocaleDateString('en-GB')
            : ''}
        </td>
 

      </tr>
    );
  };

  return (
    <div className={` mobile_listing mx-auto mt-4 transition-all duration-300 ${isCollapsed ? 'w-full pl-[5rem]' : 'container'}`}>
      <Breadcrumb
        items={[
          { label: 'Vehicles List', href: '/reporting/vehicle-list' }
        ]}
      />
      <CommonHeader heading="Vehicles List" onPageSizeChange={handlePageSizeChange} onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} onImport={handleImportCSV} userRole='' buttonLabel="" buttonLink="" />

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
              <th className="w-[80px]" onClick={() => handleSort('id')}>
                Job ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[80px]" onClick={() => handleSort('jobName')}>
                Job Title
                {sortBy === 'jobName' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[120px]">
                Customer Name 
              </th>
              <th className="w-[160px]">Assigned Technician</th>

              <th className="w-[120px]" >
                VIN
              </th>
              <th className="w-[60px]" >
                Make
              </th>
              <th className="w-[60px]">Model</th>
              <th className="w-[60px]">Year</th> 
              <th className="w-[100px]">Start Date</th>
              <th className="w-[100px]">End Date</th> 
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : activeJob.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-10">
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

export default VehicleTable;
