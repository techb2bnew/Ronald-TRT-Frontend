// components/CommonHeader.tsx
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import TextField from '@mui/material/TextField';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { addDays } from 'date-fns';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // core styles
import 'react-date-range/dist/theme/default.css'; // theme styles

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
}



const CommonHeader: React.FC<CommonHeaderProps> = ({ heading, onSearch, buttonLabel, buttonLink, userRole, additionalComponents, onColumnSelect, onExport, onImport, onPageSizeChange, onCompletedClick, onInProgressClick, onCompletedJobClick, onInProgressJobClick, onAllJobsClick, showDatePicker, onDateChange, onNewJobClick, onNewTechClick, roleType }) => {

  const [permissions, setPermissions] = useState<any[]>([]);
  const [showDatePickers, setShowDatePicker] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]); 
  const [tech, setTech] = useState<any[]>([]); 
  const [jobsFilter, setJobsFilter] = useState<string>('');
  const [techFilter, settechFilter] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>(''); // State for selected job ID
  const [selectedTechId, setSelectedTechId] = useState<string>(''); // State for selected job ID
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [dates, setDates] = useState<{ startDate: Date | null, endDate: Date | null }>({
    startDate: null,
    endDate: null
  });
  const effectiveRoleType = roleType || localStorage.getItem('types') || '';
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
  if (effectiveRoleType === 'superadmin') {
    url = `/api/jobListing?page=${page}&roleType=${encodeURIComponent(effectiveRoleType)}`;
  } else if (effectiveRoleType === 'single-technician') {
    url = `/api/jobListing?page=${page}&roleType=single-technician`;
  } else {
    url = `/api/jobListing?userId=${userId}&page=${page}`;
  }

  try {
    const response = await fetch(url, { headers });
    const data = await response.json();

    if (response.ok) {
      const fetchedJobs = data.jobs?.jobs || [];
      setJobs((prev) => [...prev, ...fetchedJobs]);
      setHasMore(fetchedJobs.length > 0);
    } else {
      console.error('Error fetching job data:', data.error);
    }
  } catch (error) {
    console.error('Error fetching job data:', error);
  }
};




 
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
    if (bottom && hasMore) {
      setPage(prev => prev + 1);
    }
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



  return (
    <div className="px-1 mb-4">
      <div className="flex items-center justify-between  w-full">
        <div>
          <h1 className="text-lg leading-6 font-bold text-gray-900">{heading}</h1>
          {/* <p className='text-sm'>{title}</p> */}
        </div>
        <div className='flex items-center gap-4'>
          {onSearch && (

            <div className="flex w-[250px] relative search__input">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', right: '10px', top: '12px', zIndex: '1' }} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <TextField fullWidth size="small" type='text' id="outlined-basic" color="warning" label="Search" variant="filled" onChange={(e) => onSearch(e.target.value)} />
            </div>
          )}
          {onNewJobClick && (
            <FormControl size="small" variant="outlined" className="w-[180px]">
              <InputLabel id="job-dropdown-label" color="warning">Jobs</InputLabel>
              <Select
                labelId="job-dropdown-label"
                id="job-dropdown"
                value={jobsFilter}
                onChange={handleJobFilterChange}
                label="Jobs"
                color="warning"
                MenuProps={{
                  PaperProps: {
                    onScroll: handleScroll,
                    style: {
                      maxHeight: 300, // Fixed height in pixels
                      width: 250, // Optional: set width if needed
                    },
                  },
                }}
              >
                {jobs?.length > 0 ? (
                  jobs?.map((job) => (
                    <MenuItem key={`${job.id}-${job.jobName}`} value={job.id}>{job.jobName}</MenuItem>
                  ))
                ) : (
                  <MenuItem value="">No Jobs Available</MenuItem>
                )}
              </Select>
            </FormControl>
          )}

          {onNewTechClick && (
            <FormControl size="small" variant="outlined" className="w-[180px]">
              <InputLabel id="tech-dropdown-label" color="warning">Technician</InputLabel>
              <Select
                labelId="tech-dropdown-label"
                id="tech-dropdown"
                value={techFilter}
                onChange={handleTechFilterChange}
                label="Technician"
                color="warning"
                MenuProps={{
                  PaperProps: {
                    onScroll: handleTechScroll,
                    style: {
                      maxHeight: 300, // Fixed height in pixels
                      width: 250, // Optional: set width if needed
                    },
                  },
                }}
              >
                {tech?.length > 0 ? (
                  tech?.map((tech) => (
                    <MenuItem key={`tech-${tech.id}-${tech.firstName}-${tech.lastName}-${Math.random().toString(36).substr(2, 9)}`}  value={tech.id}>{tech.firstName} {tech.lastName}</MenuItem>
                  ))
                ) : (
                  <MenuItem value="">No Technician Available</MenuItem>
                )}
              </Select>
            </FormControl>
          )}

          {additionalComponents && (
            <div className="flex items-center gap-4">
              {additionalComponents}
            </div>
          )}
          {showDatePicker && (
            <button
              className="p-3 bg-white text-[12px] rounded"
              onClick={handleDateFilterClick}
            >
              Date Filter
            </button>
          )}
          {showDatePickers && (
            <div className="absolute z-40" style={{ top: '14rem' }}>
              <DateRange
                editableDateInputs={true}
                onChange={handleDateChange}
                moveRangeOnFirstSelection={false}
                ranges={[{ startDate: dates.startDate || new Date(), endDate: dates.endDate || addDays(new Date(), 1), key: 'selection' }]}
                rangeColors={["#383d71"]}
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




          {onPageSizeChange && (

            <select name="" id="" className='w-[150px] p-3 text-[12px]' onChange={(e) => onPageSizeChange?.(parseInt(e.target.value as string))}>
              <option value="">Number of rows</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="40">40</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          )}
          {(onCompletedJobClick || onInProgressJobClick) && (
            <FormControl size="small" variant="outlined" className="w-[180px]">
              <InputLabel id="job-status-label" color="warning">Job Status</InputLabel>
              <Select
                labelId="job-status-label"
                id="job-status-select"
                value={activeFilter}
                onChange={handleFilterChange}
                label="Job Status"
                color="warning"
              >
                <MenuItem value="all">All Jobs</MenuItem>
                <MenuItem value="completed">Completed Jobs</MenuItem>
                <MenuItem value="inProgress">In Progress Jobs</MenuItem>
              </Select>
            </FormControl>
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
              className={`text-xs border border-gray-300 p-3 pl-5 pr-5 rounded 
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

            <label className="text-xs border border-gray-300 p-3 pl-5 pr-5 bg-white rounded flex items-center gap-2 cursor-pointer hover:text-white hover:bg-[#383d71]">
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

            <button className="text-xs border border-gray-300 p-3 pl-5 pr-5 bg-white rounded flex items-center gap-2 hover:text-white hover:bg-[#383d71]" onClick={onExport}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 7v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" />
                <polyline points="3 4 5 6 7 4" />
                <line x1="5" y1="6" x2="5" y2="1" />
              </svg>

              Export
            </button>
          )}
          {buttonLink && buttonLabel && canCreate && (
            <Link href={buttonLink} className="primary-bg text-xs border border-black-500 p-3 pl-5 pr-5 bg-black text-white rounded flex items-center gap-2">
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