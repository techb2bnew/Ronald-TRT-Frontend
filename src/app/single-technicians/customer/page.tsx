"use client";
import CustomerListing from './client'
import React, { useState } from 'react'; 
import AuthCheck from '@/app/component/AuthCheck'; 

export default function Technicians() { 
  
  return (
    <AuthCheck>
    <div className='main-container'> 
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem]">
            <CustomerListing />
        </div>
    </div>
    </AuthCheck>
  );
}
