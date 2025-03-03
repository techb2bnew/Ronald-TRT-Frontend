"use client";
import TechniciansListing from '../listing/technicians'
import React, { useState } from 'react';
import Sidebar from '../../component/sidebar/page';
import AuthCheck from '@/app/component/AuthCheck';  
// import Link from 'next/link';
 
export default function Technicians() { 
 
  return (
    <>
    <AuthCheck>
    <div className='main-container'>
        <Sidebar />
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem]">
         {/* <Link href='/technicians/listing'>Technicians</Link> */}
            <TechniciansListing />
        </div>
    </div>
    </AuthCheck>
    </>

  );
}
