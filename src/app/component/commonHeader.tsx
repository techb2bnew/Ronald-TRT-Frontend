// components/CommonHeader.tsx
import Link from 'next/link';
import React, { useEffect, useState } from "react";
import plusIcon from '../../../public/plus-circle.png'
import Image from 'next/image'; 
import TextField from '@mui/material/TextField';

interface CommonHeaderProps {
  heading: string;
  // title: string;
  onSearch: (searchTerm: string) => void;
  buttonLabel: string;
  buttonLink: string;
  userRole: string; 
  onExport?: () => void; 
}
 

const CommonHeader: React.FC<CommonHeaderProps> = ({  heading, onSearch, buttonLabel, buttonLink , userRole, onExport  }) => {

const [permissions, setPermissions] = useState<any[]>([]);

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
  return (
    <div className="px-1 mb-4">
      <div className="flex items-center justify-between  w-full">
        <div>
        <h1 className="text-lg leading-6 font-bold text-gray-900">{heading}</h1>
        {/* <p className='text-sm'>{title}</p> */}
        </div>
        <div className='flex items-center gap-4'>
        <div className="flex w-[250]">
         
      <TextField fullWidth size="small" type='search' id="outlined-basic" color="warning" label="Search"  variant="outlined"   onChange={(e) => onSearch(e.target.value)}  />
        
      </div>
          <button className="text-xs border border-gray-300 p-2 pl-5 pr-5 bg-white rounded"  onClick={onExport}>
            Export
          </button>
          {buttonLink && buttonLabel && canCreate && (
          <Link href={buttonLink} className="text-xs border border-black-500 p-2 pl-5 pr-5 bg-black text-white rounded flex items-center gap-2">
          {buttonLabel}
          <svg width="18" height="18" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22.5C17.5228 22.5 22 18.0228 22 12.5C22 6.97715 17.5228 2.5 12 2.5C6.47715 2.5 2 6.97715 2 12.5C2 18.0228 6.47715 22.5 12 22.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8.5V16.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12.5H16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
