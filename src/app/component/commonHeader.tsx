// components/CommonHeader.tsx
import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import TextField from '@mui/material/TextField';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { addDays } from 'date-fns';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // core styles
import 'react-date-range/dist/theme/default.css'; // theme styles
import toast from 'react-hot-toast';

interface CommonHeaderProps {
  heading: string;
  // title: string;
  onSearch: (searchTerm: string) => void;
  buttonLabel: string;
  buttonLink: string;
  userRole: string;
  onExport?: () => void;
  onPageSizeChange?: (size: number) => void;
  onImport?: (file: File) => void;
  onCompletedClick?: () => void;
  onInProgressClick?: () => void;
  onCompletedJobClick?: () => void;
  onInProgressJobClick?: () => void;
  onAllJobsClick?: () => void;
  onColumnSelect?: (column: string[]) => void;
  additionalComponents?: React.ReactNode;
  showDatePicker?: boolean;
  onDateChange?: (newValue: [any, any]) => void;
  onNewJobClick?: (jobId: string, roleType: string) => void;
  onNewTechClick?: (jobId: string, roleType: string) => void;
  roleType?: string;
  onCustomerChange?: (customer: string, roleType: string) => void;
  fetchCustomerData?: (customerId: string) => Promise<any>;
  onStatusChange?: (status: string) => void;
  onInvoiceStatueChange?: (status: string) => void;
  onClearFilters?: () => void;
  showClearFilters?: boolean;
}



