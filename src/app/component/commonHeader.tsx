// components/CommonHeader.tsx
import Link from 'next/link';
import React from 'react';
import plusIcon from '../../../public/plus-circle.png'
import Image from 'next/image'; 

interface CommonHeaderProps {
  heading: string;
  title: string;
  onSearch: (searchTerm: string) => void;
  buttonLabel: string;
  buttonLink: string;
}

const CommonHeader: React.FC<CommonHeaderProps> = ({ title, heading, onSearch, buttonLabel, buttonLink   }) => {
  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between  w-full">
        <div>
        <h1 className="text-lg leading-6 font-bold text-gray-900">{heading}</h1>
        <p className='text-sm'>{title}</p>
        </div>
        <div className='flex gap-4'>
        <div className="flex w-[250]">
        <input
          type="search"
          className="input text-xs input-bordered w-full p-2 rounded border border-gray-400"
          placeholder="Search"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
          <button className="text-xs border border-gray-300 p-1 pl-5 pr-5 bg-white rounded">
            Export
          </button>
          <Link href={buttonLink}>
          <button className="text-xs border border-black-500 p-2 pl-5 pr-5 bg-black text-white rounded flex items-center gap-2">
          {buttonLabel}
            <Image src={plusIcon} alt='' height='18' width='18' />
          </button>
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
