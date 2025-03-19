"use client";
import TechniciansListing from '../listing/technicians'
import React, { useState } from 'react'; 
import AuthCheck from '@/app/component/AuthCheck';  
// import Link from 'next/link';
 
export default function Technicians() { 
 
  return (
    <>
    <AuthCheck>
    <div className='main-container'> 
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem]"> 
            <TechniciansListing />
        </div>
    </div>
    </AuthCheck>
    </>

  );
}