const CommonHeader: React.FC<CommonHeaderProps> = ({ heading, onSearch, buttonLabel, buttonLink, userRole, additionalComponents, onColumnSelect, onExport, onImport, onPageSizeChange, onCompletedClick, onInProgressClick, onCompletedJobClick, onInProgressJobClick, onAllJobsClick, showDatePicker, onDateChange, onNewJobClick, onNewTechClick, roleType, onCustomerChange, onStatusChange, onInvoiceStatueChange, onClearFilters, showClearFilters = false, }) => {

  const [permissions, setPermissions] = useState<any[]>([]);
  const [showDatePickers, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePickers) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePickers]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [tech, setTech] = useState<any[]>([]);
  const [jobsFilter, setJobsFilter] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [techFilter, settechFilter] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [effectiveRoleType, setEffectiveRoleType] = useState(roleType || '');
  const [customer, setCustomer] = useState<any[]>([]);
  const [customerJobs, setCustomerJobs] = useState<any[]>([]);
  const [workOrderStatus, setWorkOrderStatus] = useState<string>("");
  const [invoiceStatus, setInvoiceStatus] = useState<string>("");
  const [searchValue, setSearchValue] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [isCustomerSearching, setIsCustomerSearching] = useState<boolean>(false);

  const [dates, setDates] = useState<{ startDate: Date | null, endDate: Date | null }>({
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    // This code only runs on the client side
    if (typeof window !== 'undefined') {
      const storedRoleType = localStorage.getItem('types');
      if (storedRoleType && !roleType) {
        setEffectiveRoleType(storedRoleType);
      }
    }
  }, [roleType]);

  const handleDateChange = (ranges: any) => {
    setDates({
      startDate: ranges.selection.startDate,
      endDate: ranges.selection.endDate,
    });
    if (onDateChange) {
      onDateChange([ranges.selection.startDate, ranges.selection.endDate]);
    }
  };


  const [activeFilter, setActiveFilter] = useState<"" | "completed" | "inProgress" | "all">("all");
  const [selectedColumn, setSelectedColumn] = useState<string[]>([]); // Default is an array


  useEffect(() => {
    const storedPermissions = localStorage.getItem("permissions");

    if (storedPermissions) {
      try {
        const parsedPermissions = JSON.parse(storedPermissions);
        setPermissions(Array.isArray(parsedPermissions) ? parsedPermissions : []);
        // console.log("✅ Loaded Permissions:ssss", parsedPermissions);
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
      (perm) => perm.permissionName === userRole && perm.action === action && perm.isActive
    );
  };
  const canCreate = hasPermission("create");

  const handleCompletedClick = () => {
    setActiveFilter("completed");
    if (onCompletedClick) onCompletedClick();
  };

  const handleInProgressClick = () => {
    setActiveFilter("inProgress");
    if (onInProgressClick) onInProgressClick();
  };

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as "all" | "completed" | "inProgress";
    setActiveFilter(value);

    if (value === "completed" && onCompletedJobClick) {
      onCompletedJobClick();
    } else if (value === "inProgress" && onInProgressJobClick) {
      onInProgressJobClick();
    } else if (value === "all" && onAllJobsClick) {
      onAllJobsClick();
    }
  };




  const handleDateFilterClick = () => {
    setShowDatePicker(!showDatePickers);
  };


  const handleApplyFilter = () => {
    if (onDateChange) {
      onDateChange([dates.startDate, dates.endDate]);
    }
    setShowDatePicker(false); // Close the date picker after applying filter
  };

  const fetchJobs = async (page = 1, passedRoleType: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userID');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    // Use passedRoleType directly, no need to fallback to localStorage
    const effectiveRoleType = passedRoleType || '';  // If passedRoleType is empty, fallback to an empty string or handle as needed
    console.log("Effective Role Type:", effectiveRoleType); // Log to check if it's correct

    let url;
    if (effectiveRoleType === 'superadmin' || effectiveRoleType === 'manager') {
      url = `/api/jobListing?page=${page}&roleType=${encodeURIComponent(effectiveRoleType)}`;
    } else if (effectiveRoleType === 'single-technician') {
      url = `/api/jobListing?page=${page}&roleType=single-technician`;
    } else {
      url = `/api/jobListing?userId=${userId}&page=${page}&roleType=single-technician`;
    }

    try {
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (response.ok) {
        const fetchedJobs = data.jobs?.jobs || [];
        setJobs(prev => {
          const existingIds = new Set(prev.map(job => job.id));
          const newJobs = fetchedJobs.filter((job: any) => !existingIds.has(job.id));
          return [...prev, ...newJobs];
        });
        setHasMore(fetchedJobs.length > 0);
      } else {
        console.error('Error fetching job data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
    }
  };


  const fetchCustomer = async (page = 1, passedRoleType: string) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userID');
      const roleType = localStorage.getItem('types');

      const response = await fetch(`/api/fetchJobCustomerTechnician?endpoint=fetchCustomer&userId=${userId}&roleType=${roleType}&page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setCustomer((prevCustomers) => {
        const newCustomers = data.customers?.customers || [];
        const uniqueCustomers = [...prevCustomers];

        newCustomers.forEach((customer: any) => {
          if (!uniqueCustomers.some(c => c.id === customer.id)) {
            uniqueCustomers.push(customer);
          }
        });

        return uniqueCustomers;
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
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
        // Return both jobs and all technicians (we'll filter later when job is selected)
        return {
          jobs: data.jobs || [],
          allTechnicians: data.jobs?.flatMap((job: any) => job.technicians) || []
        };
      } else {
        toast.error(data.error || 'Error fetching customer data');
        return { jobs: [], allTechnicians: [] };
      }
    } catch (error) {
      toast.error('An error occurred while fetching customer data');
      return { jobs: [], allTechnicians: [] };
    }
  };

  useEffect(() => {
    fetchCustomer(page, effectiveRoleType);
  }, [page, effectiveRoleType]);

  useEffect(() => {
    fetchJobs(page, effectiveRoleType);
  }, [page, effectiveRoleType]);



  const fetchTech = async (page = 1, passedRoleType: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userID');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    // Use passedRoleType directly, no need to fallback to localStorage
    const effectiveRoleType = passedRoleType || '';  // If passedRoleType is empty, fallback to an empty string or handle as needed
    console.log("Effective Role Type:", effectiveRoleType); // Log to check if it's correct

    let url;
    if (effectiveRoleType === 'superadmin') {
      url = `${apiUrl}/fetchIndividualTechnician?page=${page}&roleType=${encodeURIComponent(effectiveRoleType)}`;
    } else if (effectiveRoleType === 'single-technician') {
      url = `${apiUrl}/fetchIndividualTechnician?page=${page}&roleType=single-technician`;
    } else {
      url = `${apiUrl}/fetchIndividualTechnician?userId=${userId}&page=${page}`;
    }

    try {
      const response = await fetch(url, { headers });
      const data = await response.json();

      if (response.ok) {
        const fetchedTech = data.technician?.technicians || [];
        setTech((prev) => [...prev, ...fetchedTech]);
        setHasMore(fetchedTech.length > 0);
      } else {
        console.error('Error fetching job data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
    }
  };





  useEffect(() => {
    fetchTech(page, effectiveRoleType);
  }, [page, effectiveRoleType]);


  const handleScroll = (e: any) => {
    const bottom = e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight;
    if (bottom && hasMore && !isCustomerSearching) {
      setPage(prev => prev + 1);
    }
  };

  const searchCustomers = async (searchValue: string) => {
    if (!searchValue.trim()) {
      setIsCustomerSearching(false);
      setCustomer([]);
      setPage(1);
      fetchCustomer(1, effectiveRoleType);
      return;
    }

    try {
      setIsCustomerSearching(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userID');
      const roleType = localStorage.getItem('types');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const response = await fetch(`${apiUrl}/searchCustomers?userId=${userId}&searchQuery=${encodeURIComponent(searchValue)}&roleType=${roleType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const data = await response.json();
      if (data.status && data.customers) {
        setCustomer(data.customers);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    searchCustomers(value);
  };

  const handleTechScroll = (e: any) => {
    const bottom = e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight;
    if (bottom && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleTechFilterChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value; // Selected job ID
    console.log(value, 'value');

    settechFilter(value);  // Update the job filter state
    setSelectedTechId(value); // Store the selected job ID for dynamic filtering

    // Explicitly pass jobId and 'single-technician' as the roleType
    if (onNewTechClick) {
      onNewTechClick(value, 'single-technician');  // Pass both jobId and roleType
    }
  };

  const handleJobFilterChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value; // Selected job ID
    setJobsFilter(value);  // Update the job filter state
    setSelectedJobId(value); // Store the selected job ID for dynamic filtering

    // Explicitly pass jobId and 'single-technician' as the roleType
    if (onNewJobClick) {
      onNewJobClick(value, 'single-technician');  // Pass both jobId and roleType
    }
  };

  const handleCustomerFilterChange = async (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setCustomerFilter(value);
    setSelectedCustomerId(value);

    if (value) {
      const { jobs } = await fetchCustomerData(value);
      setCustomerJobs(jobs);
    } else {
      setCustomerJobs([]); // Reset customer jobs if no customer is selected
    }

    // Trigger the customer change event
    if (onCustomerChange) {
      onCustomerChange(value, 'single-technician'); // Pass the customer ID and role type
    }
  };

  const handleClearFilters = async () => { 
    setJobsFilter("");
    setCustomerFilter("");
    settechFilter("");
    setSelectedJobId("");
    setSelectedCustomerId("");
    setSelectedTechId("");
    setSearchValue("");    
    onSearch?.("");
    setWorkOrderStatus("");
    setInvoiceStatus("");

    setDates({ startDate: null, endDate: null });
    setShowDatePicker(false);

    setActiveFilter("all"); 
    setCustomerJobs([]); 
    onSearch?.("");  
    onDateChange?.([null, null]);  
    onAllJobsClick?.();  
    onNewJobClick?.("", "single-technician");  
    onNewTechClick?.("", "single-technician");  
    onCustomerChange?.("", "single-technician");  
    onStatusChange?.("");  
    onInvoiceStatueChange?.("");   
    onClearFilters?.();
  };




  return (
    <div className="px-1 mb-4">
      <div className="flex flex-col sm:flex-row items-center justify-between w-full ">
        <div>
          <h1 className="text-lg leading-6 font-bold text-gray-900 mb-[2px] sm:mb-0">{heading}</h1>
          {/* <p className='text-sm'>{title}</p> */}
        </div>
        <div className='mobile_listing_item  flex items-center gap-4'>
          {onSearch && (

            <div className="flex w-[220px] relative search__input border border-gray-300 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" className="absolute right-3 top-1/2 -translate-y-1/2 z-[1] pointer-events-none text-gray-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchValue}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchValue(val);
                  onSearch(val);
                }}
                className="w-full p-[11px] pl-3 pr-9 text-sm border-0 rounded-lg bg-transparent outline-none focus:ring-0"
              />
            </div>
          )}

          {onCustomerChange && (
            <select
              id="select-assignCustomer"
              name="assignCustomer"
              value={customerFilter}
              onChange={(e) => handleCustomerFilterChange({ target: { value: e.target.value } } as SelectChangeEvent<string>)}
              onFocus={() => {
                if (customer.length === 0) {
                  fetchCustomer(1, effectiveRoleType);
                }
              }}
              className="w-[150px] h-[44px] min-h-[44px] px-3 pr-8 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
            >
              <option value="">Select customer</option>
              {customer.length > 0 ? (
                customer.map((cust) => (
                  <option key={`${cust.id}-${cust.fullName}`} value={cust.id}>
                    {cust.fullName}
                  </option>
                ))
              ) : (
                <option value="" disabled>No customer found</option>
              )}
            </select>
          )}



          {onNewJobClick && (
            <select
              id="job-dropdown"
              value={jobsFilter}
              onChange={(e) => handleJobFilterChange({ target: { value: e.target.value } } as SelectChangeEvent<string>)}
              className="w-[130px] h-[44px] min-h-[44px] px-3 pr-8 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
            >
              <option value="">All Jobs</option>
              {customerFilter ? (
                customerJobs.length > 0 ? (
                  customerJobs.map((job) => (
                    <option key={`${job.id}-${job.jobName}`} value={job.id}>
                      {job.jobName}
                    </option>
                  ))
                ) : (
                  <option value="">No jobs for this customer</option>
                )
              ) : (
                jobs.length > 0 ? (
                  jobs.map((job) => (
                    <option key={`${job.id}-${job.jobName}`} value={job.id}>
                      {job.jobName}
                    </option>
                  ))
                ) : (
                  <option value="">No jobs available</option>
                )
              )}
            </select>
          )}
          {onStatusChange && (
            <select
              id="status-dropdown"
              defaultValue=""
              onChange={(e) => onStatusChange?.(e.target.value)}
              className="w-[140px] h-[44px] min-h-[44px] px-3 pr-8 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="inProgress">In Progress</option>
            </select>
          )}
          {onInvoiceStatueChange && (
            <select
              id="invoiceStatus-dropdown"
              defaultValue=""
              onChange={(e) => onInvoiceStatueChange?.(e.target.value)}
              className="w-[120px] h-[44px] min-h-[44px] px-3 pr-8 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
            >
              <option value="">Invoice Status</option>
              <option value="paid">Paid</option>
              <option value="unPaid">Unpaid</option>
            </select>
          )}
          {onNewTechClick && (
            <select
              id="tech-dropdown"
              value={techFilter}
              onChange={(e) => handleTechFilterChange({ target: { value: e.target.value } } as SelectChangeEvent<string>)}
              className="w-[180px] h-[44px] min-h-[44px] px-3 pr-8 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
            >
              <option value="">Technician</option>
              {tech?.length > 0 ? (
                tech?.map((t) => (
                  <option key={`tech-${t.id}-${t.firstName}-${t.lastName}`} value={t.id}>{t.firstName} {t.lastName}</option>
                ))
              ) : (
                <option value="">No Technician Available</option>
              )}
            </select>
          )}

          {additionalComponents && (
            <div className="flex items-center gap-4">
              {additionalComponents}
            </div>
          )}

            {showDatePicker && (
          <div className="relative" ref={datePickerRef}>
              <button
                className="p-3 bg-white text-[12px] rounded-lg w-[100px] border border-gray-300"
                onClick={handleDateFilterClick}
              >
                Date Filter
              </button>
            {showDatePickers && (
              <div className="absolute z-[99999] sdev_date_picker" style={{ top: '3rem', right: '0rem' }}>
                <DateRange
                  editableDateInputs={true}
                  onChange={handleDateChange}
                  moveRangeOnFirstSelection={false}
                  ranges={[{ startDate: dates.startDate || new Date(), endDate: dates.endDate || addDays(new Date(), 1), key: 'selection' }]}
                  rangeColors={["#383d71"]}
                  months={2}
                  direction="horizontal"
                  showDateDisplay={false}
                />
                <div className="text-right">
                  <button
                    className="bg-[#383d71] text-white p-2 text-sm rounded"
                    onClick={handleApplyFilter}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
            )}


          {showClearFilters && (
            selectedJobId || 
            selectedCustomerId || 
            selectedTechId || 
            dates.startDate || 
            dates.endDate || 
            searchValue || 
            workOrderStatus || 
            invoiceStatus
          ) && (
            <button
              type="button"
              className="text-xs border border-gray-300 p-3 pl-2 pr-2 bg-white rounded flex items-center gap-2 hover:text-white hover:bg-red-600"
              onClick={() => {
                handleClearFilters();
                onClearFilters?.();
              }}
            >
              Clear
            </button>
          )}

          {onPageSizeChange && ( 
            <select name="" id="" className='border border-gray-300 rounded-lg p-3 text-[12px]' onChange={(e) => onPageSizeChange?.(parseInt(e.target.value as string))}>
              <option value="">Show 10</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="40">40</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          )}
          {(onCompletedJobClick || onInProgressJobClick) && (
            <select
              id="job-status-select"
              value={activeFilter}
              onChange={(e) => handleFilterChange({ target: { value: e.target.value } } as SelectChangeEvent<string>)}
              className="w-[180px] h-[44px] min-h-[44px] px-3 pr-8 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
            >
              <option value="all">All Jobs</option>
              <option value="completed">Completed Jobs</option>
              <option value="inProgress">In Progress Jobs</option>
            </select>
          )}
          {onCompletedClick && (
            <button
              className={`text-xs border border-gray-300 p-3 pl-5 pr-5 rounded 
                ${activeFilter === "completed"
                  ? "bg-green-600 text-white"
                  : "bg-white hover:bg-green-600 hover:text-white"
                }`}
              onClick={handleCompletedClick}
            >
              Completed Jobs
            </button>
          )}

          {onInProgressClick && (
            <button
              className={`text-xs border border-gray-300 p-3 pl-4 pr-4 rounded 
                ${activeFilter === "inProgress"
                  ? "bg-yellow-500 text-white"
                  : "bg-white hover:bg-yellow-500 hover:text-white"
                }`}
              onClick={handleInProgressClick}
            >
              In Progress Jobs
            </button>
          )}
          {onImport && (

            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180)">
                <path d="M1 7v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" />
                <polyline points="3 4 5 6 7 4" />
                <line x1="5" y1="6" x2="5" y2="1" />
              </svg>



              Import
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onImport?.(e.target.files[0]);
                    e.target.value = ''; // reset input
                  }
                }}
              />
            </label>
          )}
          {onExport && (

            <button className="flex items-center gap-2 px-4 py-2 bg-[#383d71] text-white rounded-lg hover:bg-[#2d3159] transition-colors" onClick={onExport}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 7v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" />
                <polyline points="3 4 5 6 7 4" />
                <line x1="5" y1="6" x2="5" y2="1" />
              </svg>

              Export
            </button>
          )}
          {buttonLink && buttonLabel && canCreate && (
            <Link href={buttonLink} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              {buttonLabel}
              <svg width="18" height="18" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22.5C17.5228 22.5 22 18.0228 22 12.5C22 6.97715 17.5228 2.5 12 2.5C6.47715 2.5 2 6.97715 2 12.5C2 18.0228 6.47715 22.5 12 22.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 8.5V16.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 12.5H16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

            </Link>
          )}
        </div>
      </div>
      {/* <div className="text-right mt-1 mb-2">
        <Link href="#" download className="text-xs btn btn-outline">
            Download sample CSV
          </Link>
      </div> */}

    </div >
  );
};

export default CommonHeader;