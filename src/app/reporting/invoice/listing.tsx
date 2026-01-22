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
import Image from 'next/image';
import Eye from '../../../../public/eye.svg'
import { FormControl, FormLabel, TextField } from '@mui/material';
import InvoiceGenerator from '@/app/component/invoice-genrated';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';  // ✅ Get the base URL here

interface VehcileInfo {
  id: string;
  jobName: string;
  name: string;
  email: string;
  pdr: string;
  deletedStatus?: boolean;
  generatedInvoiceDate: string;
  Role: { name: string };
}
const JobTable: React.FC = () => {
  const [activeJob, setActiveJob] = useState<any[]>([]);
  const [dentTechTotalAmount, setDentTechTotalAmount] = useState<any[]>([]);
  const [rRTotalAmount, setRRTotalAmount] = useState<any[]>([]);
  const [totalEstimateAmount, setTotalEstimateAmount] = useState<any[]>([]);
  const [totalJobAmount, setTotalJobAmount] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('id'); // Manage sorting column state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Sorting direction state
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isCollapsed } = useSidebar();
  const [pageSize, setPageSize] = useState(10);
  const [totalJobs, setTotalJobs] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [roleType, setRoleType] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState<string>('');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('');
  const [pdrValues, setPdrValues] = useState<Record<string, string>>({});
  const [customerFilter, setCustomerFilter] = useState<string>('');  // Initialize the customerFilter state
  const [customerJobs, setCustomerJobs] = useState<any[]>([]);  // Add this state to store customer-specific jobs
  const [originalJobs, setOriginalJobs] = useState<any[]>([]);
  const [invoiceDates, setInvoiceDates] = useState<Record<string, string>>({});
  const [pdrErrors, setPdrErrors] = useState<{ [vehicleId: string]: string }>({});
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);


  const handlePdrChange = (jobId: string, value: string) => {
    setPdrValues(prev => ({
      ...prev,
      [jobId]: value
    }));
    if (value && !isNaN(Number(value))) {
      setPdrErrors(prev => ({ ...prev, [jobId]: '' }));
    }
  };
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
          ? `${apiUrl}/searchVehicalInfo?searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
          : `${apiUrl}/searchVehicalInfo?userId=${userId}&searchQuery=${encodeURIComponent(query)}&roleType=${encodeURIComponent(roleType)}`
        : roleType === 'superadmin' || roleType === 'manager'
          ? `${apiUrl}/fetchInVoiceVehicleInfo?page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`
          : `${apiUrl}/fetchInVoiceVehicleInfo?userId=${userId}&page=${page}&roleType=${encodeURIComponent(roleType)}&limit=${limit}`;

      console.log('Fetching API with endpoint:', endpoint);  // Debugging endpoint

      const response = await fetch(endpoint, { method: 'GET', headers });
      const data = await response.json();

      console.log('API response data:', data);  // Debugging API response

      if (response.ok) {
        const fetchedTechnicians: VehcileInfo[] = query.trim()
          ? data.data.vehicles || []
          : data.response.vehicles || [];

        const initialPdrValues: Record<string, string> = {};
        const initialInvoiceDates: Record<string, string> = {};
        fetchedTechnicians.forEach(job => {
          if (job.pdr) { // Only set PDR value if it exists
            initialPdrValues[job.id] = job.pdr.toString();
          }
          if (job.generatedInvoiceDate) {
            const date = new Date(job.generatedInvoiceDate);
            initialInvoiceDates[job.id] = date.toISOString().split('T')[0];
          }
        });
        setPdrValues(initialPdrValues);
        setInvoiceDates(initialInvoiceDates);

        // When a customer is selected, show customer-specific jobs along with existing jobs
        const updatedJobs = customerFilter ? [...fetchedTechnicians, ...customerJobs] : fetchedTechnicians;
        setOriginalJobs(updatedJobs);  // Store the original jobs

        // Optionally, filter and update activeJob after fetching
        const filteredJobs = updatedJobs.filter((job: any) => {
          return selectedStatus === 'completed'
            ? job.vehicleStatus === true
            : selectedStatus === 'inProgress'
              ? job.vehicleStatus === false
              : true;
        });

        setActiveJob(updatedJobs);
        setDentTechTotalAmount(data.response?.totalDantTechCost ?? data.data.totalDantTechCost ?? '0');
        setRRTotalAmount(data.response?.totalRrCost ?? data.data.totalRrCost ?? '0');
        setTotalEstimateAmount(data.response?.totalEstimateCost ?? data.data.totalEstimateCost ?? '0');
        setTotalJobAmount(data.response?.totalJobEstimateCost ?? data.data.totalJobEstimateCost ?? '0');
        setTotalPages(data.response?.totalPages || 1);
        setTotalJobs(data.response?.totalVehicles ?? data.data.totalVehicles ?? '0');

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
      filename: 'Invoice',
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'Invoice',
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
        jobDescription: jobData.jobDescription.join(''),
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
      } catch (error) {
        console.error("Error fetching filtered jobs:", error);
      } finally {
        setLoading(false);
      }
    }
  };


  const handleNewJobClick = async (jobId: string) => {
    setSelectedJobFilter(jobId); // Store the selected job filter
    setSelectedCustomer(''); // Clear customer filter when job is selected
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');
    const roleType = localStorage.getItem('types') || "";
    console.log(jobId, 'jobId');

    if (!jobId) {
      // If no job selected, reset to original fetch
      fetchJobs(currentPage, searchTerm, pageSize);
      return;
    }

    // Prepare the payload dynamically
    const payload = {
      roleType: roleType,  // Dynamic roleType from localStorage
      jobId: jobId,        // Dynamic jobId passed from the selected job 
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
        setOriginalJobs(data.vehicles.updatedVehicles);  // Store the original jobs

        // Optionally, filter and update activeJob after fetching
        const filteredJobs = data.vehicles.updatedVehicles.filter((job: any) => {
          return selectedStatus === 'completed'
            ? job.vehicleStatus === true
            : selectedStatus === 'inProgress'
              ? job.vehicleStatus === false
              : true;
        });
        setDentTechTotalAmount(data.vehicles?.totalDantTechCost);
        setRRTotalAmount(data.vehicles?.totalRrCost);
        setTotalEstimateAmount(data.vehicles?.totalEstimateCost);
        setTotalJobAmount(data.vehicles?.totalJobEstimateCost || '0');

        setActiveJob(filteredJobs);
        // You can update state or perform further operations based on the response
      } else {
        console.error("Failed to apply filter:", data.error || 'Unknown error');
      }
    } catch (error) {
      console.error("Error during API request:", error);
    }
  };

  const fetchCustomerData = async (customerId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/customerJobNamefetch?customerId=${encodeURIComponent(customerId)}`,
        {
          method: 'GET',
          headers,
        }
      );

      const data = await response.json();

      if (response.ok) {
        return {
          jobs: data.jobs || [],
          vehicles: data.jobs?.flatMap((job: any) => job.vehicles) || [],
          allTechnicians: data.jobs?.flatMap((job: any) => job.technicians) || []
        };
      } else {
        toast.error(data.error || 'Error fetching customer data');
        return { jobs: [], vehicles: [], allTechnicians: [] };
      }
    } catch (error) {
      toast.error('An error occurred while fetching customer data');
      return { jobs: [], vehicles: [], allTechnicians: [] };
    }
  };

  const handleNewCustomerClick = async (customerId: string) => {
    setSelectedCustomer(customerId);
    setSelectedJobFilter(''); // Clear job filter when customer is selected

    if (!customerId) {
      // If no customer selected, reset to original jobs
      fetchJobs(currentPage, searchTerm, pageSize);
      return;
    }

    try {
      setLoading(true);

      const { jobs, vehicles } = await fetchCustomerData(customerId);
      console.log(jobs, 'sssssss');

      // Store the customer-specific vehicles
      setCustomerJobs(vehicles);

      // Show both jobs and vehicles for the customer
      setActiveJob(vehicles);

    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast.error("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  }


  const handleStatusChange = (status: string) => {
    console.log(status, 'status');
    setSelectedStatus(status);
  };

  const handleClearFilters = () => {
    setSelectedJobFilter('');
    setSelectedCustomer('');
    setSelectedStatus('');
    setSearchTerm('');
    setCurrentPage(1);
    fetchJobs(1, '', pageSize);
  };

  useEffect(() => {
    if (selectedStatus === '') {
      // When no status is selected, show all original jobs
      setActiveJob(originalJobs);  // Set active jobs to the original jobs
    } else {
      // When a status is selected, filter jobs from originalJobs
      const filtered = originalJobs.filter(job => {
        console.log(job.vehicleStatus, 'job vehicleStatus');

        if (selectedStatus === 'completed') {
          return job.vehicleStatus === true;   // Show completed jobs
        } else if (selectedStatus === 'inProgress') {
          return job.vehicleStatus === false;   // Show in-progress jobs
        }
        return true;  // For "All Status", no filtering
      });

      if (filtered.length === 0) {
        console.log('No jobs match the filter criteria');
      }

      setActiveJob(filtered);  // Update the active job list with filtered data
    }
  }, [selectedStatus, originalJobs]);


  const handleSavePdr = async (vehicleId: string, pdrValue: string) => {
    const token = localStorage.getItem('token');
    const roleType = localStorage.getItem('types') || "";
    const userId = localStorage.getItem('userID');
    try {
      const dateToUse = invoiceDates[vehicleId] || new Date().toISOString().split('T')[0];

      // Prepare payload according to your API requirements
      const payload = [{
        vehicleId: vehicleId,
        pdr: pdrValue ? Number(pdrValue) : null,
        generatedInvoiceDate: dateToUse,
        roleType: roleType,
        userId: userId,
      }];

      // Make API call
      const response = await fetch(`${apiUrl}/updateVehiclePdr`, {
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
      toast.success("vehicles updated successfully!");
      
      // Re-apply filters instead of resetting
      if (selectedJobFilter) {
        handleNewJobClick(selectedJobFilter);
      } else if (selectedCustomer) {
        handleNewCustomerClick(selectedCustomer);
      } else {
        fetchJobs(currentPage, searchTerm, pageSize);
      }
    } catch (error) {
      console.error('Error updating PDR:', error);
    }
  };

  const handleDateAutoSave = async (vehicleId: string, dateValue: string) => {
    const token = localStorage.getItem('token');
    const roleType = localStorage.getItem('types') || "";
    const userId = localStorage.getItem('userID');
    
    // Update state first
    setInvoiceDates(prev => ({
      ...prev,
      [vehicleId]: dateValue
    }));

    try {
      // Prepare payload
      const payload = [{
        vehicleId: vehicleId,
        pdr: pdrValues[vehicleId] ? Number(pdrValues[vehicleId]) : null,
        generatedInvoiceDate: dateValue,
        roleType: roleType,
        userId: userId,
      }];

      // Make API call
      const response = await fetch(`${apiUrl}/updateVehiclePdr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update date');
      }

      toast.success("Date updated successfully!");
      
      // Re-apply filters instead of resetting
      if (selectedJobFilter) {
        handleNewJobClick(selectedJobFilter);
      } else if (selectedCustomer) {
        handleNewCustomerClick(selectedCustomer);
      } else {
        fetchJobs(currentPage, searchTerm, pageSize);
      }
    } catch (error) {
      console.error('Error updating date:', error);
      toast.error('Failed to update date');
    }
  };


  const handleGenerateInvoice = async (isPrint = false) => {
    const token = localStorage.getItem('token');
    const roleType = localStorage.getItem('types') || '';
    const userId = localStorage.getItem('userID');
    // Get selected jobs
    const selectedJobs = activeJob.filter(job => selectedIds.includes(job.id));

    if (selectedJobs.length === 0) {
      toast.error('Please select at least one vehicle to generate invoice');
      return;
    }
    if (roleType !== 'single-technician') {
      const vehiclesWithoutPdr = selectedJobs.filter(job =>
        !job.pdr || isNaN(Number(job.pdr)));

      if (vehiclesWithoutPdr.length > 0) {
        toast.error('Please enter PDR values for all selected vehicles before generating invoice');
        return;
      }
    }

    try {
      if (isPrint === false) {
        setIsGeneratingInvoice(true);
      }
      // Prepare payload
      const payload = {
        vehicles: selectedJobs.map(job => ({
          vehicleId: job.id,
          jobId: job.jobId || job.id, // Use jobId if available, fallback to id
          customerId: job.customer?.id,
          roleType: roleType,
          userId: userId,
          generatedInvoiceStatus: true,
          ...(isPrint && { print: 'print' }),
          ...(isPrint && { generatedInvoiceStatus: false })
        })),

      };

      // Make API call
      const response = await axios.post(`${apiUrl}/createInvoice`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data) {
        toast.success('Invoice generated successfully!');
        const pdfLink = response.data.invoice.invoiceUrl;
        if (isPrint) {
          window.open(pdfLink, '_blank');
        } else {
          const subject = 'Your Invoice is Ready';
          const body = `Dear Customer,\n\nPlease find your invoice below:\n\n${pdfLink}\n\nBest regards.`;
          window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }
        fetchJobs(currentPage, searchTerm, pageSize);
      } else {
        toast.error(response.data.message || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('An error occurred while generating invoice');
    } finally {
      setIsGeneratingInvoice(false); // Stop loading regardless of success/error
    }
  };


  const handleFillAllPdr = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one vehicle to fill PDR");
      return;
    }

    // Get the first non-empty PDR value from selected vehicles
    let pdrValueToFill = '';
    for (const id of selectedIds) {
      if (pdrValues[id] && pdrValues[id].trim() !== '') {
        pdrValueToFill = pdrValues[id];
        break;
      }
    }

    if (!pdrValueToFill) {
      toast.error("Please enter a PDR value for at least one selected vehicle");
      return;
    }

    // Validate the PDR value
    if (isNaN(Number(pdrValueToFill))) {
      toast.error("PDR value must be a number");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const roleType = localStorage.getItem('types') || "";
      const userId = localStorage.getItem('userID');

      // Prepare payload for all selected vehicles
      const payload = selectedIds.map(vehicleId => ({
        vehicleId: vehicleId,
        pdr: Number(pdrValueToFill),
        generatedInvoiceDate: invoiceDates[vehicleId] || new Date().toISOString().split('T')[0],
        roleType: roleType,
        userId: userId,
      }));

      // Make API call to update all selected vehicles
      const response = await fetch(`${apiUrl}/updateVehiclePdr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update PDR for selected vehicles');
      }

      const data = await response.json();
      toast.success("PDR updated successfully for all selected vehicles!");

      // Update local state for all selected vehicles
      const updatedPdrValues = { ...pdrValues };
      selectedIds.forEach(id => {
        updatedPdrValues[id] = pdrValueToFill;
      });
      setPdrValues(updatedPdrValues);

      // Refresh the data
      fetchJobs(currentPage, searchTerm, pageSize);
    } catch (error) {
      console.error('Error updating PDR for selected vehicles:', error);
      toast.error("Failed to update PDR for selected vehicles");
    }
  };

  const renderRow = (job: any) => {
    const isChecked = selectedIds.includes(job.id);
    const roleType = localStorage.getItem('types') || "";


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
        <td><Link href={`/jobs/view?jobId=${job?.job?.id}&ActiveWorkOrder`} className='hover:underline'>{job?.jobName}</Link></td>
        <td><Link href={`/vehicle/view?vehicleId=${job.id}`} className='hover:underline'> {job?.vin}</Link></td>

        {/* <td> <Link href={`/vehicle/view?vehicleId=${job.id}`} className='hover:underline'> {job?.id}</Link> </td>

        <td>{job?.jobName}</td> */}
        <td>  <Link href={`/client/view?customerId=${job?.customer?.id}`} className='hover:underline'>{job?.customer?.fullName} </Link></td>
        {/* <td><a className="hover:underline" href={`tel:${job?.customer?.phoneNumber}`}>{job?.customer?.phoneNumber}</a></td> */}
        {roleType !== 'single-technician' && (
          <td>
            {job?.assignedTechnicians
              ?.filter((tech: any) => tech.techType === 'technician')
              ?.map((tech: any) => (
                <div key={tech.id} className="capitalize">
                  <Link href={`/technicians/view?technicianId=${tech?.id}`} className='hover:underline'>{tech.firstName} {tech.lastName}</Link>
                </div>
              ))}
          </td>
        )}
        {roleType !== 'single-technician' && (
          <td>
            {job?.assignedTechnicians?.length > 0 ? (
              job?.assignedTechnicians?.map((tech: any) => (
                <div key={tech.id} className="capitalize">
                  {tech.VehicleTechnician?.techFlatRate && tech.VehicleTechnician?.techFlatRate !== '' 
                    ? `$${tech.VehicleTechnician?.techFlatRate}`
                    : <span className="text-gray-400 text-sm"></span>
                  }
                </div>
              ))
            ) : (
              <span className="text-gray-400 text-sm"></span>
            )}
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
            {job?.assignedTechnicians?.length > 0 ? (
              job?.assignedTechnicians?.map((tech: any) => (
                <div key={tech.id} className="capitalize">
                  {tech.VehicleTechnician?.rRate && tech.VehicleTechnician?.rRate !== '' 
                    ? `$${tech.VehicleTechnician?.rRate}`
                    : <span className="text-gray-400 text-sm"></span>
                  }
                </div>
              ))
            ) : (
              <span className="text-gray-400 text-sm"></span>
            )}
          </td>
        )}
        {roleType === 'single-technician' && (
          <td>
            {job?.labourCost ? `$${job.labourCost}` : 'N/A'}
          </td>
        )}
        {roleType !== 'single-technician' && (
          <td>
            {job?.totalCombined && job?.totalCombined !== '' 
              ? `$${job?.totalCombined}`
              : <span className="text-gray-400 text-sm"></span>
            }
          </td>
        )}
        <td>{job.startDate ? new Date(job.startDate).toLocaleDateString() : ''}</td>
        <td>{job.endDate ? new Date(job.endDate).toLocaleDateString() : ''}</td>
        <td>
          <TextField
              label=""
              variant="outlined"
              fullWidth
              color="warning"
              size="small"
              type='date'
              value={invoiceDates[job.id] || ''}
              onChange={(e) => handleDateAutoSave(job.id, e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
        </td>
        <td>
          {canCreate && (

            <span
              className={`badge ${job.generatedInvoiceStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
            >
              {job.generatedInvoiceStatus ? 'Generated' : 'Pending'}
            </span>
          )}

        </td>
        <td>
          {canCreate && (

            <span
              className={`badge ${job.vehicleStatus ? 'badge-success bg-[#E6F9DD] text-[#1A932E] p-2 pl-4 pr-4 rounded shadow' : 'badge-error bg-[#FFE4E1] text-[#FF0000] p-2 pl-4 pr-4 rounded shadow'}`}
            >
              {job.vehicleStatus ? 'Completed' : 'In Progress'}
            </span>
          )}

        </td>
        {roleType !== 'single-technician' && (

          <td>
            <div className="flex gap-2 items-center">
              <FormControl fullWidth size="small">
                <TextField
                  label="PDR"
                  variant="outlined"
                  fullWidth
                  color="warning"
                  size="small"
                  type='number'
                  value={pdrValues[job.id] || ''}
                  onChange={(e) => handlePdrChange(job.id, e.target.value)}
                />
              </FormControl>
              <button type='button' className="primary-bg p-2 rounded" onClick={() => handleSavePdr(job.id, pdrValues[job.id])}>Save</button>
            </div>
          </td>
        )}
        <td className='text-left'>
          <div className="flex gap-3 items-center">
            <Link href={`/vehicle/view?vehicleId=${job.id}`} >
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
          { label: 'Invoice', href: '/reporting/invoice' }
        ]}
      />
      <div className="invoice_tab_content flex justify-end gap-3 mb-3 items-center">
        <button
          onClick={() => handleGenerateInvoice(false)}
          disabled={isGeneratingInvoice}
          className='primary-bg text-sm border border-black-500 p-2 pl-5 pr-5 bg-black text-white rounded flex items-center gap-2 justify-center'
        >
          {isGeneratingInvoice ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Invoice'
          )}
        </button>

        <button onClick={() => handleGenerateInvoice(true)} className='primary-bg text-sm border border-black-500 p-2 pl-5 pr-5 bg-black text-white rounded flex items-center gap-2'>Print</button>

        {/* <InvoiceGenerator selectedJobs={activeJob.filter((job) => selectedIds.includes(job.id))} /> */}
        <button onClick={handleFillAllPdr} className='primary-bg text-sm border border-black-500 p-2 pl-5 pr-5 bg-black text-white rounded flex items-center gap-2'>Fill All PDR</button>
      </div>
      <CommonHeader heading="Invoice" onSearch={(term) => setSearchTerm(term)} onExport={downloadCSV} userRole='Activejobs' buttonLabel="" buttonLink="" showDatePicker={true}
        onDateChange={handleDateChange} onNewJobClick={handleNewJobClick} onCustomerChange={handleNewCustomerClick} onStatusChange={handleStatusChange} fetchCustomerData={fetchCustomerData} showClearFilters={true} onClearFilters={handleClearFilters} />
     
      <div className="flex  mb-2 shadow-lg p-2flex gap-0 sm:gap-4 md:gap-8 lg:gap-[3rem] mb-2 shadow-lg p-2">
        <div className='total_work title_sdev'><b>Total Work Order </b>: ${totalJobs}</div>
        {roleType !== 'single-technician title_sdev' && (
          <div className='total_dent_teach title_sdev'><b>Total Dent Tech  </b>: ${dentTechTotalAmount}</div>
        )}
        {roleType !== 'single-technician' && (
          <div className='total_ri_content title_sdev'><b>Total RR/I/R  </b>: ${rRTotalAmount}</div>
        )}
        <div><b>Total Job Estimate </b>: ${totalJobAmount}</div>
        {roleType !== 'single-technician' && (
          <div className='total_expense title_sdev'><b>Total Expense </b>: ${totalEstimateAmount}</div>
        )}

      </div>
      <div className="overflow-auto rounded-md">
        <table className="table w-full table-fixed sdev_table">
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
              {/* <th className="w-[80px]" onClick={() => handleSort('id')}>
                Job ID
                {sortBy === 'id' && (
                  <span className={`ml-2 ${sortDirection === 'asc' ? 'text-white-500' : 'text-white'}`}>
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
              <th className="w-[100px]"   >Job Title
              </th> */}
              <th className="w-[100px]">Job Title
              </th>
              <th className="w-[160px]">VIN</th>

              <th className="w-[120px]"  >
                Customer Name
              </th>
              {/* <th className="w-[120px]">
                Customer Number
              </th> */}
              {roleType !== 'single-technician' && (
                <th className="w-[150px]" >
                  Assigned Dent Tech
                </th>
              )}
              {roleType !== 'single-technician' && (
                <th className="w-[100px]">Dent Tech Rate</th>
              )}
              {roleType !== 'single-technician' && (
                <th className="w-[130px]" >
                  Assigned RR/I/R
                </th>
              )}

              {roleType !== 'single-technician' && (
                <th className="w-[80px]">RR/I/R</th>
              )}
              {roleType !== 'single-technician' && (
                <th className="w-[80px]">Total Expense</th>
              )}
              {roleType === 'single-technician' && (
                <th className="w-[80px]">Labour Cost</th>
              )}
              <th className="w-[80px]">Start Date</th>
              <th className="w-[80px]">End Date</th>
              <th className="w-[200px]">Generated Invoice Date</th>
              <th className="w-[120px]">Invoice Status</th>
              <th className="w-[130px]">W.O Status</th>
              {roleType !== 'single-technician' && (
                <th className="w-[160px]">PDR</th>
              )}
              <th className="w-[80px]">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={roleType !== 'single-technician' ? 15 : 9} className="text-center py-10">
                  <Loader />
                </td>
              </tr>
            ) : activeJob.length === 0 ? (
              <tr>
                <td colSpan={roleType !== 'single-technician' ? 15 : 9} className="text-center py-10">
                  <Empty />
                </td>
              </tr>
            ) : (
              activeJob.map((job) => renderRow(job))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-3 items-center">
        {activeJob.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        )}
      </div>
    </div>
  );
};

export default JobTable;
