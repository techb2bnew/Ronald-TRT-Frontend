// components/CommonHeader.tsx
import Link from 'next/link';
import React from 'react';

interface CommonHeaderProps {
  heading: string;
  title: string;
  onSearch: (searchTerm: string) => void;
}

const CommonHeader: React.FC<CommonHeaderProps> = ({ title, heading, onSearch }) => {
  return (
    <div className="px-4">
      <div className="flex items-center justify-between  w-full">
        <div>
        <h1 className="text-lg leading-6 font-bold text-gray-900">{heading}</h1>
        <p className='text-sm'>{title}</p>
        </div>
        <div className='flex gap-4'>
        <div className="flex max-w-lg">
        <input
          type="search"
          className="input text-xs input-bordered w-full p-2 rounded border border-gray-400"
          placeholder="Search technician"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
          <button className="text-xs border border-gray-300 p-1 pl-5 pr-5 bg-white rounded">
            Import
          </button>
          <button className="text-xs border border-gray-300 p-1 pl-5 pr-5 bg-white rounded">
            Export
          </button>
          <button className="text-xs border border-black-500 p-1 pl-5 pr-5 bg-black text-white rounded">
            Filters
          </button>
          
        </div>
      </div>
      <div className="text-right mt-1 mb-2">
        <Link href="#" download className="text-xs btn btn-outline">
            Download sample CSV
          </Link>
      </div>
      
    </div>
  );
};

export default CommonHeader;
