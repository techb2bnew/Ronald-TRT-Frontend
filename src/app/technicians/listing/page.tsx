"use client";
import TechniciansListing from '../listing/technicians'
import React, { useState } from 'react';
import Pagination from '../../component/pagination';
import Sidebar from '../../component/sidebar/page';
export default function Technicians() {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 3; // Sample total pages
  
  return (
    <div className='main-container'>
        <Sidebar />
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem]">
            <TechniciansListing />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    </div>
  );
}
