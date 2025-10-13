"use client";
import ActiveJob from './listing'
import React, { useState } from 'react';
import Sidebar from '../../component/sidebar/page';
import AuthCheck from '@/app/component/AuthCheck';

export default function Technicians() {

  
  return (
    <AuthCheck>
    <div className='main-container'>
        {/* <Sidebar /> */}
        <div className="right_section w-[85%] pl-6 pr-8 ml-auto mt-[7rem] lg:w-[85%] lg:ml-auto w-full pl-4 pr-4 ml-0">
            <ActiveJob />
       
        </div>
    </div>
    </AuthCheck>
  );
}
