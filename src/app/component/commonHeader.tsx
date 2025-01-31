// components/CommonHeader.tsx
import Link from 'next/link';
import React from 'react';
import plusIcon from '../../../public/plus-circle.png'
import Image from 'next/image'; 
import TextField from '@mui/material/TextField';

interface CommonHeaderProps {
  heading: string;
  // title: string;
  onSearch: (searchTerm: string) => void;
  buttonLabel: string;
  buttonLink: string;
}

const CommonHeader: React.FC<CommonHeaderProps> = ({  heading, onSearch, buttonLabel, buttonLink   }) => {
  return (
    <div className="px-3 mb-4">
      <div className="flex items-center justify-between  w-full">
        <div>
        <h1 className="text-lg leading-6 font-bold text-gray-900">{heading}</h1>
        {/* <p className='text-sm'>{title}</p> */}
        </div>
        <div className='flex items-center gap-4'>
        <div className="flex w-[250]">
         
      <TextField fullWidth size="small" id="outlined-basic" color="warning" label="Search"  variant="outlined"   onChange={(e) => onSearch(e.target.value)}  />
        
      </div>
          <button className="text-xs border border-gray-300 p-3 pl-5 pr-5 bg-white rounded">
            Export
          </button>
          <Link href={buttonLink} className="text-xs border border-black-500 p-2 pl-5 pr-5 bg-black text-white rounded flex items-center gap-2">
          {buttonLabel}
          <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22.5C17.5228 22.5 22 18.0228 22 12.5C22 6.97715 17.5228 2.5 12 2.5C6.47715 2.5 2 6.97715 2 12.5C2 18.0228 6.47715 22.5 12 22.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8.5V16.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12.5H16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          </Link>
          
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
