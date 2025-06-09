// components/CommonHeader.tsx
import Link from 'next/link';
import React, { useEffect, useState } from "react";
import TextField from '@mui/material/TextField';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';

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
}



const CommonHeader: React.FC<CommonHeaderProps> = ({ heading, onSearch, buttonLabel, buttonLink, userRole, additionalComponents, onColumnSelect, onExport, onImport, onPageSizeChange, onCompletedClick, onInProgressClick, onCompletedJobClick, onInProgressJobClick, onAllJobsClick }) => {

  const [permissions, setPermissions] = useState<any[]>([]);
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
      console.warn("⚠️ No permissions found in localStorage. Showing all icons.");
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

 const handleColumnChange = (event: SelectChangeEvent<string[]>) => {
  const value = event.target.value as string[];
  const filteredColumns = value.filter(col => col !== 'select'); 
  setSelectedColumn(filteredColumns);  // Update selected columns state
  if (onColumnSelect) onColumnSelect(filteredColumns);  // Pass the updated columns to parent if needed
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

            <div className="flex w-[350px] relative search__input">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', right: '10px', top: '12px', zIndex: '1' }} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <TextField fullWidth size="small" type='text' id="outlined-basic" color="warning" label="Search" variant="filled" onChange={(e) => onSearch(e.target.value)} />
            </div>
          )}
          {additionalComponents && (
            <div className="flex items-center gap-4">
              {additionalComponents}
            </div>
          )}

          {onColumnSelect && (
            <FormControl size="small" variant="outlined" className="w-[180px]">
              <InputLabel id="column-select-label">Select Column</InputLabel>
              <Select
                labelId="column-select-label"
                id="column-select"
                value={selectedColumn.length === 0 ? ['select'] : selectedColumn}
                onChange={handleColumnChange}
                label="Select Column"
                color="warning"
                renderValue={(selected) => {
                  if (selected.length === 0 || selected.includes('select')) {
                    return 'Select Columns';
                  }
                  return selected.join(', ');
                }}
                multiple
              >
                <MenuItem value="select">Select Columns</MenuItem>
                <MenuItem value="checkbox">Checkbox</MenuItem>
                <MenuItem value="id">ID</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="phoneNumber">Phone Number</MenuItem>
                <MenuItem value="address">Address</MenuItem>
                <MenuItem value="action">Action</MenuItem>
              </Select>

            </FormControl>
          )}

          {onPageSizeChange && (

            <select name="" id="" className='w-[180px] p-3 text-[12px]' onChange={(e) => onPageSizeChange?.(parseInt(e.target.value as string))}>
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

    </div>
  );
};

export default CommonHeader;
