// components/CommonHeader.tsx
import Link from 'next/link';
import { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from 'react';
import TextField from '@mui/material/TextField';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { addDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
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
  /** Work order list: compare scanned vs insurance VINs (superadmin). */
  onCompareWorkOrderClick?: () => void;
  compareWorkOrderLabel?: string;
}



const CommonHeader: React.FC<CommonHeaderProps> = ({ heading, onSearch, buttonLabel, buttonLink, userRole, additionalComponents, onColumnSelect, onExport, onImport, onPageSizeChange, onCompletedClick, onInProgressClick, onCompletedJobClick, onInProgressJobClick, onAllJobsClick, showDatePicker, onDateChange, onNewJobClick, onNewTechClick, roleType, onCustomerChange, onStatusChange, onInvoiceStatueChange, onClearFilters, showClearFilters = false, onCompareWorkOrderClick, compareWorkOrderLabel = 'Compare work order', }) => {

  const [permissions, setPermissions] = useState<any[]>([]);
  const [showDatePickers, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const customerSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState<string>('');

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
  const [customerHasMore, setCustomerHasMore] = useState(true);
  const [techHasMore, setTechHasMore] = useState(true);
  const [jobsHasMore, setJobsHasMore] = useState(true);
  const [customerPage, setCustomerPage] = useState(1);
  const [techPage, setTechPage] = useState(1);
  const jobPageRef = useRef(1);
  const [effectiveRoleType, setEffectiveRoleType] = useState(roleType || '');
  const [customer, setCustomer] = useState<any[]>([]);
  const [customerJobs, setCustomerJobs] = useState<any[]>([]);
  const [workOrderStatus, setWorkOrderStatus] = useState<string>("");
  const [invoiceStatus, setInvoiceStatus] = useState<string>("");
  const [searchValue, setSearchValue] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [isCustomerSearching, setIsCustomerSearching] = useState<boolean>(false);

  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false);
  const jobDropdownRef = useRef<HTMLDivElement>(null);
  const jobSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jobFetchInFlightRef = useRef(false);
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [debouncedJobSearch, setDebouncedJobSearch] = useState('');

  // Close customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
        if (customerSearchTerm.trim()) {
          setCustomerSearchTerm('');
          setIsCustomerSearching(false);
          setCustomer([]);
          setCustomerPage(1);
          fetchCustomer(1, effectiveRoleType);
        }
      }
    };

    if (isCustomerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomerDropdownOpen, customerSearchTerm, effectiveRoleType]);

  useEffect(() => {
    const handleJobClickOutside = (event: MouseEvent) => {
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(event.target as Node)) {
        setIsJobDropdownOpen(false);
        if (jobSearchTerm.trim()) {
          setJobSearchTerm('');
        }
      }
    };
    if (isJobDropdownOpen) {
      document.addEventListener('mousedown', handleJobClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleJobClickOutside);
  }, [isJobDropdownOpen, jobSearchTerm]);

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

  const JOBS_LIMIT = 10;

  const fetchJobsPage = useCallback(
    async (pageNum: number, append: boolean, searchQuery: string) => {
      const rt = effectiveRoleType || '';
      if (!rt) return;
      if (jobFetchInFlightRef.current) return;
      jobFetchInFlightRef.current = true;
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userID');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        const params = new URLSearchParams();
        params.set('page', String(pageNum));
        params.set('limit', String(JOBS_LIMIT));
        params.set('roleType', rt);
        const q = searchQuery.trim();
        if (q) params.set('searchQuery', q);
        if (rt !== 'superadmin' && rt !== 'manager' && userId) {
          params.set('userId', userId);
        }

        const response = await fetch(`/api/jobListing?${params.toString()}`, { headers });
        const data = await response.json();

        if (response.ok) {
          const fetchedJobs = data.jobs?.jobs || [];
          const totalPages = Number(data.jobs?.totalPages ?? 1);
          setJobs((prev) => {
            if (!append) return fetchedJobs;
            const existingIds = new Set(prev.map((job: any) => job.id));
            const newJobs = fetchedJobs.filter((job: any) => !existingIds.has(job.id));
            return [...prev, ...newJobs];
          });
          setJobsHasMore(pageNum < totalPages);
        } else {
          console.error('Error fetching job data:', data.error);
        }
      } catch (error) {
        console.error('Error fetching job data:', error);
      } finally {
        jobFetchInFlightRef.current = false;
      }
    },
    [effectiveRoleType]
  );

  useEffect(() => {
    const delay = jobSearchTerm.trim() ? 350 : 0;
    const t = setTimeout(() => setDebouncedJobSearch(jobSearchTerm), delay);
    return () => clearTimeout(t);
  }, [jobSearchTerm]);

  useEffect(() => {
    jobPageRef.current = 1;
    fetchJobsPage(1, false, debouncedJobSearch);
  }, [debouncedJobSearch, effectiveRoleType, fetchJobsPage]);

  const handleJobListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (customerFilter) return;
    const el = e.currentTarget;
    const bottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    if (!bottom || !jobsHasMore || jobFetchInFlightRef.current) return;
    jobPageRef.current += 1;
    fetchJobsPage(jobPageRef.current, true, debouncedJobSearch);
  };

  const filteredCustomerJobs = useMemo(() => {
    if (!customerFilter) return [];
    const q = jobSearchTerm.trim().toLowerCase();
    if (!q) return customerJobs;
    return customerJobs.filter((j: any) =>
      String(j.jobName ?? '').toLowerCase().includes(q)
    );
  }, [customerFilter, customerJobs, jobSearchTerm]);

  const selectedJobLabel = useMemo(() => {
    if (!jobsFilter) return '';
    if (customerFilter) {
      const j = customerJobs.find((x: any) => String(x.id) === String(jobsFilter));
      return j?.jobName ? String(j.jobName) : '';
    }
    const j = jobs.find((x: any) => String(x.id) === String(jobsFilter));
    return j?.jobName ? String(j.jobName) : '';
  }, [jobsFilter, customerFilter, customerJobs, jobs]);

  const fetchCustomer = async (page = 1, passedRoleType: string) => {
    try {
      const token = localStorage.getItem('token');
      // const userId = localStorage.getItem('userID');
      const roleTypeFromStorage = localStorage.getItem('types') || '';
      const role = passedRoleType || roleTypeFromStorage;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // For single-technician dropdown: show ALL customers
      const limit = 1000;
      const url =
        role === 'single-technician'
          ? `${apiUrl}/fetchAllCustomer?page=${page}&limit=${limit}&roleType=single-technician`
          : `/api/fetchJobCustomerTechnician?endpoint=fetchCustomer&roleType=${encodeURIComponent(role)}&page=${page}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      const newCustomers =
        role === 'single-technician'
          ? (data?.customers?.customers || data?.customers || data?.data?.customers || [])
          : (data?.customers?.customers || []);

      setCustomer((prevCustomers) => {
        const uniqueCustomers = [...prevCustomers];

        if (Array.isArray(newCustomers)) {
          newCustomers.forEach((customer: any) => {
            if (customer?.id && !uniqueCustomers.some(c => c.id === customer.id)) {
              uniqueCustomers.push(customer);
            }
          });
        }

        // If we asked for "all" in a single request, stop paginating.
        if (role === 'single-technician') {
          setCustomerHasMore(Array.isArray(newCustomers) ? newCustomers.length >= limit : false);
        } else {
          setCustomerHasMore(Array.isArray(newCustomers) ? newCustomers.length > 0 : false);
        }

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
    fetchCustomer(customerPage, effectiveRoleType);
  }, [customerPage, effectiveRoleType]);



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
        setTech((prev) => (page === 1 ? fetchedTech : [...prev, ...fetchedTech]));
        setTechHasMore(fetchedTech.length > 0);
      } else {
        console.error('Error fetching job data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
    }
  };





  useLayoutEffect(() => {
    setTech([]);
    setTechPage(1);
  }, [effectiveRoleType]);

  useEffect(() => {
    fetchTech(techPage, effectiveRoleType);
  }, [techPage, effectiveRoleType]);


  const handleScroll = (e: any) => {
    const bottom = e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight;
    if (bottom && customerHasMore && !isCustomerSearching) {
      setCustomerPage((prev) => prev + 1);
    }
  };

  const searchCustomers = async (searchValue: string) => {
    if (!searchValue.trim()) {
      setIsCustomerSearching(false);
      setCustomer([]);
      setCustomerPage(1);
      fetchCustomer(1, effectiveRoleType);
      return;
    }

    try {
      setIsCustomerSearching(true);
      const token = localStorage.getItem('token');
      // const userId = localStorage.getItem('userID');
      const roleType = localStorage.getItem('types');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      const params = new URLSearchParams();
      params.set('searchQuery', searchValue);
      params.set('roleType', effectiveRoleType || roleType || 'single-technician');
      // keep userId as optional (some backends ignore it for single-technician)
      // if (userId) params.set('userId', userId);

      const response = await fetch(`${apiUrl}/searchCustomers?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const data = await response.json();
      console.log(data, 'datadata')

      const results = data?.customers || data?.data?.customers || [];
      console.log(results, 'resultsresultsresults')
      if (Array.isArray(results)) setCustomer(results);
      setCustomerHasMore(false);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    if (customerSearchDebounceRef.current) clearTimeout(customerSearchDebounceRef.current);
    customerSearchDebounceRef.current = setTimeout(() => {
      searchCustomers(value);
    }, 350);
  };

  const handleTechScroll = (e: any) => {
    const bottom = e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight;
    if (bottom && techHasMore) {
      setTechPage((prev) => prev + 1);
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

  const applyCustomerSelection = async (customerId: string, customerName?: string) => {
    setCustomerFilter(customerId);
    setSelectedCustomerId(customerId);
    setSelectedCustomerLabel(customerName || '');

    if (customerId) {
      const { jobs } = await fetchCustomerData(customerId);
      setCustomerJobs(jobs);
    } else {
      setCustomerJobs([]); // Reset customer jobs if no customer is selected
    }

    // Trigger the customer change event
    if (onCustomerChange) {
      onCustomerChange(customerId, 'single-technician'); // Pass the customer ID and role type
    }
  };
  const handleCustomerFilterChange = async (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    await applyCustomerSelection(value);
  };

  const handleClearFilters = async () => {
    jobPageRef.current = 1;
    setJobSearchTerm('');
    setDebouncedJobSearch('');
    setCustomerPage(1);
    setTechPage(1);
    setJobsFilter("");
    setCustomerFilter("");
    settechFilter("");
    setSelectedJobId("");
    setSelectedCustomerId("");
    setSelectedCustomerLabel("");
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
            <div className="relative" ref={customerDropdownRef}>
              <button
                type="button"
                className="w-[190px] h-[44px] min-h-[44px] px-3 pr-8 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 cursor-pointer text-left truncate"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' strokeLinejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
                onClick={() => {
                  const next = !isCustomerDropdownOpen;
                  setIsCustomerDropdownOpen(next);
                  if (next && customer.length === 0) {
                    setCustomer([]);
                    setCustomerPage(1);
                    fetchCustomer(1, effectiveRoleType);
                  }
                }}
              >
                {customerFilter ? (selectedCustomerLabel || 'Selected customer') : 'Select customer'}
              </button>

              {isCustomerDropdownOpen && (
                <div className="absolute z-[9999] mt-1 w-[320px] bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      value={customerSearchTerm}
                      onChange={handleCustomerSearchChange}
                      placeholder="Search customer..."
                      className="w-full h-[38px] px-3 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                      autoFocus
                    />
                  </div>

                  <div
                    className="max-h-[260px] overflow-auto"
                    onScroll={handleScroll}
                  >
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${customerFilter === '' ? 'bg-gray-50' : ''}`}
                      onClick={async () => {
                        await applyCustomerSelection('', '');
                        setIsCustomerDropdownOpen(false);
                      }}
                    >
                      All customers
                    </button>

                    {customer.length > 0 ? (
                      customer.map((cust) => (
                        <button
                          key={`cust-${cust.id}`}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${cust.id === customerFilter ? 'bg-gray-50' : ''}`}
                          onClick={async () => {
                            await applyCustomerSelection(cust.id, cust.fullName || `${cust.firstName || ''} ${cust.lastName || ''}`.trim());
                            setIsCustomerDropdownOpen(false);
                          }}
                        >
                          {cust.fullName || `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || `#${cust.id}`}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-sm text-gray-500">
                        {customerSearchTerm.trim() ? 'No customer found' : 'Loading customers...'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}



          {onNewJobClick && (
            <div className="relative" ref={jobDropdownRef}>
              <button
                type="button"
                id="job-dropdown"
                className="w-[190px] h-[44px] min-h-[44px] px-3 pr-8 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 cursor-pointer text-left truncate"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' strokeLinejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
                onClick={() => {
                  const next = !isJobDropdownOpen;
                  setIsJobDropdownOpen(next);
                  if (next && !customerFilter && jobs.length === 0 && effectiveRoleType) {
                    jobPageRef.current = 1;
                    fetchJobsPage(1, false, debouncedJobSearch);
                  }
                }}
              >
                {jobsFilter ? (selectedJobLabel || 'Selected job') : 'All Jobs'}
              </button>

              {isJobDropdownOpen && (
                <div className="absolute z-[9999] mt-1 w-[320px] bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      value={jobSearchTerm}
                      onChange={(e) => setJobSearchTerm(e.target.value)}
                      placeholder="Search jobs…"
                      className="w-full h-[38px] px-3 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                      autoFocus
                    />
                  </div>

                  <div
                    className="max-h-[260px] overflow-auto"
                    onScroll={customerFilter ? undefined : handleJobListScroll}
                  >
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${jobsFilter === '' ? 'bg-gray-50' : ''}`}
                      onClick={() => {
                        handleJobFilterChange({ target: { value: '' } } as SelectChangeEvent<string>);
                        setIsJobDropdownOpen(false);
                      }}
                    >
                      All Jobs
                    </button>

                    {customerFilter ? (
                      filteredCustomerJobs.length > 0 ? (
                        filteredCustomerJobs.map((job: any) => (
                          <button
                            key={`${job.id}-${job.jobName}`}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 truncate ${String(job.id) === String(jobsFilter) ? 'bg-gray-50' : ''}`}
                            onClick={() => {
                              handleJobFilterChange({ target: { value: String(job.id) } } as SelectChangeEvent<string>);
                              setIsJobDropdownOpen(false);
                            }}
                          >
                            {job.jobName}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-sm text-gray-500">
                          {customerJobs.length === 0
                            ? 'No jobs for this customer'
                            : jobSearchTerm.trim()
                              ? 'No matching jobs'
                              : 'No jobs for this customer'}
                        </div>
                      )
                    ) : jobs.length > 0 ? (
                      jobs.map((job: any) => (
                        <button
                          key={`${job.id}-${job.jobName}`}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 truncate ${String(job.id) === String(jobsFilter) ? 'bg-gray-50' : ''}`}
                          onClick={() => {
                            handleJobFilterChange({ target: { value: String(job.id) } } as SelectChangeEvent<string>);
                            setIsJobDropdownOpen(false);
                          }}
                        >
                          {job.jobName}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-sm text-gray-500">
                        {!effectiveRoleType ? 'Loading…' : 'No jobs available'}
                      </div>
                    )}

                    {!customerFilter && jobsHasMore && jobs.length > 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100">
                        Scroll for more…
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {onStatusChange && (
            <select
              id="status-dropdown"
              defaultValue=""
              onChange={(e) => onStatusChange?.(e.target.value)}
              className="w-[140px] h-[44px] min-h-[44px] px-3 pr-8 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' strokeLinejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
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
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' strokeLinejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
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
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' strokeLinejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
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
                    locale={enUS}
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
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' strokeLinejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
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

          {onCompareWorkOrderClick && (
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 border border-[#383d71] text-[#383d71] rounded-lg hover:bg-[#383d71]/10 transition-colors"
              onClick={onCompareWorkOrderClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5" />
                <path d="M8 3H3v5" />
                <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
                <path d="m15 9 6-6" />
              </svg>
              {compareWorkOrderLabel}
            </button>
          )}
          {onImport && (

            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">

              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
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

              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180)">
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