"use client";
import TechniciansCreat from './create'
import React, { useState } from 'react';
import Sidebar from '../../component/sidebar/page';
import AuthCheck from '@/app/component/AuthCheck';

export default function TechniciansCreate() {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 3; // Sample total pages
  
  return (
    <AuthCheck>
    <div className='main-container'>
        {/* <Sidebar /> */}
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem] lg:w-[85%] lg:ml-auto w-full pl-4 pr-4 ml-0">
            <TechniciansCreat /> 
        </div>
    </div>
    </AuthCheck>
  );
}
